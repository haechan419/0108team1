package com.Team1_Back.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notice")
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long nno;   // 공지사항 고유 번호

    private String title;   // 공지사항 제목

    @Column(columnDefinition = "LONGTEXT")
    private String content; // 공지사항 내용

    private String writer; // 공지사항 작성자

    private String writerRole;

    private boolean pinned; // 공지 상단 고정 여부

    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true) // 공지가 삭제되면 파일 메타데이터 자동 삭제
    @Builder.Default
    private List<NoticeFile> fileList = new ArrayList<>();

    public void addFile(NoticeFile file) {
        file.setNotice(this);
        this.fileList.add(file);
    }

    @Column(updatable = false)
    private LocalDateTime createDate;    // 공지사항 생성 시간

    @PrePersist         // 생성 시 자동 주입
    public void insertCreateDate() {
        this.createDate = LocalDateTime.now();
    }

    public void changePinned(boolean pinned) {
        this.pinned = pinned;
    }

    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeContent(String content) {
        this.content = content;
    }

    // 소프트 삭제 : DB에 저장되어 있지만 조회할 때 안보임
    @Builder.Default
    private boolean delFlag = false;

    // 삭제 처리
    public void delete() {
        this.delFlag = true;
    }

}
