package com.Team1_Back.service;

import com.Team1_Back.domain.*;
import com.Team1_Back.dto.ExpenseDTO;
import com.Team1_Back.dto.ExpenseSubmitDTO;
import com.Team1_Back.dto.PageRequestDTO;
import com.Team1_Back.dto.PageResponseDTO;
import com.Team1_Back.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final ReceiptUploadRepository receiptUploadRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalActionLogRepository approvalActionLogRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<ExpenseDTO> getList(Long userId, PageRequestDTO pageRequestDTO, String status,
            LocalDate startDate, LocalDate endDate) {
        if (pageRequestDTO == null) {
            pageRequestDTO = PageRequestDTO.builder().page(1).size(15).build();
        }

        // 상신일 기준 정렬 (최근 상신일 먼저), 같은 날짜면 최근 업데이트 먼저
        Pageable pageable = pageRequestDTO.getPageable("createdAt", "updatedAt");

        ApprovalStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try {
                statusEnum = ApprovalStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                log.warn("잘못된 status 값: " + status);
                // 잘못된 status 값은 무시
            }
        }

        Page<Expense> result;
        if (statusEnum != null && startDate != null && endDate != null) {
            result = expenseRepository.findByUserIdAndStatusAndDateRange(userId, statusEnum, startDate, endDate,
                    pageable);
        } else if (statusEnum != null) {
            result = expenseRepository.findByWriterIdAndStatus(userId, statusEnum, pageable);
        } else if (startDate != null && endDate != null) {
            result = expenseRepository.findByUserIdAndDateRange(userId, startDate, endDate, pageable);
        } else {
            result = expenseRepository.findByWriterId(userId, pageable);
        }

        log.info("getList..............");

        List<ExpenseDTO> dtoList = result.getContent().stream()
                .map(this::entityToDTO)
                .filter(dto -> dto != null)
                .collect(Collectors.toList());

        return PageResponseDTO.<ExpenseDTO>of(
                dtoList,
                pageRequestDTO,
                result.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseDTO get(Long id, Long userId, boolean isAdmin) {
        Optional<Expense> result;
        if (isAdmin) {
            // 관리자는 모든 지출 내역 조회 가능 (writer 정보 포함)
            result = expenseRepository.findByIdWithWriter(id);
        } else {
            // 일반 사용자는 본인 지출 내역만 조회
            result = expenseRepository.findByIdAndWriterId(id, userId);
        }
        Expense expense = result.orElseThrow();
        return entityToDTO(expense);
    }

    @Override
    public Long register(ExpenseDTO expenseDTO, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow();

        Expense expense = dtoToEntity(expenseDTO);
        expense.setWriter(user);
        expense.setStatus(ApprovalStatus.DRAFT);

        Expense saved = expenseRepository.save(expense);
        return saved.getId();
    }

    @Override
    public void modify(ExpenseDTO expenseDTO, Long userId) {
        Optional<Expense> result = expenseRepository.findByIdAndWriterId(expenseDTO.getId(), userId);
        Expense expense = result.orElseThrow();

        if (!expense.canModify()) {
            throw new IllegalStateException("수정할 수 없는 상태입니다.");
        }

        expense.setReceiptDate(expenseDTO.getReceiptDate());
        expense.setMerchant(expenseDTO.getMerchant());
        expense.setAmount(expenseDTO.getAmount());
        expense.setCategory(expenseDTO.getCategory());
        expense.setDescription(expenseDTO.getDescription());

        expenseRepository.save(expense);
    }

    @Override
    public void remove(Long id, Long userId) {
        Optional<Expense> result = expenseRepository.findByIdAndWriterId(id, userId);
        Expense expense = result.orElseThrow();

        if (!expense.canDelete()) {
            throw new IllegalStateException("삭제할 수 없는 상태입니다.");
        }

        expenseRepository.delete(expense);
    }

    @Override
    public void submit(Long id, Long userId, ExpenseSubmitDTO submitDTO) {
        Optional<Expense> result = expenseRepository.findByIdAndWriterId(id, userId);
        Expense expense = result.orElseThrow();

        expense.submit();
        if (submitDTO != null && submitDTO.getRequestNote() != null) {
            expense.setDescription(submitDTO.getRequestNote());
        }

        expenseRepository.save(expense);

        // ApprovalRequest 생성
        ApprovalRequest approvalRequest = ApprovalRequest.builder()
                .requestType("EXPENSE")
                .refId(expense.getId())
                .requester(expense.getWriter())
                .statusSnapshot(ApprovalStatus.SUBMITTED)
                .build();

        ApprovalRequest savedRequest = approvalRequestRepository.save(approvalRequest);

        // ApprovalActionLog 생성 (SUBMIT 액션)
        String message = (submitDTO != null && submitDTO.getRequestNote() != null)
                ? submitDTO.getRequestNote()
                : "지출 내역을 제출했습니다.";

        ApprovalActionLog actionLog = ApprovalActionLog.builder()
                .approvalRequest(savedRequest)
                .actor(expense.getWriter())
                .action("SUBMIT")
                .message(message)
                .build();

        approvalActionLogRepository.save(actionLog);
    }

    private Expense dtoToEntity(ExpenseDTO dto) {
        if (dto == null)
            return null;

        return Expense.builder()
                .id(dto.getId())
                .receiptDate(dto.getReceiptDate())
                .merchant(dto.getMerchant())
                .amount(dto.getAmount())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .receiptImageUrl(dto.getReceiptImageUrl())
                .status(ApprovalStatus.DRAFT) // 초기 상태 고정
                .build();
    }

    private ExpenseDTO entityToDTO(Expense entity) {
        if (entity == null)
            return null;

        User writer = entity.getWriter();

        // 1. Builder를 사용하여 수동으로 매핑 (ModelMapper 제거)
        ExpenseDTO dto = ExpenseDTO.builder()
                .id(entity.getId())
                .receiptDate(entity.getReceiptDate())
                .merchant(entity.getMerchant())
                .amount(entity.getAmount())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .userId(writer != null ? writer.getId() : null)
                .userName(writer != null ? writer.getName() : null)
                .receiptImageUrl(entity.getReceiptImageUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();

        // 2. Repository 조회가 필요한 추가 데이터 처리
        Optional<ReceiptUpload> receiptOpt = receiptUploadRepository.findByExpenseId(entity.getId());
        if (receiptOpt.isPresent()) {
            ReceiptUpload receipt = receiptOpt.get();
            dto.setReceiptId(receipt.getId());
            dto.setReceiptFileUrl(receipt.getFileUrl());
            dto.setHasReceipt(true);
        } else {
            dto.setHasReceipt(false);
        }

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Map<Long, ExpenseDTO> getByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new java.util.HashMap<>();
        }

        List<Expense> expenses = expenseRepository.findAllById(ids);
        return expenses.stream()
                .map(this::entityToDTO)
                .filter(dto -> dto != null)
                .collect(Collectors.toMap(ExpenseDTO::getId, java.util.function.Function.identity()));
    }
}
