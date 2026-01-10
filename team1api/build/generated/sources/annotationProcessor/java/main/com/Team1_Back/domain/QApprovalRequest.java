package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QApprovalRequest is a Querydsl query type for ApprovalRequest
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QApprovalRequest extends EntityPathBase<ApprovalRequest> {

    private static final long serialVersionUID = 585682097L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QApprovalRequest approvalRequest = new QApprovalRequest("approvalRequest");

    public final QBaseEntity _super = new QBaseEntity(this);

    public final QUser approver;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> refId = createNumber("refId", Long.class);

    public final QUser requester;

    public final StringPath requestType = createString("requestType");

    public final EnumPath<ApprovalStatus> statusSnapshot = createEnum("statusSnapshot", ApprovalStatus.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QApprovalRequest(String variable) {
        this(ApprovalRequest.class, forVariable(variable), INITS);
    }

    public QApprovalRequest(Path<? extends ApprovalRequest> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QApprovalRequest(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QApprovalRequest(PathMetadata metadata, PathInits inits) {
        this(ApprovalRequest.class, metadata, inits);
    }

    public QApprovalRequest(Class<? extends ApprovalRequest> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.approver = inits.isInitialized("approver") ? new QUser(forProperty("approver")) : null;
        this.requester = inits.isInitialized("requester") ? new QUser(forProperty("requester")) : null;
    }

}

