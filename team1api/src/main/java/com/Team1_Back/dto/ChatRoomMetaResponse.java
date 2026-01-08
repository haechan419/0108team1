package com.Team1_Back.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ChatRoomMetaResponse {
    private Long roomId;
    private Long meLastReadMessageId;
    private Long otherLastReadMessageId;
}
