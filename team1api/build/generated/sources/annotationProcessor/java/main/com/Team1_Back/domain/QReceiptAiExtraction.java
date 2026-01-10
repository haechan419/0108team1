package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QReceiptAiExtraction is a Querydsl query type for ReceiptAiExtraction
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReceiptAiExtraction extends EntityPathBase<ReceiptAiExtraction> {

    private static final long serialVersionUID = 1821120492L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QReceiptAiExtraction receiptAiExtraction = new QReceiptAiExtraction("receiptAiExtraction");

    public final QBaseEntity _super = new QBaseEntity(this);

    public final NumberPath<java.math.BigDecimal> confidence = createNumber("confidence", java.math.BigDecimal.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Integer> extractedAmount = createNumber("extractedAmount", Integer.class);

    public final StringPath extractedCategory = createString("extractedCategory");

    public final DatePath<java.time.LocalDate> extractedDate = createDate("extractedDate", java.time.LocalDate.class);

    public final StringPath extractedJson = createString("extractedJson");

    public final StringPath extractedMerchant = createString("extractedMerchant");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath modelName = createString("modelName");

    public final QReceiptUpload receipt;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QReceiptAiExtraction(String variable) {
        this(ReceiptAiExtraction.class, forVariable(variable), INITS);
    }

    public QReceiptAiExtraction(Path<? extends ReceiptAiExtraction> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QReceiptAiExtraction(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QReceiptAiExtraction(PathMetadata metadata, PathInits inits) {
        this(ReceiptAiExtraction.class, metadata, inits);
    }

    public QReceiptAiExtraction(Class<? extends ReceiptAiExtraction> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.receipt = inits.isInitialized("receipt") ? new QReceiptUpload(forProperty("receipt"), inits.get("receipt")) : null;
    }

}

