package com.Team1_Back.service;

import com.Team1_Back.dto.PageRequestDTO;
import com.Team1_Back.dto.PageResponseDTO;
import com.Team1_Back.dto.ProductDTO;
import org.springframework.transaction.annotation.Transactional;

import java.util.List; // 👈 이거 없으면 List에 빨간 줄 뜹니다!

@Transactional
public interface ProductService {

    PageResponseDTO<ProductDTO> getList(PageRequestDTO pageRequestDTO);

    Long register(ProductDTO productDTO);

    ProductDTO get(Long pno);

    void modify(ProductDTO productDTO);

    void remove(Long pno);

    void changeOrder(List<Long> pnoList); 
}