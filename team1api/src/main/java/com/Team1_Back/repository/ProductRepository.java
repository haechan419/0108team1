package com.Team1_Back.repository;

import com.Team1_Back.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // 1. 상세 조회
    @Query("select p from Product p left join fetch p.imageList pi where pi.ord = 0 and p.delFlag = false and p.pno = :pno")
    Optional<Product> selectOne(@Param("pno") Long pno);

    // 2. [전체] 목록 조회 (반환 타입을 Page<Product>로 수정)
    // select p, pi -> select p 로 변경 (엔티티만 가져오면 내부에 이미지가 들어있음)
    @Query("select p from Product p left join p.imageList pi where pi.ord = 0 and p.delFlag = false")
    Page<Product> selectList(Pageable pageable);

    // 3. [카테고리별] 목록 조회
    @Query("select p from Product p left join p.imageList pi where p.category = :category and pi.ord = 0 and p.delFlag = false")
    Page<Product> findByCategory(@Param("category") String category, Pageable pageable);

    // 삭제 처리
    @Modifying
    @Query("UPDATE Product p SET p.delFlag = :flag WHERE p.pno = :pno")
    void updateToDelete(@Param("pno") Long pno, @Param("flag") boolean flag);

}