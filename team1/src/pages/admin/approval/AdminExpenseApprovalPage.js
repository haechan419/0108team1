import React, { useEffect, useState, useRef } from "react";
import {
  useNavigate,
  useSearchParams,
  createSearchParams,
} from "react-router-dom";
import { getExpenseApprovals } from "../../../api/approvalApi";
import { expenseApi } from "../../../api/expenseApi";
import "./AdminExpenseApprovalPage.css";
import AppLayout from "../../../components/layout/AppLayout";

const AdminExpenseApprovalPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [expensesMap, setExpensesMap] = useState({}); // refId -> Expense 매핑
  const [hasReceiptMap, setHasReceiptMap] = useState({}); // refId -> 영수증 유무
  const [pageResponse, setPageResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // URL 쿼리 파라미터에서 초기값 읽기 (mall 패턴)
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(page) || page < 1 ? 1 : page;
  });
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || ""
  );
  const [startDate, setStartDate] = useState(
    () => searchParams.get("startDate") || ""
  );
  const [endDate, setEndDate] = useState(
    () => searchParams.get("endDate") || ""
  );

  // URL 쿼리 파라미터 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (statusFilter) params.set("status", statusFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }
  }, [currentPage, statusFilter, startDate, endDate, setSearchParams]);

  // 필터 변경 시 첫 페이지로 리셋 (URL 동기화와 분리)
  const prevFilters = useRef({ statusFilter, startDate, endDate });
  useEffect(() => {
    const prev = prevFilters.current;
    const filtersChanged =
      prev.statusFilter !== statusFilter ||
      prev.startDate !== startDate ||
      prev.endDate !== endDate;

    if (filtersChanged && (statusFilter || startDate || endDate)) {
      setCurrentPage(1);
      prevFilters.current = { statusFilter, startDate, endDate };
    }
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    loadApprovalRequests();
  }, [currentPage, statusFilter, startDate, endDate]);

  const loadApprovalRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 15,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const response = await getExpenseApprovals(params);
      // 백엔드에서 이미 DRAFT를 제외하므로 프론트 필터링 불필요
      // REQUEST_MORE_INFO 상태는 프론트엔드에서 필터링하여 표시하지 않음
      const requests = (response.content || []).filter(
        (request) => request.statusSnapshot !== "REQUEST_MORE_INFO"
      );
      setApprovalRequests(requests);
      setPageResponse(response);

      // 각 ApprovalRequest의 refId로 Expense 정보 조회 및 영수증 유무 확인
      const expenses = {};
      const hasReceipt = {};
      for (const request of requests) {
        if (request.refId) {
          try {
            const expenseResponse = await expenseApi.getExpense(request.refId);
            expenses[request.refId] = expenseResponse.data;

            // 영수증 유무 확인
            if (expenseResponse.data.receiptId) {
              hasReceipt[request.refId] = true;
            } else {
              hasReceipt[request.refId] = false;
            }
          } catch (error) {
            console.error(
              `지출 내역 조회 실패 (refId: ${request.refId}):`,
              error
            );
            hasReceipt[request.refId] = false;
          }
        }
      }
      setExpensesMap(expenses);
      setHasReceiptMap(hasReceipt);
    } catch (error) {
      console.error("결재 목록 조회 실패:", error);

      // 403 Forbidden 에러 처리 (관리자 권한 없음)
      if (error.response?.status === 403) {
        alert("관리자 권한이 필요합니다.");
        navigate("/receipt/expenses");
        return;
      }

      setApprovalRequests([]);
      setPageResponse(null);
      setExpensesMap({});
      setHasReceiptMap({});
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadApprovalRequests();
  };

  const handleApprovalClick = (approvalRequest) => {
    // URL 쿼리 파라미터를 포함하여 상세 페이지로 이동 (mall 패턴)
    const params = createSearchParams({
      page: currentPage.toString(),
      ...(statusFilter && { status: statusFilter }),
      ...(startDate && { startDate: startDate }),
      ...(endDate && { endDate: endDate }),
    });
    navigate(`/admin/approval/${approvalRequest.id}?${params.toString()}`);
  };

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

  return (
    <AppLayout>
      <div className="admin-expense-approval-page">
        <div className="page-header-with-tab">
          <div className="page-title-section">
            <h1 className="page-title">지출 결재 관리</h1>
            <button
              className="close-tab-btn"
              onClick={() => navigate("/admin")}
            >
              ×
            </button>
          </div>
          <p className="page-description">
            제출된 지출 내역을 검토하고 승인/반려 처리를 할 수 있습니다.
          </p>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-item">
              <label>전자결재 상태</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">전체</option>
                <option value="SUBMITTED">상신</option>
                <option value="APPROVED">승인</option>
                <option value="REJECTED">반려</option>
              </select>
            </div>
            <div className="filter-item">
              <label>상신일</label>
              <div className="date-range">
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="date-separator">-</span>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="filter-actions">
              <button className="btn btn-primary" onClick={handleSearch}>
                조회
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : approvalRequests.length === 0 ? (
            <div className="empty-state">결재 요청이 없습니다.</div>
          ) : (
            <>
              <table className="approval-table">
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>상신일</th>
                    <th>요청자</th>
                    <th>지출 일자</th>
                    <th>가맹점명</th>
                    <th>금액</th>
                    <th>영수증</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalRequests.map((request, index) => {
                    const expense = expensesMap[request.refId];
                    const hasReceipt = hasReceiptMap[request.refId];
                    // DRAFT 상태의 Expense는 ApprovalRequest가 없어서 id가 null일 수 있음
                    const uniqueKey =
                      request.id ||
                      `draft-${request.refId}` ||
                      `index-${index}`;
                    return (
                      <tr
                        key={uniqueKey}
                        onClick={() => handleApprovalClick(request)}
                        className="table-row-clickable"
                      >
                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              request.statusSnapshot
                            )}`}
                          >
                            {getStatusLabel(request.statusSnapshot)}
                          </span>
                        </td>
                        <td>
                          {request.createdAt
                            ? request.createdAt.split("T")[0]
                            : "-"}
                        </td>
                        <td>{request.requesterName || "-"}</td>
                        <td>{expense?.receiptDate || "-"}</td>
                        <td>{expense?.merchant || "-"}</td>
                        <td className="amount-cell">
                          {expense?.amount
                            ? `${expense.amount.toLocaleString()}원`
                            : "-"}
                        </td>
                        <td>
                          {hasReceipt === true ? (
                            <span className="receipt-badge has-receipt">
                              있음
                            </span>
                          ) : hasReceipt === false ? (
                            <span className="receipt-badge no-receipt">
                              없음
                            </span>
                          ) : (
                            <span className="receipt-badge">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {pageResponse &&
                pageResponse.pageNumList &&
                Array.isArray(pageResponse.pageNumList) &&
                pageResponse.pageNumList.length > 0 && (
                  <div className="pagination">
                    {pageResponse.pageNumList.map((page) => (
                      <button
                        key={page}
                        className={`pagination-btn ${
                          page === pageResponse.current ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminExpenseApprovalPage;
