package com.Team1_Back.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponseDTO<E> {

    private List<E> content;

    private int page;

    private int size;

    private Long totalElements;

    private List<E> dtoList;

    private List<Integer> pageNumList;

    private PageRequestDTO pageRequestDTO;

    private boolean prev, next;

    private Long totalCount;

    private int prevPage, nextPage, totalPage, current;

    private List<String> departments;

    @Builder(builderMethodName = "withAll")
    public PageResponseDTO(List<E> dtoList, PageRequestDTO pageRequestDTO, long totalCount) {

        this.dtoList = dtoList != null ? dtoList : List.of();
        this.pageRequestDTO = pageRequestDTO != null ? pageRequestDTO : PageRequestDTO.builder().page(1).size(15).build();
        this.totalCount =  totalCount;

        // 페이지 블록 계산 (10개씩) - mallapi 패턴
        int end = (int) (Math.ceil(this.pageRequestDTO.getPage() / 10.0)) * 10;
        int start = end - 9;

        int last = totalCount > 0 ? (int) (Math.ceil((totalCount / (double) this.pageRequestDTO.getSize()))) : 0;

        end = end > last ? last : end;

        this.prev = start > 1;

        // mallapi 패턴: totalCount > end * size로 다음 페이지 블록 존재 여부 확인
        this.next = totalCount > end * this.pageRequestDTO.getSize();

        this.pageNumList = IntStream.rangeClosed(start, end).boxed().collect(Collectors.toList());

        if (prev) {
            this.prevPage = start - 1;
        }

        if (next) {
            this.nextPage = end + 1;
        }

        this.totalPage = this.pageNumList.size();

        this.current = this.pageRequestDTO.getPage();
    }
}

