package com.Team1_Back.repository;

import com.Team1_Back.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // 📌 "받는 사람(receiver)이 나(mid)이고" + "안 읽은(isRead=false)" 알림만 가져오기
    List<Notification> findByReceiverAndIsReadFalseOrderByNnoDesc(String receiver);
}