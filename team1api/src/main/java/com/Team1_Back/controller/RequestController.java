package com.Team1_Back.controller;

import com.Team1_Back.dto.RequestDTO;
import com.Team1_Back.service.RequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController 
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/requests") 
public class RequestController {

    private final RequestService requestService;

    // 1. 결재 상신 (POST /api/requests/)
    // ("/")가 있어야 프론트엔드의 슬래시 붙은 요청을 받습니다!
    @PostMapping("/") 
    public Map<String, Long> register(@RequestBody RequestDTO requestDTO) {
        log.info("📝 [Controller] 구매 요청 도착!: " + requestDTO);
        
        Long rno = requestService.register(requestDTO);
        
        return Map.of("result", rno);
    }

    // 2. 목록 조회 (GET /api/requests/list)
    @GetMapping("/list")
    public List<RequestDTO> getList() {
        return requestService.getList();
    }
    
    // 3. 상태 변경 (PUT /api/requests/{rno}/status)
    @PutMapping("/{rno}/status")
    public Map<String, String> modifyStatus(
            @PathVariable("rno") Long rno, 
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        String rejectReason = body.get("rejectReason");
        requestService.modifyStatus(rno, status, rejectReason);
        return Map.of("result", "SUCCESS");
    }
}