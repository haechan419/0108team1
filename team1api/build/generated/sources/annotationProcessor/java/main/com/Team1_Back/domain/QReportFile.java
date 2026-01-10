package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QReportFile is a Querydsl query type for ReportFile
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReportFile extends EntityPathBase<ReportFile> {

    private static final long serialVersionUID = 423493579L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QReportFile reportFile = new QReportFile("reportFile");

    public final StringPath checksum = createString("checksum");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath fileName = createString("fileName");

    public final NumberPath<Long> fileSize = createNumber("fileSize", Long.class);

    public final StringPath fileType = createString("fileType");

    public final StringPath fileUrl = createString("fileUrl");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final com.Team1_Back.report.entity.QReportJob reportJob;

    public QReportFile(String variable) {
        this(ReportFile.class, forVariable(variable), INITS);
    }

    public QReportFile(Path<? extends ReportFile> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QReportFile(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QReportFile(PathMetadata metadata, PathInits inits) {
        this(ReportFile.class, metadata, inits);
    }

    public QReportFile(Class<? extends ReportFile> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.reportJob = inits.isInitialized("reportJob") ? new com.Team1_Back.report.entity.QReportJob(forProperty("reportJob")) : null;
    }

}

