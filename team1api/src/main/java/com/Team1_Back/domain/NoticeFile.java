package com.Team1_Back.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notice_file")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long fno;

    private String originalFileName;    // 원본 파일명
    private String savedFileName;       // 서버 저장 파일명(UUID)
    private String filePath;            // 저장 경로
    private Long fileSize;              // 파일 크기

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nno")
    private Notice notice;
}
