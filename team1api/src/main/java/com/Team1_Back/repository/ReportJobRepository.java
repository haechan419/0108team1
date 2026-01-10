package com.Team1_Back.repository;

import com.Team1_Back.report.entity.ReportJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReportJobRepository extends JpaRepository<ReportJob, Long> {

    Optional<ReportJob> findById(Long id);

}
