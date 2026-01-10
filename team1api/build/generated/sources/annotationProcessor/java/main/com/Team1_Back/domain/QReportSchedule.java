package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QReportSchedule is a Querydsl query type for ReportSchedule
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReportSchedule extends EntityPathBase<ReportSchedule> {

    private static final long serialVersionUID = 1236852070L;

    public static final QReportSchedule reportSchedule = new QReportSchedule("reportSchedule");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath cronExpr = createString("cronExpr");

    public final EnumPath<com.Team1_Back.domain.enums.DataScope> dataScope = createEnum("dataScope", com.Team1_Back.domain.enums.DataScope.class);

    public final NumberPath<Integer> failCount = createNumber("failCount", Integer.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final BooleanPath isEnabled = createBoolean("isEnabled");

    public final StringPath lastError = createString("lastError");

    public final NumberPath<Long> lastJobId = createNumber("lastJobId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> lastRunAt = createDateTime("lastRunAt", java.time.LocalDateTime.class);

    public final StringPath name = createString("name");

    public final DateTimePath<java.time.LocalDateTime> nextRunAt = createDateTime("nextRunAt", java.time.LocalDateTime.class);

    public final EnumPath<com.Team1_Back.domain.enums.OutputFormat> outputFormat = createEnum("outputFormat", com.Team1_Back.domain.enums.OutputFormat.class);

    public final EnumPath<com.Team1_Back.domain.enums.PeriodRule> periodRule = createEnum("periodRule", com.Team1_Back.domain.enums.PeriodRule.class);

    public final StringPath reportTypeCode = createString("reportTypeCode");

    public final StringPath reportTypeId = createString("reportTypeId");

    public final StringPath requestedBy = createString("requestedBy");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QReportSchedule(String variable) {
        super(ReportSchedule.class, forVariable(variable));
    }

    public QReportSchedule(Path<? extends ReportSchedule> path) {
        super(path.getType(), path.getMetadata());
    }

    public QReportSchedule(PathMetadata metadata) {
        super(ReportSchedule.class, metadata);
    }

}

