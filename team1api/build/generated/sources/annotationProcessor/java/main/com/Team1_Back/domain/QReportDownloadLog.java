package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QReportDownloadLog is a Querydsl query type for ReportDownloadLog
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReportDownloadLog extends EntityPathBase<ReportDownloadLog> {

    private static final long serialVersionUID = -851524499L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QReportDownloadLog reportDownloadLog = new QReportDownloadLog("reportDownloadLog");

    public final DateTimePath<java.time.LocalDateTime> downloadedAt = createDateTime("downloadedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> downloadedBy = createNumber("downloadedBy", Long.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QReportFile reportFile;

    public final com.Team1_Back.report.entity.QReportJob reportJob;

    public QReportDownloadLog(String variable) {
        this(ReportDownloadLog.class, forVariable(variable), INITS);
    }

    public QReportDownloadLog(Path<? extends ReportDownloadLog> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QReportDownloadLog(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QReportDownloadLog(PathMetadata metadata, PathInits inits) {
        this(ReportDownloadLog.class, metadata, inits);
    }

    public QReportDownloadLog(Class<? extends ReportDownloadLog> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.reportFile = inits.isInitialized("reportFile") ? new QReportFile(forProperty("reportFile"), inits.get("reportFile")) : null;
        this.reportJob = inits.isInitialized("reportJob") ? new com.Team1_Back.report.entity.QReportJob(forProperty("reportJob")) : null;
    }

}

