package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoginAttempt is a Querydsl query type for LoginAttempt
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoginAttempt extends EntityPathBase<LoginAttempt> {

    private static final long serialVersionUID = 2047290207L;

    public static final QLoginAttempt loginAttempt = new QLoginAttempt("loginAttempt");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath employeeNo = createString("employeeNo");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath ipAddress = createString("ipAddress");

    public final BooleanPath success = createBoolean("success");

    public QLoginAttempt(String variable) {
        super(LoginAttempt.class, forVariable(variable));
    }

    public QLoginAttempt(Path<? extends LoginAttempt> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoginAttempt(PathMetadata metadata) {
        super(LoginAttempt.class, metadata);
    }

}

