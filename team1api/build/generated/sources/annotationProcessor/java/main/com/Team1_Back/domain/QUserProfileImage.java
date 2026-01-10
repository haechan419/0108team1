package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QUserProfileImage is a Querydsl query type for UserProfileImage
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUserProfileImage extends EntityPathBase<UserProfileImage> {

    private static final long serialVersionUID = -2087171240L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QUserProfileImage userProfileImage = new QUserProfileImage("userProfileImage");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath fileName = createString("fileName");

    public final NumberPath<Long> fileSize = createNumber("fileSize", Long.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath originalName = createString("originalName");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final QUser user;

    public QUserProfileImage(String variable) {
        this(UserProfileImage.class, forVariable(variable), INITS);
    }

    public QUserProfileImage(Path<? extends UserProfileImage> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QUserProfileImage(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QUserProfileImage(PathMetadata metadata, PathInits inits) {
        this(UserProfileImage.class, metadata, inits);
    }

    public QUserProfileImage(Class<? extends UserProfileImage> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

