package com.Team1_Back.service;

import com.Team1_Back.domain.Product; // ✨ 추가
import com.Team1_Back.domain.Request;
import com.Team1_Back.domain.RequestItem;
import com.Team1_Back.dto.RequestDTO;
import com.Team1_Back.dto.RequestItemDTO;
import com.Team1_Back.repository.ProductRepository; // ✨ 추가
import com.Team1_Back.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RequestServiceImpl implements RequestService {

    private final RequestRepository requestRepository;
    private final ProductRepository productRepository; // ✨ [수정] 주입 추가
    private final NotificationService notificationService;

    // 등록(결재 상신) - 기존과 동일
    @Override
    public Long register(RequestDTO requestDTO) {
        Request request = Request.builder()
                .requester(requestDTO.getRequester())
                .reason(requestDTO.getReason())
                .totalAmount(requestDTO.getTotalAmount())
                .build();

        List<RequestItemDTO> itemDTOs = requestDTO.getItems();
        if (itemDTOs != null && !itemDTOs.isEmpty()) {
            itemDTOs.forEach(itemDTO -> {
                RequestItem item = RequestItem.builder()
                        .pno(itemDTO.getPno())
                        .pname(itemDTO.getPname())
                        .price(itemDTO.getPrice())
                        .quantity(itemDTO.getQuantity())
                        .build();
                request.addItem(item);
            });
        }

        Request savedRequest = requestRepository.save(request);
        return savedRequest.getRno();
    }

    // 목록 조회 - 기존과 동일
    @Override
    public List<RequestDTO> getList() {
        List<Request> result = requestRepository.findAllRequests();

        return result.stream().map(req -> {
            List<RequestItemDTO> itemDTOs = req.getItems().stream().map(item -> RequestItemDTO.builder()
                    .pno(item.getPno())
                    .pname(item.getPname())
                    .price(item.getPrice())
                    .quantity(item.getQuantity())
                    .build()).collect(Collectors.toList());

            return RequestDTO.builder()
                    .rno(req.getRno())
                    .status(req.getStatus())
                    .regDate(req.getRegDate())
                    .requester(req.getRequester())
                    .reason(req.getReason())
                    .totalAmount(req.getTotalAmount())
                    .rejectReason(req.getRejectReason())
                    .items(itemDTOs)
                    .build();
        }).collect(Collectors.toList());
    }

    // ✨ 상태 변경 (승인 시 재고 차감 로직 추가)
    @Override
    public void modifyStatus(Long rno, String status, String rejectReason) {
        Request request = requestRepository.findById(rno)
                .orElseThrow(() -> new IllegalArgumentException("해당 요청이 없습니다. rno=" + rno));

        // 🚨 [핵심 추가] 승인 시 재고 차감
        if ("APPROVED".equals(status)) {
            log.info("🚀 승인 처리 시작 - 재고 차감 진행중 (rno: {})", rno);
            for (RequestItem item : request.getItems()) {
                // pno를 통해 상품 정보를 가져옴
                Product product = productRepository.findById(item.getPno())
                        .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다. pno=" + item.getPno()));

                // 미리 만들어둔 removeStock 메서드 호출
                product.removeStock(item.getQuantity());

                log.info("✅ 재고 차감 완료: 상품={}, 수량={}, 남은재고={}",
                        product.getPname(), item.getQuantity(), product.getStockQuantity());
            }
        }

        // 상태 변경 및 저장
        request.changeStatus(status, rejectReason);
        requestRepository.save(request);

        // 상태 알림 로직 (기존 동일)
        String msg = "";
        if ("APPROVED".equals(status)) {
            msg = "✅ 결재(No." + rno + ")가 [승인] 되었습니다.";
        } else if ("REJECTED".equals(status)) {
            msg = "⛔ 결재(No." + rno + ")가 [반려] 되었습니다. 사유: " + rejectReason;
        }

        if (!msg.isEmpty()) {
            notificationService.send(request.getRequester(), msg);
            log.info("🔔 알림 발송 완료: " + request.getRequester());
        }
    }
}