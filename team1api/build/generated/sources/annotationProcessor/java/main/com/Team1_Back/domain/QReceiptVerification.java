package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QReceiptVerification is a Querydsl query type for ReceiptVerification
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReceiptVerification extends EntityPathBase<ReceiptVerification> {

    private static final long serialVersionUID = 1951872984L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QReceiptVerification receiptVerification = new QReceiptVerification("receiptVerification");

    public final QBaseEntity _super = new QBaseEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final QExpense expense;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath reason = createString("reason");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final NumberPath<Integer> verifiedAmount = createNumber("verifiedAmount", Integer.class);

    public final QUser verifiedBy;

    public final StringPath verifiedCategory = createString("verifiedCategory");

    public final StringPath verifiedMerchant = createString("verifiedMerchant");

    public QReceiptVerification(String variable) {
        this(ReceiptVerification.class, forVariable(variable), INITS);
    }

    public QReceiptVerification(Path<? extends ReceiptVerification> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QReceiptVerification(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QReceiptVerification(PathMetadata metadata, PathInits inits) {
        this(ReceiptVerification.class, metadata, inits);
    }

    public QReceiptVerification(Class<? extends ReceiptVerification> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.expense = inits.isInitialized("expense") ? new QExpense(forProperty("expense"), inits.get("expense")) : null;
        this.verifiedBy = inits.isInitialized("verifiedBy") ? new QUser(forProperty("verifiedBy")) : null;
    }

}

