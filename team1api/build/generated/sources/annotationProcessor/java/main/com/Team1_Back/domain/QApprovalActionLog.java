package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QApprovalActionLog is a Querydsl query type for ApprovalActionLog
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QApprovalActionLog extends EntityPathBase<ApprovalActionLog> {

    private static final long serialVersionUID = -295873840L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QApprovalActionLog approvalActionLog = new QApprovalActionLog("approvalActionLog");

    public final QBaseEntity _super = new QBaseEntity(this);

    public final StringPath action = createString("action");

    public final QUser actor;

    public final QApprovalRequest approvalRequest;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath message = createString("message");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QApprovalActionLog(String variable) {
        this(ApprovalActionLog.class, forVariable(variable), INITS);
    }

    public QApprovalActionLog(Path<? extends ApprovalActionLog> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QApprovalActionLog(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QApprovalActionLog(PathMetadata metadata, PathInits inits) {
        this(ApprovalActionLog.class, metadata, inits);
    }

    public QApprovalActionLog(Class<? extends ApprovalActionLog> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.actor = inits.isInitialized("actor") ? new QUser(forProperty("actor")) : null;
        this.approvalRequest = inits.isInitialized("approvalRequest") ? new QApprovalRequest(forProperty("approvalRequest"), inits.get("approvalRequest")) : null;
    }

}

