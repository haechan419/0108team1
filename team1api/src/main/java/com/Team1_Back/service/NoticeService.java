package com.Team1_Back.service;


import com.Team1_Back.dto.NoticeDTO;
import com.Team1_Back.dto.PageRequestDTO;
import com.Team1_Back.dto.PageResponseDTO;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

public interface NoticeService {

    // create(공지사항 생성)
    @PreAuthorize("hasRole('ADMIN')")
    Long register(NoticeDTO noticeDTO);

    // read(공지사항 목록 조회)
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    PageResponseDTO<NoticeDTO> getList(PageRequestDTO pageRequestDTO);

    // read(공지사항 세부 사항)
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    NoticeDTO get(Long nno);

    // update(공지사항 수정)
    @PreAuthorize("hasRole('ADMIN')")
    void modify(NoticeDTO noticeDTO);

    // delete(공지사항 삭제)
    @PreAuthorize("hasRole('ADMIN')")
    void delete(Long nno);
}
