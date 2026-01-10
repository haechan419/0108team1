package com.Team1_Back.repository;

import com.Team1_Back.domain.Attendance;
import com.Team1_Back.domain.AttendanceStatus;
import com.Team1_Back.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Random;

@SpringBootTest
public class AttendanceDataGeneratorTest {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @Transactional
    @Commit
    public void generateAttendanceData() {
        Random random = new Random();

        // user_id 26 ~ 40
        for (long userId = 26; userId <= 40; userId++) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                System.out.println("User not found: " + userId);
                continue;
            }

            System.out.println("Generating data for user: " + user.getName() + " (ID: " + userId + ")");

            // 5월 1일 ~ 11월 28일
            LocalDate startDate = LocalDate.of(2025, 5, 1);
            LocalDate endDate = LocalDate.of(2025, 11, 28);

            LocalDate date = startDate;
            while (!date.isAfter(endDate)) {
                // 주말 제외
                if (date.getDayOfWeek() != DayOfWeek.SATURDAY &&
                        date.getDayOfWeek() != DayOfWeek.SUNDAY) {

                    if (attendanceRepository.findByUserIdAndAttendanceDate(userId, date).isEmpty()) {
                        Attendance attendance = createRandomAttendance(user, date, random);
                        attendanceRepository.save(attendance);
                    }
                }
                date = date.plusDays(1);
            }
        }

        System.out.println("=== 더미데이터 생성 완료! ===");
    }

    private Attendance createRandomAttendance(User user, LocalDate date, Random random) {
        int rand = random.nextInt(100);

        // 75% 정상출근, 12% 지각, 8% 휴가, 5% 결근
        if (rand < 75) {
            // 정상 출근 (08:00 ~ 08:59)
            int hour = 8;
            int minute = random.nextInt(60);  // 0 ~ 59
            LocalTime checkInTime = LocalTime.of(hour, minute);
            LocalTime checkOutTime = LocalTime.of(18, random.nextInt(30));

            return Attendance.builder()
                    .user(user)
                    .attendanceDate(date)
                    .checkInTime(LocalDateTime.of(date, checkInTime))
                    .checkOutTime(LocalDateTime.of(date, checkOutTime))
                    .status(AttendanceStatus.PRESENT)
                    .build();

        } else if (rand < 87) {
            // 지각 (09:05 ~ 10:30)
            int hour = 9 + random.nextInt(2);  // 9 또는 10
            int minute;
            if (hour == 9) {
                minute = 5 + random.nextInt(55);  // 9시 5분 ~ 9시 59분
            } else {
                minute = random.nextInt(31);  // 10시 0분 ~ 10시 30분
            }
            LocalTime checkInTime = LocalTime.of(hour, minute);
            LocalTime checkOutTime = LocalTime.of(18, random.nextInt(60));

            return Attendance.builder()
                    .user(user)
                    .attendanceDate(date)
                    .checkInTime(LocalDateTime.of(date, checkInTime))
                    .checkOutTime(LocalDateTime.of(date, checkOutTime))
                    .status(AttendanceStatus.LATE)
                    .build();

        } else if (rand < 95) {
            // 휴가
            return Attendance.builder()
                    .user(user)
                    .attendanceDate(date)
                    .status(AttendanceStatus.LEAVE)
                    .build();

        } else {
            // 결근
            return Attendance.builder()
                    .user(user)
                    .attendanceDate(date)
                    .status(AttendanceStatus.ABSENT)
                    .build();
        }
    }
}