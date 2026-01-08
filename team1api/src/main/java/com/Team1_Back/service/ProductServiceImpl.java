package com.Team1_Back.service;

import com.Team1_Back.domain.Product;
import com.Team1_Back.domain.ProductImage;
import com.Team1_Back.dto.PageRequestDTO;
import com.Team1_Back.dto.PageResponseDTO;
import com.Team1_Back.dto.ProductDTO;
import com.Team1_Back.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    // 1. 목록 조회 (✨ 카테고리 필터링 적용 완료!)
    @Override
    public PageResponseDTO<ProductDTO> getList(PageRequestDTO pageRequestDTO) {

        // 정렬 조건: 순서(ord) 오름차순 -> 최신순(pno) 내림차순
        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by("ord").ascending().and(Sort.by("pno").descending())
        );

        // ✨ 검색 분기 처리 (여기가 수정되었습니다!)
        Page<Product> result;
        String category = pageRequestDTO.getCategory();

        // 1) 카테고리 값이 있고, "All"이 아니고, 비어있지 않다면 -> 카테고리 검색
        if(category != null && !category.equals("All") && !category.isEmpty()) {
            result = productRepository.findByCategory(category, pageable);
        } else {
            // 2) 아니면 -> 전체 검색 (Repository의 selectList 사용)
            // (findAll 대신 selectList를 써야 delFlag=false 조건 등이 적용됩니다)
            result = productRepository.selectList(pageable);
        }

        List<ProductDTO> dtoList = result.getContent().stream()
                .map(product -> entityToDTO(product))
                .collect(Collectors.toList());

        return PageResponseDTO.of(
                dtoList,
                pageRequestDTO,
                result.getTotalElements()
        );
    }

    // 2. 등록
    @Override
    public Long register(ProductDTO productDTO) {
        Product product = dtoToEntity(productDTO);
        Product result = productRepository.save(product);
        return result.getPno();
    }

    // 3. 상세 조회
    @Override
    public ProductDTO get(Long pno) {
        Optional<Product> result = productRepository.findById(pno);
        Product product = result.orElseThrow();
        return entityToDTO(product);
    }

    // 4. 수정 (재고 수정 포함)
    @Override
    public void modify(ProductDTO productDTO) {
        Optional<Product> result = productRepository.findById(productDTO.getPno());
        Product product = result.orElseThrow();

        // 기존 정보 수정
        product.changeName(productDTO.getPname());
        product.changeDesc(productDTO.getPdesc());
        product.changePrice(productDTO.getPrice());
        product.changeCategory(productDTO.getCategory());
        
        // 재고 수정
        product.changeStock(productDTO.getStockQuantity()); 

        // 파일 수정 로직
        product.clearList();
        List<String> uploadFileNames = productDTO.getUploadFileNames();
        if(uploadFileNames != null && uploadFileNames.size() > 0){
            uploadFileNames.stream().forEach(uploadName -> {
                product.addImageString(uploadName);
            });
        }
        productRepository.save(product);
    }

    // 5. 삭제
    @Override
    public void remove(Long pno) {
        productRepository.deleteById(pno);
    }

    // 6. 순서 변경 구현
    @Override
    public void changeOrder(List<Long> pnoList) {
        for (int i = 0; i < pnoList.size(); i++) {
            Long pno = pnoList.get(i);
            Optional<Product> result = productRepository.findById(pno);
            if (result.isPresent()) {
                Product product = result.get();
                product.changeOrd(i); // i번째 순서로 저장 (0, 1, 2...)
                productRepository.save(product);
            }
        }
    }

    // 변환 메서드들 (Entity <-> DTO)
    private ProductDTO entityToDTO(Product product){
        ProductDTO productDTO = ProductDTO.builder()
                .pno(product.getPno())
                .pname(product.getPname())
                .pdesc(product.getPdesc())
                .price(product.getPrice())
                .category(product.getCategory())
                .stockQuantity(product.getStockQuantity())
                .delFlag(product.isDelFlag())
                .build();

        List<ProductImage> imageList = product.getImageList();
        if(imageList == null || imageList.isEmpty()){
            return productDTO;
        }

        List<String> fileNameList = imageList.stream().map(productImage ->
                productImage.getFileName()).toList();
        productDTO.setUploadFileNames(fileNameList);
        return productDTO;
    }

    private Product dtoToEntity(ProductDTO productDTO){
        Product product = Product.builder()
                .pno(productDTO.getPno())
                .pname(productDTO.getPname())
                .pdesc(productDTO.getPdesc())
                .price(productDTO.getPrice())
                .category(productDTO.getCategory())
                .stockQuantity(productDTO.getStockQuantity())
                .delFlag(productDTO.isDelFlag())
                .build();

        List<String> uploadFileNames = productDTO.getUploadFileNames();
        if(uploadFileNames == null){
            return product;
        }
        uploadFileNames.stream().forEach(uploadName -> {
            product.addImageString(uploadName);
        });
        return product;
    }
}