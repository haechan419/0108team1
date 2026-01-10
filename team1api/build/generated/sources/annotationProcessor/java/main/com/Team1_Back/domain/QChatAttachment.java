package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QChatAttachment is a Querydsl query type for ChatAttachment
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QChatAttachment extends EntityPathBase<ChatAttachment> {

    private static final long serialVersionUID = 2116255766L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QChatAttachment chatAttachment = new QChatAttachment("chatAttachment");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final StringPath filePath = createString("filePath");

    public final NumberPath<Long> fileSize = createNumber("fileSize", Long.class);

    public final StringPath fileUrl = createString("fileUrl");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QChatMessage message;

    public final StringPath mimeType = createString("mimeType");

    public final StringPath originalName = createString("originalName");

    public final NumberPath<Long> roomId = createNumber("roomId", Long.class);

    public final StringPath storageType = createString("storageType");

    public final StringPath storedName = createString("storedName");

    public final NumberPath<Long> uploaderId = createNumber("uploaderId", Long.class);

    public QChatAttachment(String variable) {
        this(ChatAttachment.class, forVariable(variable), INITS);
    }

    public QChatAttachment(Path<? extends ChatAttachment> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QChatAttachment(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QChatAttachment(PathMetadata metadata, PathInits inits) {
        this(ChatAttachment.class, metadata, inits);
    }

    public QChatAttachment(Class<? extends ChatAttachment> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.message = inits.isInitialized("message") ? new QChatMessage(forProperty("message")) : null;
    }

}

