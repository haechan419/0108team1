package com.Team1_Back.repository;

import com.Team1_Back.domain.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RequestRepository extends JpaRepository<Request, Long> {
    
    // 목록 조회 시 아이템까지 한 번에 가져오기 (성능 최적화)
    // 최신순(rno 내림차순)으로 가져옵니다.
    @Query("select distinct r from Request r left join fetch r.items order by r.rno desc")
    List<Request> findAllRequests();
}