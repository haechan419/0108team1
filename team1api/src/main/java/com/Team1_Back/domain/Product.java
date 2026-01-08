package com.Team1_Back.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tbl_product")
@Getter
@ToString(exclude = "imageList")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pno;

    @Column(length = 200, nullable = false)
    private String pname;

    private int price;

    @Column(length = 1000)
    private String pdesc;

    @Column(length = 50)
    private String category;

    private int stockQuantity;

    private boolean delFlag;

    private boolean status; // 판매 상태 (true: 판매중, false: 판매중지)

    @Column(columnDefinition = "int default 0")
    private int ord;

    @ElementCollection
    @Builder.Default
    private List<ProductImage> imageList = new ArrayList<>();

    public void changePrice(int price) { this.price = price; }
    public void changeDesc(String desc) { this.pdesc = desc; }
    public void changeName(String name) { this.pname = name; }
    public void changeCategory(String category) { this.category = category; }
    public void changeStock(int stockQuantity) { this.stockQuantity = stockQuantity; }
    public void changeDel(boolean delFlag) { this.delFlag = delFlag; }

    // 순서 변경용 메서드
    public void changeOrd(int ord) { this.ord = ord; }

    public void addImage(ProductImage image) {
        image.setOrd(this.imageList.size());
        imageList.add(image);
    }
    public void addImageString(String fileName){
        ProductImage productImage = ProductImage.builder().fileName(fileName).build();
        addImage(productImage);
    }
    public void clearList() { this.imageList.clear(); }
    public void changeStatus(boolean status) {
        this.status = status;
    }
}