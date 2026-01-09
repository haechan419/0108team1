package com.Team1_Back.repository.projection;

import com.Team1_Back.domain.Expense;
import com.Team1_Back.repository.ApprovedAgg;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface ReportQueryRepository extends JpaRepository<Expense, Long> {

    @Query(value = """
        SELECT COALESCE(SUM(e.amount), 0) AS total,
               COUNT(*) AS cnt
        FROM expense e
        WHERE e.approval_status = 'APPROVED'
          AND e.created_at >= :start
          AND e.created_at <  :end
        """, nativeQuery = true)
    ApprovedAgg approvedSumAll(@Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);

    @Query(value = """
        SELECT COALESCE(SUM(e.amount), 0) AS total,
               COUNT(*) AS cnt
        FROM expense e
        WHERE e.approval_status = 'APPROVED'
          AND e.created_at >= :start
          AND e.created_at <  :end
          AND e.user_id = :userId
        """, nativeQuery = true)
    ApprovedAgg approvedSumByUser(@Param("userId") Long userId,
                                  @Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);

    @Query(value = """
        SELECT COALESCE(SUM(e.amount), 0) AS total,
               COUNT(*) AS cnt
        FROM expense e
        JOIN users u ON u.id = e.user_id
        WHERE e.approval_status = 'APPROVED'
          AND e.created_at >= :start
          AND e.created_at <  :end
          AND u.department_name = :dept
        """, nativeQuery = true)
    ApprovedAgg approvedSumByDept(@Param("dept") String dept,
                                  @Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);
}
