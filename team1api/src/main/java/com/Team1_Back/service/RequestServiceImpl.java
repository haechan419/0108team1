package com.Team1_Back.service;

import com.Team1_Back.domain.Request;
import com.Team1_Back.domain.RequestItem;
import com.Team1_Back.dto.RequestDTO;
import com.Team1_Back.dto.RequestItemDTO;
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

    // 1. 등록 (결재 상신)
    @Override
    public Long register(RequestDTO requestDTO) {
        
        // DTO -> Entity 변환 (주문 본체)
        Request request = Request.builder()
                .requester(requestDTO.getRequester())
                .reason(requestDTO.getReason())
                .totalAmount(requestDTO.getTotalAmount())
                .build();

        // 아이템들 변환해서 추가
        List<RequestItemDTO> itemDTOs = requestDTO.getItems();
        if (itemDTOs != null && !itemDTOs.isEmpty()) {
            itemDTOs.forEach(itemDTO -> {
                RequestItem item = RequestItem.builder()
                        .pno(itemDTO.getPno())
                        .pname(itemDTO.getPname())
                        .price(itemDTO.getPrice())
                        .quantity(itemDTO.getQuantity())
                        .build();
                request.addItem(item); // 연관관계 설정
            });
        }

        // 저장 (Cascade 설정 덕분에 items도 같이 저장됨)
        Request savedRequest = requestRepository.save(request);
        return savedRequest.getRno();
    }

    // 2. 목록 조회 (내 결재함용)
    @Override
    public List<RequestDTO> getList() {
        List<Request> result = requestRepository.findAllRequests();
        
        return result.stream().map(req -> {
            // Entity -> DTO 변환
            List<RequestItemDTO> itemDTOs = req.getItems().stream().map(item -> 
                RequestItemDTO.builder()
                    .pno(item.getPno())
                    .pname(item.getPname())
                    .price(item.getPrice())
                    .quantity(item.getQuantity())
                    .build()
            ).collect(Collectors.toList());

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

    // 3. 상태 변경 (승인/반려)
    @Override
    public void modifyStatus(Long rno, String status, String rejectReason) {
        Request request = requestRepository.findById(rno)
                .orElseThrow(() -> new IllegalArgumentException("해당 요청이 없습니다. rno=" + rno));
        
        request.changeStatus(status, rejectReason);
        requestRepository.save(request);
    }
}