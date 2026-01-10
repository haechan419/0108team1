package com.Team1_Back.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QDepartmentPerformance is a Querydsl query type for DepartmentPerformance
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDepartmentPerformance extends EntityPathBase<DepartmentPerformance> {

    private static final long serialVersionUID = -797673565L;

    public static final QDepartmentPerformance departmentPerformance = new QDepartmentPerformance("departmentPerformance");

    public final NumberPath<Integer> contractCount = createNumber("contractCount", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath departmentName = createString("departmentName");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Integer> month = createNumber("month", Integer.class);

    public final NumberPath<Integer> projectCount = createNumber("projectCount", Integer.class);

    public final NumberPath<Long> salesAmount = createNumber("salesAmount", Long.class);

    public final NumberPath<java.math.BigDecimal> targetAchievementRate = createNumber("targetAchievementRate", java.math.BigDecimal.class);

    public final NumberPath<Integer> year = createNumber("year", Integer.class);

    public QDepartmentPerformance(String variable) {
        super(DepartmentPerformance.class, forVariable(variable));
    }

    public QDepartmentPerformance(Path<? extends DepartmentPerformance> path) {
        super(path.getType(), path.getMetadata());
    }

    public QDepartmentPerformance(PathMetadata metadata) {
        super(DepartmentPerformance.class, metadata);
    }

}

