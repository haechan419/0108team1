package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QReceiptUpload is a Querydsl query type for ReceiptUpload
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReceiptUpload extends EntityPathBase<ReceiptUpload> {

    private static final long serialVersionUID = -453197442L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QReceiptUpload receiptUpload = new QReceiptUpload("receiptUpload");

    public final QBaseEntity _super = new QBaseEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final QExpense expense;

    public final StringPath fileHash = createString("fileHash");

    public final StringPath fileUrl = createString("fileUrl");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath mimeType = createString("mimeType");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final QUser uploadedBy;

    public QReceiptUpload(String variable) {
        this(ReceiptUpload.class, forVariable(variable), INITS);
    }

    public QReceiptUpload(Path<? extends ReceiptUpload> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QReceiptUpload(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QReceiptUpload(PathMetadata metadata, PathInits inits) {
        this(ReceiptUpload.class, metadata, inits);
    }

    public QReceiptUpload(Class<? extends ReceiptUpload> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.expense = inits.isInitialized("expense") ? new QExpense(forProperty("expense"), inits.get("expense")) : null;
        this.uploadedBy = inits.isInitialized("uploadedBy") ? new QUser(forProperty("uploadedBy")) : null;
    }

}

