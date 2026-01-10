package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QChatRoomMember is a Querydsl query type for ChatRoomMember
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QChatRoomMember extends EntityPathBase<ChatRoomMember> {

    private static final long serialVersionUID = 526241352L;

    public static final QChatRoomMember chatRoomMember = new QChatRoomMember("chatRoomMember");

    public final SimplePath<ChatRoomMemberId> id = createSimple("id", ChatRoomMemberId.class);

    public final DateTimePath<java.time.LocalDateTime> joinedAt = createDateTime("joinedAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> lastReadAt = createDateTime("lastReadAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> lastReadMessageId = createNumber("lastReadMessageId", Long.class);

    public QChatRoomMember(String variable) {
        super(ChatRoomMember.class, forVariable(variable));
    }

    public QChatRoomMember(Path<? extends ChatRoomMember> path) {
        super(path.getType(), path.getMetadata());
    }

    public QChatRoomMember(PathMetadata metadata) {
        super(ChatRoomMember.class, metadata);
    }

}

