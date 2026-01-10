package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRequestItem is a Querydsl query type for RequestItem
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRequestItem extends EntityPathBase<RequestItem> {

    private static final long serialVersionUID = 1663133351L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRequestItem requestItem = new QRequestItem("requestItem");

    public final NumberPath<Long> ino = createNumber("ino", Long.class);

    public final StringPath pname = createString("pname");

    public final NumberPath<Long> pno = createNumber("pno", Long.class);

    public final NumberPath<Integer> price = createNumber("price", Integer.class);

    public final NumberPath<Integer> quantity = createNumber("quantity", Integer.class);

    public final QRequest request;

    public QRequestItem(String variable) {
        this(RequestItem.class, forVariable(variable), INITS);
    }

    public QRequestItem(Path<? extends RequestItem> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRequestItem(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRequestItem(PathMetadata metadata, PathInits inits) {
        this(RequestItem.class, metadata, inits);
    }

    public QRequestItem(Class<? extends RequestItem> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.request = inits.isInitialized("request") ? new QRequest(forProperty("request")) : null;
    }

}

