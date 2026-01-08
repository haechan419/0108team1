package com.Team1_Back.service;

import com.Team1_Back.domain.*;
import com.Team1_Back.dto.*;
import com.Team1_Back.repository.ApprovalActionLogRepository;
import com.Team1_Back.repository.ApprovalRequestRepository;
import com.Team1_Back.repository.ExpenseRepository;
import com.Team1_Back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalActionLogRepository approvalActionLogRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final ExpenseService expenseService;
    private final ModelMapper modelMapper;

    @Override
    public PageResponseDTO<ApprovalRequestDTO> getList(Long userId, boolean isAdmin, PageRequestDTO pageRequestDTO, String requestType, String status, LocalDate startDate, LocalDate endDate) {
        // 상신일 기준 정렬을 위한 Pageable (정렬은 Native Query에서 처리하므로 Pageable은 페이징만)
        Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize());

        String statusString = null;
        if (status != null && !status.isEmpty()) {
            try {
                ApprovalStatus.valueOf(status); // 유효성 검증용
                statusString = status; // Native Query용
            } catch (IllegalArgumentException e) {
                // 잘못된 status 값은 무시
            }
        }

        Page<ApprovalRequest> result;
        if (isAdmin) {
            // 관리자는 모든 요청 조회 (DRAFT 제외 - DRAFT는 ApprovalRequest가 없음)
            // 상신일 기준 정렬 사용 (Native Query 사용)
            boolean hasDateFilter = startDate != null && endDate != null;
            
            if (hasDateFilter) {
                // 상신일 필터가 있는 경우
                if (requestType != null && !requestType.isEmpty() && statusString != null) {
                    result = approvalRequestRepository.findByRequestTypeAndStatusSnapshotAndDateRange(requestType, statusString, startDate, endDate, pageable);
                } else if (requestType != null && !requestType.isEmpty()) {
                    result = approvalRequestRepository.findByRequestTypeAndDateRange(requestType, startDate, endDate, pageable);
                } else if (statusString != null) {
                    result = approvalRequestRepository.findByStatusSnapshotAndDateRange(statusString, startDate, endDate, pageable);
                } else {
                    result = approvalRequestRepository.findAllByDateRange(startDate, endDate, pageable);
                }
            } else {
                // 상신일 필터가 없는 경우
                if (requestType != null && !requestType.isEmpty() && statusString != null) {
                    result = approvalRequestRepository.findByRequestTypeAndStatusSnapshotOrderByReceiptDate(requestType, statusString, pageable);
                } else if (requestType != null && !requestType.isEmpty()) {
                    result = approvalRequestRepository.findByRequestTypeOrderByReceiptDate(requestType, pageable);
                } else if (statusString != null) {
                    result = approvalRequestRepository.findByStatusSnapshotOrderByReceiptDate(statusString, pageable);
                } else {
                    // status 필터가 없으면 모든 상태 조회 (DRAFT 제외)
                    result = approvalRequestRepository.findAllOrderByReceiptDate(pageable);
                }
            }
        } else {
            // 일반 직원은 본인 요청만 조회
            // 상신일 기준 정렬 사용 (Native Query 사용)
            // 일반 직원용 상신일 필터는 향후 필요시 추가
            if (statusString != null) {
                result = approvalRequestRepository.findByRequesterIdAndStatusSnapshotOrderByReceiptDate(userId, statusString, pageable);
            } else {
                result = approvalRequestRepository.findByRequesterIdOrderByReceiptDate(userId, pageable);
            }
        }

        List<ApprovalRequestDTO> dtoList = result.getContent().stream()
                .map(this::entityToDTO)
                .collect(Collectors.toList());

        long totalCount = result.getTotalElements();
        
        // DRAFT 상태는 결재 관리에서 제외 (아직 제출되지 않은 상태이므로)
        // DRAFT는 "내 지출 내역" 페이지에서만 관리

        // ✅ 최적화: EXPENSE 타입인 경우 Expense 정보를 한번에 조회하여 포함
        if ("EXPENSE".equals(requestType) || requestType == null) {
            // refId 목록 추출 (EXPENSE 타입만)
            List<Long> refIds = dtoList.stream()
                    .filter(dto -> "EXPENSE".equals(dto.getRequestType()) && dto.getRefId() != null)
                    .map(ApprovalRequestDTO::getRefId)
                    .distinct()
                    .collect(Collectors.toList());

            // 한번에 모든 Expense 조회
            if (!refIds.isEmpty()) {
                java.util.Map<Long, ExpenseDTO> expenseMap = expenseService.getByIds(refIds);

                // 각 ApprovalRequestDTO에 Expense 정보 추가
                dtoList.forEach(dto -> {
                    if ("EXPENSE".equals(dto.getRequestType()) && dto.getRefId() != null) {
                        dto.setExpense(expenseMap.get(dto.getRefId()));
                    }
                });
            }
        }
        return PageResponseDTO.of(
                dtoList,
                pageRequestDTO,
                totalCount
        );
    }

    @Override
    public ApprovalRequestDTO get(Long id, Long userId, boolean isAdmin) {
        // requester, approver를 함께 로드 (LAZY 로딩 방지)
        ApprovalRequest approvalRequest = approvalRequestRepository.findByIdWithRelations(id)
                .orElseThrow();

        // 권한 확인
        if (!isAdmin && !approvalRequest.getRequester().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        return entityToDTO(approvalRequest);
    }

    @Override
    public List<ApprovalActionLogDTO> getLogs(Long id, Long userId, boolean isAdmin) {
        // requester, approver를 함께 로드 (LAZY 로딩 방지)
        ApprovalRequest approvalRequest = approvalRequestRepository.findByIdWithRelations(id)
                .orElseThrow();

        // 권한 확인
        if (!isAdmin && !approvalRequest.getRequester().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        List<ApprovalActionLog> logs = approvalActionLogRepository.findByApprovalRequestIdOrderByCreatedAtAsc(id);

        return logs.stream()
                .map(this::logEntityToDTO)
                .collect(Collectors.toList());
    }

   /**
 * ApprovalRequest 엔티티를 ApprovalRequestDTO로 변환합니다.
 * ModelMapper의 Ambiguity(모호성) 에러를 해결하기 위해 직접 Builder로 매핑합니다.
 */
private ApprovalRequestDTO entityToDTO(ApprovalRequest entity) {
    if (entity == null) return null;

    // 🎯 제공해주신 DTO 필드명에 1:1로 매칭했습니다.
    return ApprovalRequestDTO.builder()
            .id(entity.getId())
            .requestType(entity.getRequestType())
            .refId(entity.getRefId())
            // 기안자(Requester) 매핑 - User 엔티티에서 추출
            .requesterId(entity.getRequester() != null ? entity.getRequester().getId() : null)
            .requesterName(entity.getRequester() != null ? entity.getRequester().getName() : null)
            // 결재자(Approver) 매핑 - User 엔티티에서 추출
            .approverId(entity.getApprover() != null ? entity.getApprover().getId() : null)
            .approverName(entity.getApprover() != null ? entity.getApprover().getName() : null)
            // 상태(Enum)를 String으로 변환
            .statusSnapshot(entity.getStatusSnapshot() != null ? entity.getStatusSnapshot().name() : null)
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            // expense 정보는 getList 메서드 하단에서 별도로 set 하므로 여기서는 비워둡니다.
            .build();
}

    @Override
    @Transactional
    public ApprovalRequestDTO action(Long id, ApprovalActionDTO actionDTO, Long adminId) {
        try {
            log.info("🔍 결재 처리 시작 - id: {}, adminId: {}, actionDTO: {}", id, adminId, actionDTO);
            
            if (id == null) {
                log.error("❌ 결재 요청 ID가 null입니다.");
                throw new RuntimeException("결재 요청 ID가 필요합니다.");
            }
            
            if (actionDTO == null) {
                log.error("❌ ApprovalActionDTO가 null입니다.");
                throw new RuntimeException("결재 처리 정보가 필요합니다.");
            }
            
            // requester, approver를 함께 로드 (LAZY 로딩 방지)
            ApprovalRequest approvalRequest = approvalRequestRepository.findByIdWithRelations(id)
                    .orElseThrow();

            User admin = userRepository.findById(adminId)
                    .orElseThrow();

            if (!admin.isAdmin()) {
                log.warn("❌ 관리자 권한이 없습니다. adminId: {}, isAdmin: {}", adminId, admin.isAdmin());
                throw new RuntimeException("관리자 권한이 필요합니다.");
            }

            String action = actionDTO.getAction();
            String message = actionDTO.getMessage();
            
            log.info("📝 결재 처리 정보 - action: {}, message: {}, requestType: {}", 
                    action, message, approvalRequest.getRequestType());

            // requestType에 따라 분기 처리
            if ("EXPENSE".equals(approvalRequest.getRequestType())) {
                // 지출 내역 처리 (관리자용이므로 findByIdWithWriter 사용)
                Expense expense = expenseRepository.findByIdWithWriter(approvalRequest.getRefId())
                        .orElseThrow();

                log.info("📋 지출 내역 조회 완료 - expenseId: {}, 현재 상태: {}", expense.getId(), expense.getStatus());

                // Expense 상태 업데이트
                if ("APPROVE".equals(action)) {
                    expense.approve();
                    log.info("✅ 승인 처리 - expenseId: {}", expense.getId());
                } else if ("REJECT".equals(action)) {
                    expense.reject(message);
                    log.info("❌ 반려 처리 - expenseId: {}, message: {}", expense.getId(), message);
                } else if ("REQUEST_MORE_INFO".equals(action)) {
                    expense.requestMoreInfo(message);
                    log.info("📝 보완 요청 처리 - expenseId: {}, message: {}", expense.getId(), message);
                } else {
                    log.error("❌ 지원하지 않는 액션입니다. action: {}", action);
                    throw new RuntimeException("지원하지 않는 액션입니다: " + action);
                }

                expenseRepository.save(expense);
                log.info("💾 Expense 저장 완료 - expenseId: {}, 새 상태: {}", expense.getId(), expense.getStatus());

                // ApprovalRequest 상태 동기화
                approvalRequest.syncStatusSnapshot(expense.getStatus());
                approvalRequestRepository.save(approvalRequest);
                log.info("💾 ApprovalRequest 저장 완료 - approvalRequestId: {}, 새 상태: {}", 
                        approvalRequest.getId(), approvalRequest.getStatusSnapshot());

                // ApprovalActionLog 생성
                ApprovalActionLog actionLog = ApprovalActionLog.builder()
                        .approvalRequest(approvalRequest)
                        .actor(admin)
                        .action(action)
                        .message(message)
                        .build();

                approvalActionLogRepository.save(actionLog);
                log.info("✅ ApprovalActionLog 생성 완료 - action: {}, approvalRequestId: {}, actorId: {}", 
                        action, approvalRequest.getId(), admin.getId());

            } else {
                log.error("❌ 지원하지 않는 요청 타입입니다. requestType: {}", approvalRequest.getRequestType());
                throw new RuntimeException("지원하지 않는 요청 타입입니다: " + approvalRequest.getRequestType());
            }

            log.info("✅ 결재 처리 완료 - id: {}, action: {}", id, action);
            return entityToDTO(approvalRequest);
            
        } catch (RuntimeException e) {
            log.error("❌ 결재 처리 실패 - id: {}, error: {}", id, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("❌ 결재 처리 중 예상치 못한 오류 발생 - id: {}", id, e);
            throw new RuntimeException("결재 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * ApprovalActionLog 엔티티를 ApprovalActionLogDTO로 변환합니다 (하이브리드 방식).
     * 
     * <p>ModelMapper로 기본 필드를 매핑하고, 연관 엔티티가 필요한 부분은 수동으로 처리합니다.
     * 
     * @param entity 변환할 ApprovalActionLog 엔티티
     * @return ApprovalActionLogDTO (entity가 null이면 null 반환)
     */
    private ApprovalActionLogDTO logEntityToDTO(ApprovalActionLog entity) {
        if (entity == null) {
            return null;
        }
        
        // 1. ModelMapper로 기본 필드 매핑
        ApprovalActionLogDTO dto = modelMapper.map(entity, ApprovalActionLogDTO.class);
        
        // 2. 연관 엔티티 매핑 (수동 처리)
        if (entity.getApprovalRequest() != null) {
            dto.setApprovalRequestId(entity.getApprovalRequest().getId());
        }
        
        if (entity.getActor() != null) {
            dto.setActorId(entity.getActor().getId());
            dto.setActorName(entity.getActor().getName());
        }
        
        return dto;
    }
}

