package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QExpense is a Querydsl query type for Expense
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QExpense extends EntityPathBase<Expense> {

    private static final long serialVersionUID = -841865411L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QExpense expense = new QExpense("expense");

    public final QBaseEntity _super = new QBaseEntity(this);

    public final NumberPath<Integer> amount = createNumber("amount", Integer.class);

    public final StringPath category = createString("category");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath description = createString("description");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath merchant = createString("merchant");

    public final DatePath<java.time.LocalDate> receiptDate = createDate("receiptDate", java.time.LocalDate.class);

    public final StringPath receiptImageUrl = createString("receiptImageUrl");

    public final EnumPath<ApprovalStatus> status = createEnum("status", ApprovalStatus.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final QUser writer;

    public QExpense(String variable) {
        this(Expense.class, forVariable(variable), INITS);
    }

    public QExpense(Path<? extends Expense> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QExpense(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QExpense(PathMetadata metadata, PathInits inits) {
        this(Expense.class, metadata, inits);
    }

    public QExpense(Class<? extends Expense> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.writer = inits.isInitialized("writer") ? new QUser(forProperty("writer")) : null;
    }

}

