package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QUserBudgetMonthly is a Querydsl query type for UserBudgetMonthly
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUserBudgetMonthly extends EntityPathBase<UserBudgetMonthly> {

    private static final long serialVersionUID = -1021150302L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QUserBudgetMonthly userBudgetMonthly = new QUserBudgetMonthly("userBudgetMonthly");

    public final QBaseEntity _super = new QBaseEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Integer> monthlyLimit = createNumber("monthlyLimit", Integer.class);

    public final StringPath note = createString("note");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final QUser user;

    public final StringPath yearMonth = createString("yearMonth");

    public QUserBudgetMonthly(String variable) {
        this(UserBudgetMonthly.class, forVariable(variable), INITS);
    }

    public QUserBudgetMonthly(Path<? extends UserBudgetMonthly> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QUserBudgetMonthly(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QUserBudgetMonthly(PathMetadata metadata, PathInits inits) {
        this(UserBudgetMonthly.class, metadata, inits);
    }

    public QUserBudgetMonthly(Class<? extends UserBudgetMonthly> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

