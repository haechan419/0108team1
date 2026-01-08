package com.Team1_Back.repository;

import com.Team1_Back.domain.Expense;
import com.Team1_Back.domain.User;
import com.Team1_Back.domain.UserBudgetMonthly;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@SpringBootTest
@Slf4j
public class UserBudgetMonthlyRepositoryTests {

    @Autowired
    private UserBudgetMonthlyRepository userBudgetMonthlyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    // ========== 더미 데이터 생성 메서드 ==========

    /**
     * 사용자별 월간 예산 더미 데이터 생성 (최근 6개월)
     * UserRepositoryTests.insertDummyUsers() 실행 후 사용
     */
    @Test
    public void insertDummyUserBudgets() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        // 필요한 사용자들
        User user1 = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("20250001 사용자를 찾을 수 없습니다."));
        User user2 = userRepository.findByEmployeeNo("20250002")
                .orElseThrow(() -> new RuntimeException("20250002 사용자를 찾을 수 없습니다."));
        User user3 = userRepository.findByEmployeeNo("20250003")
                .orElseThrow(() -> new RuntimeException("20250003 사용자를 찾을 수 없습니다."));
        User user4 = userRepository.findByEmployeeNo("20250004")
                .orElseThrow(() -> new RuntimeException("20250004 사용자를 찾을 수 없습니다."));

        LocalDate now = LocalDate.now();

        // 20250001 - 최근 6개월 예산
        createBudget(user1, now.format(formatter), 2000000, null);
        createBudget(user1, now.minusMonths(1).format(formatter), 2000000, null);
        createBudget(user1, now.minusMonths(2).format(formatter), 1500000, null);
        createBudget(user1, now.minusMonths(3).format(formatter), 2000000, null);
        createBudget(user1, now.minusMonths(4).format(formatter), 2500000, null);
        createBudget(user1, now.minusMonths(5).format(formatter), 2000000, null);

        // 20250002 - 최근 6개월 예산
        createBudget(user2, now.format(formatter), 2500000, null);
        createBudget(user2, now.minusMonths(1).format(formatter), 2500000, null);
        createBudget(user2, now.minusMonths(2).format(formatter), 2000000, null);
        createBudget(user2, now.minusMonths(3).format(formatter), 2500000, null);
        createBudget(user2, now.minusMonths(4).format(formatter), 2000000, null);
        createBudget(user2, now.minusMonths(5).format(formatter), 1500000, null);

        // 20250003 - 최근 6개월 예산
        createBudget(user3, now.format(formatter), 1500000, null);
        createBudget(user3, now.minusMonths(1).format(formatter), 2000000, null);
        createBudget(user3, now.minusMonths(2).format(formatter), 1500000, null);
        createBudget(user3, now.minusMonths(3).format(formatter), 1000000, null);
        createBudget(user3, now.minusMonths(4).format(formatter), 2000000, null);
        createBudget(user3, now.minusMonths(5).format(formatter), 1500000, null);

        // 20250004 - 최근 6개월 예산
        createBudget(user4, now.format(formatter), 2000000, null);
        createBudget(user4, now.minusMonths(1).format(formatter), 2000000, null);
        createBudget(user4, now.minusMonths(2).format(formatter), 2500000, null);
        createBudget(user4, now.minusMonths(3).format(formatter), 2000000, null);
        createBudget(user4, now.minusMonths(4).format(formatter), 1500000, null);
        createBudget(user4, now.minusMonths(5).format(formatter), 2000000, null);

        log.info("사용자별 월간 예산 더미 데이터 생성 완료");
    }

    /**
     * 예산 초과 주의 인원 생성 (80-90% 소진율로 예산 조정)
     * ExpenseRepositoryTests.insertDummyExpensesForStatistics() 실행 후 사용
     */
    @Test
    public void updateBudgetsForOverBudgetUsers() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        String currentYearMonth = LocalDate.now().format(formatter);

        User user1 = userRepository.findByEmployeeNo("20250001")
                .orElseThrow(() -> new RuntimeException("20250001 사용자를 찾을 수 없습니다."));
        User user3 = userRepository.findByEmployeeNo("20250002")
                .orElseThrow(() -> new RuntimeException("20250002 사용자를 찾을 수 없습니다."));

        // 20250001 - 목표: 85% 소진율
        updateBudgetForUser(user1, currentYearMonth, 0.85);

        // 20250002 - 목표: 88% 소진율
        updateBudgetForUser(user3, currentYearMonth, 0.88);

        log.info("예산 초과 주의 인원 예산 업데이트 완료");
    }

    private void updateBudgetForUser(User user, String yearMonth, double targetUsageRate) {
        // 현재 월의 APPROVED 지출 금액 합계 계산
        // ✅ 최적화: findAll() 대신 적절한 쿼리 사용 (receiptDate 기준)
        LocalDate startDate = LocalDate.parse(yearMonth + "-01");
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        List<Expense> approvedExpenses = expenseRepository.findForReportByUserIdAndDateRange(
                user.getId(),
                startDate,
                endDate
        );

        int totalExpense = approvedExpenses.stream()
                .mapToInt(Expense::getAmount)
                .sum();

        // 목표 소진율에 맞춰 예산 계산
        int calculatedBudget = Math.max(totalExpense * 100 / (int)(targetUsageRate * 100), 100000); // 최소 10만원

        // 예산 업데이트 또는 생성
        userBudgetMonthlyRepository.findByUserIdAndYearMonth(user.getId(), yearMonth)
                .ifPresentOrElse(
                    budget -> {
                        budget.setMonthlyLimit(calculatedBudget);
                        userBudgetMonthlyRepository.save(budget);
                        log.info("예산 업데이트: User={}, YearMonth={}, Limit={} (지출={}, 소진율={}%)", 
                                user.getEmployeeNo(), yearMonth, calculatedBudget, totalExpense, 
                                totalExpense * 100 / calculatedBudget);
                    },
                    () -> {
                        UserBudgetMonthly budget = UserBudgetMonthly.builder()
                                .user(user)
                                .yearMonth(yearMonth)
                                .monthlyLimit(calculatedBudget)
                                .note(null)
                                .build();
                        userBudgetMonthlyRepository.save(budget);
                        log.info("예산 생성: User={}, YearMonth={}, Limit={} (지출={}, 소진율={}%)", 
                                user.getEmployeeNo(), yearMonth, calculatedBudget, totalExpense, 
                                totalExpense * 100 / calculatedBudget);
                    }
                );
    }

    private void createBudget(User user, String yearMonth, int monthlyLimit, String note) {
        // 이미 존재하는지 확인
        if (userBudgetMonthlyRepository.findByUserIdAndYearMonth(user.getId(), yearMonth).isEmpty()) {
            UserBudgetMonthly budget = UserBudgetMonthly.builder()
                    .user(user)
                    .yearMonth(yearMonth)
                    .monthlyLimit(monthlyLimit)
                    .note(note)
                    .build();
            userBudgetMonthlyRepository.save(budget);
            log.info("예산 생성: User={}, YearMonth={}, Limit={}", user.getEmployeeNo(), yearMonth, monthlyLimit);
        }
    }
}

