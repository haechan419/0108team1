package com.Team1_Back.controller;

import com.Team1_Back.dto.NoticeDTO;
import com.Team1_Back.dto.PageRequestDTO;
import com.Team1_Back.dto.PageResponseDTO;
import com.Team1_Back.repository.UserRepository;
import com.Team1_Back.service.NoticeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/notice")
public class NoticeController {

    private final NoticeService noticeService;
    private final UserRepository userRepository;

    // create
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/register", consumes = "multipart/form-data")
    public ResponseEntity<Long> register(@ModelAttribute NoticeDTO noticeDTO,
                                         @AuthenticationPrincipal UserDetails userDetails) {
//                                      @RequestPart는 JSON과 File을 엄격하게 나눔 @ModelAttribute는 유연함
        log.info("공지사항 등록 : " + noticeDTO.getTitle());

        // 토큰 정보를 통해 작성자 정보를 주입
        if (userDetails != null) {
            // 토큰에서 username을 꺼냄
            String employeeNo = userDetails.getUsername();

            userRepository.findByEmployeeNo(employeeNo).ifPresent(user -> {     //ifPresent : 정보가 있을 때만 실행
                noticeDTO.setWriter(user.getName());
                noticeDTO.setWriterRole(user.getRole().name());
            });
        }

        Long nno = noticeService.register(noticeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nno);
    }

    // read list
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/list")
    public PageResponseDTO<NoticeDTO> getList(PageRequestDTO pageRequestDTO) {
        log.info("공지사항 목록 조회");
        return noticeService.getList(pageRequestDTO);
    }


    // read
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/{nno}")
    public NoticeDTO get(@PathVariable Long nno) {
        log.info("세부 공지사항 조회: {}", nno);
        return noticeService.get(nno);
    }

    // update(공지사항 수정)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{nno}")
    public void modify(
            @PathVariable Long nno,
            @RequestBody NoticeDTO noticeDTO) {

        noticeDTO.setNno(nno);
        noticeService.modify(noticeDTO);
    }

    // delete(공지사항 삭제)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{nno}")
    public void remove(@PathVariable Long nno) {
        noticeService.delete(nno);
    }
}
