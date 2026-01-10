package com.Team1_Back.report.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QReportJob is a Querydsl query type for ReportJob
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReportJob extends EntityPathBase<ReportJob> {

    private static final long serialVersionUID = -66968151L;

    public static final QReportJob reportJob = new QReportJob("reportJob");

    public final NumberPath<Integer> approvedCount = createNumber("approvedCount", Integer.class);

    public final NumberPath<Long> approvedTotal = createNumber("approvedTotal", Long.class);

    public final StringPath categoryJson = createString("categoryJson");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final EnumPath<com.Team1_Back.domain.enums.DataScope> dataScope = createEnum("dataScope", com.Team1_Back.domain.enums.DataScope.class);

    public final StringPath departmentSnapshot = createString("departmentSnapshot");

    public final StringPath errorMessage = createString("errorMessage");

    public final StringPath fileName = createString("fileName");

    public final StringPath filePath = createString("filePath");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final EnumPath<com.Team1_Back.domain.enums.OutputFormat> outputFormat = createEnum("outputFormat", com.Team1_Back.domain.enums.OutputFormat.class);

    public final StringPath period = createString("period");

    public final DatePath<java.time.LocalDate> periodEnd = createDate("periodEnd", java.time.LocalDate.class);

    public final DatePath<java.time.LocalDate> periodStart = createDate("periodStart", java.time.LocalDate.class);

    public final StringPath reportTypeId = createString("reportTypeId");

    public final NumberPath<Long> requestedBy = createNumber("requestedBy", Long.class);

    public final StringPath roleSnapshot = createString("roleSnapshot");

    public final EnumPath<com.Team1_Back.domain.enums.ReportStatus> status = createEnum("status", com.Team1_Back.domain.enums.ReportStatus.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QReportJob(String variable) {
        super(ReportJob.class, forVariable(variable));
    }

    public QReportJob(Path<? extends ReportJob> path) {
        super(path.getType(), path.getMetadata());
    }

    public QReportJob(PathMetadata metadata) {
        super(ReportJob.class, metadata);
    }

}

