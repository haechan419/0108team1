package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMeetingNote is a Querydsl query type for MeetingNote
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMeetingNote extends EntityPathBase<MeetingNote> {

    private static final long serialVersionUID = -370197198L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMeetingNote meetingNote = new QMeetingNote("meetingNote");

    public final QBaseEntity _super = new QBaseEntity(this);

    public final BooleanPath analyzed = createBoolean("analyzed");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath fileName = createString("fileName");

    public final StringPath filePath = createString("filePath");

    public final NumberPath<Long> fileSize = createNumber("fileSize", Long.class);

    public final StringPath fileType = createString("fileType");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath originalFileName = createString("originalFileName");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final DateTimePath<java.time.LocalDateTime> uploadDate = createDateTime("uploadDate", java.time.LocalDateTime.class);

    public final QUser user;

    public QMeetingNote(String variable) {
        this(MeetingNote.class, forVariable(variable), INITS);
    }

    public QMeetingNote(Path<? extends MeetingNote> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMeetingNote(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMeetingNote(PathMetadata metadata, PathInits inits) {
        this(MeetingNote.class, metadata, inits);
    }

    public QMeetingNote(Class<? extends MeetingNote> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

