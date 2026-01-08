package com.Team1_Back.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDTO {
    private Long pno;
    private String pname;
    private int price;
    private String pdesc;
    private boolean delFlag;
    
    // 추가된 필드
    private String category;
    private int stockQuantity;

    private int ord;

    @Builder.Default
    private List<MultipartFile> files = new ArrayList<>(); // 실제 파일 업로드용

    @Builder.Default
    private List<String> uploadFileNames = new ArrayList<>(); // 조회된 파일명 리스트
}