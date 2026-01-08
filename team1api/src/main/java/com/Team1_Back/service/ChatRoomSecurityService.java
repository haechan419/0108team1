package com.Team1_Back.service;

import com.Team1_Back.repository.ChatRoomMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRoomSecurityService {

    private final ChatRoomMemberRepository chatRoomMemberRepository;

    public boolean isMember(Long userId, Long roomId) {
        return chatRoomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, userId);
    }
}
