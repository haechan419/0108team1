package com.Team1_Back.service;

import com.Team1_Back.dto.RequestDTO;
import org.springframework.transaction.annotation.Transactional;
import java.util.List; // 리스트 사용을 위한 임포트 추가

@Transactional
public interface RequestService {

    // 1. 결재 요청 등록
    Long register(RequestDTO requestDTO);

    // 2. [NEW] 결재 요청 목록 조회
    List<RequestDTO> getList();

    void modifyStatus(Long rno, String status, String rejectReason);

}
