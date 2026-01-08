package com.Team1_Back.repository;

import com.Team1_Back.domain.ApprovalStatus;
import com.Team1_Back.domain.Expense;
import com.Team1_Back.domain.User;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Slf4j
public class ExpenseRepositoryTests {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @Transactional
    public void testInsert() {
        // given
        User testUser = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("테스트 사용자를 찾을 수 없습니다."));

        Expense expense = Expense.builder()
                .writer(testUser)
                .status(ApprovalStatus.DRAFT)
                .merchant("테스트 상점")
                .amount(10000)
                .category("식비")
                .receiptDate(LocalDate.now())
                .description("테스트 지출 내역")
                .build();

        // when
        Expense saved = expenseRepository.save(expense);

        // then
        assertNotNull(saved.getId());
        log.info("저장된 지출 내역 ID: {}", saved.getId());
        log.info("저장된 지출 내역: {}", saved);
    }

    @Test
    @Transactional
    public void testFindByWriterId() {
        // given
        User testUser = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("테스트 사용자를 찾을 수 없습니다."));

        Pageable pageable = PageRequest.of(0, 10, Sort.by("updatedAt").descending());

        // when
        Page<Expense> result = expenseRepository.findByWriterId(testUser.getId(), pageable);

        // then
        assertNotNull(result);
        log.info("총 개수: {}", result.getTotalElements());
        log.info("페이지 수: {}", result.getTotalPages());
        result.getContent().forEach(expense -> log.info("expense: {}", expense));
    }

    @Test
    @Transactional
    public void testFindByWriterIdAndStatus() {
        // given
        User testUser = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("테스트 사용자를 찾을 수 없습니다."));

        Pageable pageable = PageRequest.of(0, 10, Sort.by("updatedAt").descending());

        // when
        Page<Expense> result = expenseRepository.findByWriterIdAndStatus(
                testUser.getId(), 
                ApprovalStatus.APPROVED, 
                pageable
        );

        // then
        assertNotNull(result);
        log.info("APPROVED 상태 지출 내역 개수: {}", result.getTotalElements());
        result.getContent().forEach(expense -> {
            assertEquals(ApprovalStatus.APPROVED, expense.getStatus());
            log.info("expense: {}", expense);
        });
    }

    @Test
    @Transactional
    public void testFindByUserIdAndDateRange() {
        // given
        User testUser = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("테스트 사용자를 찾을 수 없습니다."));

        LocalDate startDate = LocalDate.now().minusMonths(1);
        LocalDate endDate = LocalDate.now();
        Pageable pageable = PageRequest.of(0, 10, Sort.by("receiptDate").descending());

        // when
        Page<Expense> result = expenseRepository.findByUserIdAndDateRange(
                testUser.getId(),
                startDate,
                endDate,
                pageable
        );

        // then
        assertNotNull(result);
        log.info("기간별 지출 내역 개수: {}", result.getTotalElements());
        result.getContent().forEach(expense -> {
            assertTrue(expense.getReceiptDate().isAfter(startDate.minusDays(1)));
            assertTrue(expense.getReceiptDate().isBefore(endDate.plusDays(1)));
            log.info("지출 일자: {}, 금액: {}", expense.getReceiptDate(), expense.getAmount());
        });
    }

    @Test
    @Transactional
    public void testFindByIdAndWriterId() {
        // given
        User testUser = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("테스트 사용자를 찾을 수 없습니다."));

        // 실제 존재하는 지출 ID를 사용하거나, 먼저 생성
        Expense expense = Expense.builder()
                .writer(testUser)
                .status(ApprovalStatus.DRAFT)
                .merchant("권한 테스트 상점")
                .amount(5000)
                .category("교통비")
                .receiptDate(LocalDate.now())
                .build();
        Expense saved = expenseRepository.save(expense);

        // when
        Optional<Expense> result = expenseRepository.findByIdAndWriterId(
                saved.getId(),
                testUser.getId()
        );

        // then
        assertTrue(result.isPresent());
        assertEquals(saved.getId(), result.get().getId());
        assertEquals(testUser.getId(), result.get().getWriter().getId());
        log.info("조회된 지출 내역: {}", result.get());
    }

    @Test
    @Transactional
    public void testFindByIdWithWriter() {
        // given
        User testUser = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("테스트 사용자를 찾을 수 없습니다."));

        Expense expense = Expense.builder()
                .writer(testUser)
                .status(ApprovalStatus.DRAFT)
                .merchant("관리자 조회 테스트")
                .amount(15000)
                .category("비품")
                .receiptDate(LocalDate.now())
                .build();
        Expense saved = expenseRepository.save(expense);

        // when
        Optional<Expense> result = expenseRepository.findByIdWithWriter(saved.getId());

        // then
        assertTrue(result.isPresent());
        assertNotNull(result.get().getWriter());
        assertEquals(testUser.getId(), result.get().getWriter().getId());
        log.info("관리자 조회 결과: {}", result.get());
        log.info("작성자 정보: {}", result.get().getWriter());
    }

    @Test
    @Transactional
    public void testFindByStatus() {
        // given
        Pageable pageable = PageRequest.of(0, 10, Sort.by("updatedAt").descending());

        // when
        Page<Expense> result = expenseRepository.findByStatus(ApprovalStatus.DRAFT, pageable);

        // then
        assertNotNull(result);
        log.info("DRAFT 상태 지출 내역 개수: {}", result.getTotalElements());
        result.getContent().forEach(expense -> {
            assertEquals(ApprovalStatus.DRAFT, expense.getStatus());
            log.info("expense: {}", expense);
        });
    }

    @Test
    @Transactional
    public void testFindDepartmentStatistics() {
        // when
        List<Object[]> results = expenseRepository.findDepartmentStatistics("APPROVED");

        // then
        assertNotNull(results);
        log.info("부서별 통계 결과 개수: {}", results.size());
        results.forEach(row -> {
            String departmentName = (String) row[0];
            Long expenseCount = ((Number) row[1]).longValue();
            Long totalAmount = ((Number) row[2]).longValue();
            log.info("부서: {}, 건수: {}, 총액: {}", departmentName, expenseCount, totalAmount);
        });
    }

    @Test
    @Transactional
    public void testFindCategoryStatistics() {
        // when
        List<Object[]> results = expenseRepository.findCategoryStatistics("APPROVED");

        // then
        assertNotNull(results);
        log.info("카테고리별 통계 결과 개수: {}", results.size());
        results.forEach(row -> {
            String categoryName = (String) row[0];
            Long expenseCount = ((Number) row[1]).longValue();
            Long totalAmount = ((Number) row[2]).longValue();
            log.info("카테고리: {}, 건수: {}, 총액: {}", categoryName, expenseCount, totalAmount);
        });
    }

    @Test
    @Transactional
    public void testSumMonthlyTotalExpense() {
        // when
        Long total = expenseRepository.sumMonthlyTotalExpense("APPROVED");

        // then
        assertNotNull(total);
        assertTrue(total >= 0);
        log.info("이번 달 총 지출액 (APPROVED): {}", total);
    }

    @Test
    @Transactional
    public void testFindForReportByDateRange() {
        // given
        LocalDate startDate = LocalDate.now().minusMonths(1);
        LocalDate endDate = LocalDate.now();

        // when
        List<Expense> results = expenseRepository.findForReportByDateRange(startDate, endDate);

        // then
        assertNotNull(results);
        log.info("리포트용 지출 내역 개수: {}", results.size());
        results.forEach(expense -> {
            assertEquals(ApprovalStatus.APPROVED, expense.getStatus());
            assertTrue(expense.getReceiptDate().isAfter(startDate.minusDays(1)));
            assertTrue(expense.getReceiptDate().isBefore(endDate.plusDays(1)));
            log.info("리포트 항목: {}", expense);
        });
    }

    // ========== 더미 데이터 생성 메서드 ==========

    /**
     * 지출 내역 더미 데이터 생성
     * UserRepositoryTests.insertDummyUsers() 실행 후 사용
     */
    @Test
    public void insertDummyExpenses() {
        // 필요한 사용자들
        User user1 = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("20250001 사용자를 찾을 수 없습니다."));
        User user2 = userRepository.findByEmployeeNo("20250002")
                .orElseThrow(() -> new RuntimeException("20250002 사용자를 찾을 수 없습니다."));
        User user3 = userRepository.findByEmployeeNo("20250003")
                .orElseThrow(() -> new RuntimeException("20250003 사용자를 찾을 수 없습니다."));
        User user4 = userRepository.findByEmployeeNo("20250004")
                .orElseThrow(() -> new RuntimeException("20250004 사용자를 찾을 수 없습니다."));

        // 20250001 
        createExpense(user1, ApprovalStatus.SUBMITTED, "스타벅스 강남점", 12000, "식비", LocalDate.now().minusDays(2), "팀 회의 커피");
        createExpense(user1, ApprovalStatus.APPROVED, "이마트", 31455, "비품", LocalDate.now().minusDays(10), "사무용품 구매");
        createExpense(user1, ApprovalStatus.REJECTED, "맥도날드 역삼점", 9000, "식비", LocalDate.now().minusDays(25), "개인 식사");
        createExpense(user1, ApprovalStatus.SUBMITTED, "GS25 편의점", 5500, "기타", LocalDate.now().minusDays(1), "간식 구매");
        createExpense(user1, ApprovalStatus.DRAFT, "교보문고", 25000, "비품", LocalDate.now(), "도서 구매");

        // 20250002 
        createExpense(user2, ApprovalStatus.APPROVED, "스타벅스 강남점", 15000, "식비", LocalDate.now().minusDays(5), "고객 미팅");
        createExpense(user2, ApprovalStatus.SUBMITTED, "이마트", 45000, "비품", LocalDate.now().minusDays(3), "프레젠테이션 용품");
        createExpense(user2, ApprovalStatus.REQUEST_MORE_INFO, "맥도날드 역삼점", 8000, "식비", LocalDate.now().minusDays(7), "점심 식사");
        createExpense(user2, ApprovalStatus.APPROVED, "GS25 편의점", 3000, "기타", LocalDate.now().minusDays(12), "음료 구매");
        createExpense(user2, ApprovalStatus.SUBMITTED, "교보문고", 18000, "비품", LocalDate.now().minusDays(1), "업무 서적");

        // 20250003 
        createExpense(user3, ApprovalStatus.APPROVED, "스타벅스 강남점", 20000, "식비", LocalDate.now().minusDays(8), "팀 회의");
        createExpense(user3, ApprovalStatus.REJECTED, "이마트", 50000, "비품", LocalDate.now().minusDays(20), "마케팅 용품");
        createExpense(user3, ApprovalStatus.SUBMITTED, "맥도날드 역삼점", 11000, "식비", LocalDate.now().minusDays(4), "점심 식사");
        createExpense(user3, ApprovalStatus.APPROVED, "GS25 편의점", 7000, "기타", LocalDate.now().minusDays(15), "간식 구매");
        createExpense(user3, ApprovalStatus.DRAFT, "교보문고", 32000, "비품", LocalDate.now(), "마케팅 도서");

        // 20250004 
        createExpense(user4, ApprovalStatus.SUBMITTED, "스타벅스 강남점", 13000, "식비", LocalDate.now().minusDays(6), "코드 리뷰 미팅");
        createExpense(user4, ApprovalStatus.APPROVED, "이마트", 28000, "비품", LocalDate.now().minusDays(11), "개발 도구");
        createExpense(user4, ApprovalStatus.SUBMITTED, "맥도날드 역삼점", 9500, "식비", LocalDate.now().minusDays(2), "점심 식사");
        createExpense(user4, ApprovalStatus.REQUEST_MORE_INFO, "GS25 편의점", 4000, "기타", LocalDate.now().minusDays(9), "음료 구매");
        createExpense(user4, ApprovalStatus.APPROVED, "교보문고", 22000, "비품", LocalDate.now().minusDays(18), "기술 서적");

        log.info("지출 내역 더미 데이터 생성 완료");
    }

    /**
     * 통계용 현재 월 APPROVED 지출 내역 추가
     * ExpenseRepositoryTests.insertDummyExpenses() 실행 후 사용
     */
    @Test
    public void insertDummyExpensesForStatistics() {
        User user1 = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("20250001 사용자를 찾을 수 없습니다."));
        User user2 = userRepository.findByEmployeeNo("20250002")
                .orElseThrow(() -> new RuntimeException("20250002 사용자를 찾을 수 없습니다."));
        User user3 = userRepository.findByEmployeeNo("20250003")
                .orElseThrow(() -> new RuntimeException("20250003 사용자를 찾을 수 없습니다."));
        User user4 = userRepository.findByEmployeeNo("20250004")
                .orElseThrow(() -> new RuntimeException("20250004 사용자를 찾을 수 없습니다."));

        LocalDate now = LocalDate.now();

        // 영업팀 (20250001, 20250003) - 현재 월 APPROVED
        createExpense(user1, ApprovalStatus.APPROVED, "이마트", 150000, "비품", now, "개발팀 사무용품 구매");
        createExpense(user1, ApprovalStatus.APPROVED, "스타벅스 강남점", 30000, "식비", now.minusDays(3), "팀 회의");
        createExpense(user3, ApprovalStatus.APPROVED, "이마트", 616000, "비품", now.minusDays(5), "마케팅팀 홍보물");
        createExpense(user3, ApprovalStatus.APPROVED, "스타벅스 강남점", 45000, "식비", now.minusDays(1), "팀 회의");

        // 관리팀(20250002, 20250004) - 현재 월 APPROVED
        createExpense(user2, ApprovalStatus.APPROVED, "이마트", 643000, "비품", now.minusDays(4), "영업팀 프레젠테이션 용품");
        createExpense(user2, ApprovalStatus.APPROVED, "스타벅스 강남점", 20000, "식비", now.minusDays(2), "고객 미팅");
        createExpense(user4, ApprovalStatus.APPROVED, "교보문고", 80000, "비품", now.minusDays(2), "기술 서적 구매");
        createExpense(user4, ApprovalStatus.APPROVED, "맥도날드 역삼점", 20000, "식비", now.minusDays(1), "점심 식사");

        // 카테고리별 통계용 추가 데이터
        createExpense(user1, ApprovalStatus.APPROVED, "GS25 편의점", 40000, "기타", now.minusDays(6), "기타 지출");
        createExpense(user2, ApprovalStatus.APPROVED, "GS25 편의점", 50000, "기타", now.minusDays(3), "기타 지출");
        createExpense(user3, ApprovalStatus.APPROVED, "GS25 편의점", 62000, "기타", now.minusDays(2), "기타 지출");

        log.info("통계용 지출 내역 더미 데이터 생성 완료");
    }

    /**
     * 과거 2-3개월치 지출 내역 데이터 추가 (회계 통계용)
     * ExpenseRepositoryTests.insertDummyExpenses() 실행 후 사용
     */
    @Test
    public void insertDummyHistoricalExpenses() {
        User user1 = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("20250001 사용자를 찾을 수 없습니다."));
        User user2 = userRepository.findByEmployeeNo("20250003")
                .orElseThrow(() -> new RuntimeException("20250003 사용자를 찾을 수 없습니다."));
        User user3 = userRepository.findByEmployeeNo("20250005")
                .orElseThrow(() -> new RuntimeException("20250005 사용자를 찾을 수 없습니다."));
        User user4 = userRepository.findByEmployeeNo("20250007")
                .orElseThrow(() -> new RuntimeException("20250007 사용자를 찾을 수 없습니다."));

        LocalDate now = LocalDate.now();

        // 20250001 - 2개월 전 데이터
        createExpense(user1, ApprovalStatus.APPROVED, "스타벅스 강남점", 15000, "식비", now.minusDays(60), "팀 회의 커피");
        createExpense(user1, ApprovalStatus.APPROVED, "이마트", 45000, "비품", now.minusDays(55), "사무용품 구매");
        createExpense(user1, ApprovalStatus.APPROVED, "GS25 편의점", 8000, "기타", now.minusDays(50), "간식 구매");
        createExpense(user1, ApprovalStatus.APPROVED, "교보문고", 35000, "비품", now.minusDays(45), "기술 서적");
        createExpense(user1, ApprovalStatus.APPROVED, "스타벅스 강남점", 18000, "식비", now.minusDays(40), "고객 미팅");

        // 20250001 - 1개월 전 데이터
        createExpense(user1, ApprovalStatus.APPROVED, "이마트", 52000, "비품", now.minusDays(35), "개발 도구");
        createExpense(user1, ApprovalStatus.APPROVED, "맥도날드 역삼점", 12000, "식비", now.minusDays(30), "점심 식사");
        createExpense(user1, ApprovalStatus.APPROVED, "GS25 편의점", 6000, "기타", now.minusDays(28), "음료 구매");
        createExpense(user1, ApprovalStatus.APPROVED, "스타벅스 강남점", 20000, "식비", now.minusDays(22), "코드 리뷰 미팅");
        createExpense(user1, ApprovalStatus.APPROVED, "교보문고", 28000, "비품", now.minusDays(20), "도서 구매");

        // 20250003 - 2개월 전 데이터
        createExpense(user2, ApprovalStatus.APPROVED, "스타벅스 강남점", 25000, "식비", now.minusDays(58), "고객 미팅");
        createExpense(user2, ApprovalStatus.APPROVED, "이마트", 68000, "비품", now.minusDays(52), "프레젠테이션 용품");
        createExpense(user2, ApprovalStatus.APPROVED, "GS25 편의점", 5000, "기타", now.minusDays(48), "음료 구매");
        createExpense(user2, ApprovalStatus.APPROVED, "교보문고", 42000, "비품", now.minusDays(42), "업무 서적");
        createExpense(user2, ApprovalStatus.APPROVED, "스타벅스 강남점", 22000, "식비", now.minusDays(38), "고객 미팅");

        // 20250003 - 1개월 전 데이터
        createExpense(user2, ApprovalStatus.APPROVED, "이마트", 55000, "비품", now.minusDays(32), "마케팅 자료");
        createExpense(user2, ApprovalStatus.APPROVED, "맥도날드 역삼점", 10000, "식비", now.minusDays(27), "점심 식사");
        createExpense(user2, ApprovalStatus.APPROVED, "GS25 편의점", 4000, "기타", now.minusDays(24), "간식 구매");
        createExpense(user2, ApprovalStatus.APPROVED, "스타벅스 강남점", 30000, "식비", now.minusDays(19), "고객 미팅");
        createExpense(user2, ApprovalStatus.APPROVED, "교보문고", 38000, "비품", now.minusDays(16), "업무 서적");

        // 20250005 - 2개월 전 데이터
        createExpense(user3, ApprovalStatus.APPROVED, "스타벅스 강남점", 18000, "식비", now.minusDays(56), "팀 회의");
        createExpense(user3, ApprovalStatus.APPROVED, "이마트", 75000, "비품", now.minusDays(50), "마케팅 용품");
        createExpense(user3, ApprovalStatus.APPROVED, "GS25 편의점", 9000, "기타", now.minusDays(46), "간식 구매");
        createExpense(user3, ApprovalStatus.APPROVED, "교보문고", 48000, "비품", now.minusDays(40), "마케팅 도서");
        createExpense(user3, ApprovalStatus.APPROVED, "스타벅스 강남점", 16000, "식비", now.minusDays(36), "팀 회의");

        // 20250005 - 1개월 전 데이터
        createExpense(user3, ApprovalStatus.APPROVED, "이마트", 62000, "비품", now.minusDays(33), "마케팅 자료");
        createExpense(user3, ApprovalStatus.APPROVED, "맥도날드 역삼점", 13000, "식비", now.minusDays(29), "점심 식사");
        createExpense(user3, ApprovalStatus.APPROVED, "GS25 편의점", 7000, "기타", now.minusDays(26), "음료 구매");
        createExpense(user3, ApprovalStatus.APPROVED, "스타벅스 강남점", 24000, "식비", now.minusDays(21), "팀 회의");
        createExpense(user3, ApprovalStatus.APPROVED, "교보문고", 36000, "비품", now.minusDays(17), "마케팅 도서");

        // 20250007 - 2개월 전 데이터
        createExpense(user4, ApprovalStatus.APPROVED, "스타벅스 강남점", 14000, "식비", now.minusDays(54), "코드 리뷰 미팅");
        createExpense(user4, ApprovalStatus.APPROVED, "이마트", 38000, "비품", now.minusDays(48), "개발 도구");
        createExpense(user4, ApprovalStatus.APPROVED, "GS25 편의점", 6500, "기타", now.minusDays(44), "음료 구매");
        createExpense(user4, ApprovalStatus.APPROVED, "교보문고", 32000, "비품", now.minusDays(38), "기술 서적");
        createExpense(user4, ApprovalStatus.APPROVED, "스타벅스 강남점", 17000, "식비", now.minusDays(34), "코드 리뷰 미팅");

        // 20250007 - 1개월 전 데이터
        createExpense(user4, ApprovalStatus.APPROVED, "이마트", 48000, "비품", now.minusDays(31), "개발 도구");
        createExpense(user4, ApprovalStatus.APPROVED, "맥도날드 역삼점", 11000, "식비", now.minusDays(28), "점심 식사");
        createExpense(user4, ApprovalStatus.APPROVED, "GS25 편의점", 5500, "기타", now.minusDays(25), "간식 구매");
        createExpense(user4, ApprovalStatus.APPROVED, "스타벅스 강남점", 19000, "식비", now.minusDays(23), "코드 리뷰 미팅");
        createExpense(user4, ApprovalStatus.APPROVED, "교보문고", 29000, "비품", now.minusDays(19), "기술 서적");

        log.info("과거 지출 내역 더미 데이터 생성 완료");
    }

    private void createExpense(User user, ApprovalStatus status, String merchant, int amount, 
                               String category, LocalDate receiptDate, String description) {
        Expense expense = Expense.builder()
                .writer(user)
                .status(status)
                .merchant(merchant)
                .amount(amount)
                .category(category)
                .receiptDate(receiptDate)
                .description(description)
                .build();
        expenseRepository.save(expense);
    }
}

