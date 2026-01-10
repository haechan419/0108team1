package com.Team1_Back.service;

import com.Team1_Back.domain.Notice;
import com.Team1_Back.dto.NoticeDTO;
import com.Team1_Back.repository.NoticeRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.Optional;

@SpringBootTest
@Log4j2
public class NoticeServiceTests {

    @Autowired
    private NoticeService noticeService;

    @Autowired
    private NoticeRepository noticeRepository;

    @Test
    public void testRegisterNotice() {

        NoticeDTO noticeDTO = NoticeDTO.builder()
                .title("서비스 테스트 공지1")
                .content("NoticeService register 테스트입니다.")
                .writer("user00")
                .writerRole("ADMIN")
                .pinned(true)
                .createDate(LocalDateTime.now())
                .build();

        Long nno = noticeService.register(noticeDTO);

        Optional<Notice> saveNotice = noticeRepository.findById(nno);

        Notice notice = saveNotice.get();

        log.info("저장된 공지 번호: {}", notice.getNno());
        log.info("저장된 공지 제목: {}", notice.getTitle());
        log.info("작성자: {}", notice.getWriter());
        log.info("생성일: {}", notice.getCreateDate());

    }
}
