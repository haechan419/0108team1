package com.Team1_Back.repository;

import com.Team1_Back.domain.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    // pinned가 가장 먼저 나오고, 그 다음 최신순으로 정렬
    @Query("""
                SELECT n
                FROM Notice n
                WHERE n.delFlag = false
                ORDER BY n.pinned DESC, n.createDate DESC
            """)
    Page<Notice> findNoticePage(Pageable pageable);
}
