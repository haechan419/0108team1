package com.Team1_Back.controller;

import com.Team1_Back.dto.AiChatFileRequest;
import com.Team1_Back.dto.AiChatFileResponse;
import com.Team1_Back.dto.AiContextRequest;
import com.Team1_Back.security.AuthFacade;
import com.Team1_Back.service.AiChatFileService;
import com.Team1_Back.service.ChatAttachmentSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai")
public class AiChatFileController {

    private final ChatAttachmentSearchService searchService;
    private final AiChatFileService aiChatFileService;
    private final AuthFacade auth;

//    @PostMapping("/find-chat-files-global")
//    public AiChatFileResponse findChatFilesGlobal(@RequestBody AiContextRequest req) {
//
//        if (req == null || req.query() == null || req.query().trim().isEmpty()) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "query is required");
//        }
//
//        return aiChatFileService.findChatFilesGlobal(req.query().trim());
//    }

}
