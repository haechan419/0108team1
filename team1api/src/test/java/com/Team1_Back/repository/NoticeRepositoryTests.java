package com.Team1_Back.repository;

import com.Team1_Back.domain.Notice;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@SpringBootTest
@Log4j2
public class NoticeRepositoryTests {

    @Autowired
    private NoticeRepository noticeRepository;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // 임의 데이터 1개 생성
    @Test
    void saveNoticeContent() {
        String longContent = "공지사항 입니다.".repeat(1000);
        Notice notice = Notice.builder()
                .title("긴급 공지사항")
                .content(longContent)
                .writer("user1")
                .writerRole("ADMIN")
                .pinned(true)
                .createDate(LocalDateTime.now())
                .build();

        noticeRepository.save(notice);
    }

    @Test
    void testInsertMockData100() {
        for (int i = 1; i <= 100; i++) {
            Notice notice = Notice.builder()
                    .title("테스트 공지사항 " + i)
                    .content("공지사항 내용입니다. 번호: " + i)
                    .writer("user" + i)
                    .writerRole("ADMIN")
                    .pinned(i % 10 == 0) // 10개마다 하나씩 상단 고정 설정 (총 10개)
                    .createDate(LocalDateTime.now().minusDays(100 - i)) // 날짜를 다르게 설정하여 정렬 테스트 용이
                    .build();

            noticeRepository.save(notice);
        }

        log.info("--- 100개의 목업 데이터 생성이 완료되었습니다. ---");
    }

    @Test
    void testReadAllNotices() {
        List<Notice> noticeList = noticeRepository.findAll();
        log.info("전체 공지 개수: {}", noticeList.size());

        noticeList.forEach(notice ->
                log.info("제목={}, 작성자={}, 생성일={}",
                        notice.getTitle(),
                        notice.getWriter(),
                        notice.getCreateDate().format(formatter)));
    }



}
