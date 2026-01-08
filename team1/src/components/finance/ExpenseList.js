import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExpenseList.css";

const ExpenseList = ({
  expenses,
  pageResponse,
  loading,
  onExpenseClick,
  onPageChange,
}) => {
  const navigate = useNavigate();

  const getStatusLabel = (status) => {
    // REQUEST_MORE_INFO 상태는 표시하지 않음
    if (status === "REQUEST_MORE_INFO") {
      return "";
    }
    const statusMap = {
      DRAFT: "임시저장",
      SUBMITTED: "상신",
      APPROVED: "승인",
      REJECTED: "반려",
    };
    return statusMap[status || ""] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      DRAFT: "status-draft",
      SUBMITTED: "status-submitted",
      APPROVED: "status-approved",
      REJECTED: "status-rejected",
    };
    return classMap[status || ""] || "";
  };

  const handleRowClick = (expense) => {
    if (onExpenseClick) {
      onExpenseClick(expense);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  // expenses가 undefined이거나 배열이 아닌 경우 빈 배열로 처리
  // REQUEST_MORE_INFO 상태는 프론트엔드에서 필터링하여 표시하지 않음
  const expensesList = Array.isArray(expenses) 
    ? expenses.filter((expense) => expense.status !== "REQUEST_MORE_INFO")
    : [];

  if (expensesList.length === 0) {
    return (
      <div className="empty-state">
        <p>지출 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="expense-list-container">
      <div className="expense-table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th>전자결재 상태</th>
              <th>전자결재 상신일</th>
              <th>지출품의금액</th>
              <th>사용자</th>
              <th>사용일자</th>
              <th>영수증</th>
            </tr>
          </thead>
          <tbody>
            {(expensesList || []).map((expense, index) => (
              <tr
                key={expense.id || `expense-${index}`}
                onClick={() => handleRowClick(expense)}
                className="clickable-row"
              >
                <td>
                  <span className={`status-badge ${getStatusClass(expense.status)}`}>
                    {getStatusLabel(expense.status)}
                  </span>
                </td>
                <td>{expense.createdAt ? expense.createdAt.split("T")[0] : "-"}</td>
                <td className="amount-cell">
                  {expense.amount ? expense.amount.toLocaleString() : 0}원
                </td>
                <td>{expense.userName || "-"}</td>
                <td>{expense.receiptDate || "-"}</td>
                <td>
                  {expense.hasReceipt === true ? (
                    <span className="receipt-badge has-receipt">있음</span>
                  ) : expense.hasReceipt === false ? (
                    <span className="receipt-badge no-receipt">없음</span>
                  ) : expense.status === "DRAFT" ? (
                    <button
                      className="btn-upload-receipt"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/receipt/expenses/${expense.id}`);
                      }}
                    >
                      영수증 업로드
                    </button>
                  ) : (
                    <span className="receipt-badge">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageResponse && pageResponse.pageNumList && Array.isArray(pageResponse.pageNumList) && pageResponse.pageNumList.length > 0 && (
        <div className="pagination">
          {pageResponse.pageNumList.map((page) => (
            <button
              key={page}
              className={`pagination-btn ${page === pageResponse.current ? "active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
