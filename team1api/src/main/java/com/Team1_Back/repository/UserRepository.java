package com.Team1_Back.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.Team1_Back.domain.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, UserRepositoryCustom {

    // 사번으로 사용자 정보를 조회합니다.
    Optional<User> findByEmployeeNo(String employeeNo);

    // 사번 중복 체크합니다
    boolean existsByEmployeeNo(String employeeNo);

    @Query(value =
            "SELECT DISTINCT department_name " +
                    "FROM users " +
                    "WHERE department_name IS NOT NULL " +
                    "ORDER BY department_name",
            nativeQuery = true)
    List<String> findDistinctDepartmentNames();
}
