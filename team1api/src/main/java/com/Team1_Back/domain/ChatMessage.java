package com.Team1_Back.domain;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter @Setter
@Entity
@Table(name = "chat_message",
        indexes = {
                @Index(name = "idx_cm_room_id_id", columnList = "room_id,id"),
                @Index(name = "idx_cm_room_created", columnList = "room_id,created_at")
        })
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="room_id", nullable = false)
    private Long roomId;

    @Column(name="sender_id", nullable = false)
    private Long senderId;

    @Column(name="content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name="created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name="deleted_at")
    private Instant deletedAt;
}

