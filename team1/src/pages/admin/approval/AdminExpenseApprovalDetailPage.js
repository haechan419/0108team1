import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getApprovalRequest, getApprovalLogs, actionApproval } from "../../../api/approvalApi";
import { expenseApi } from "../../../api/expenseApi";
import { getReceipt, getReceiptImage, getReceiptExtraction } from "../../../api/adminReceiptApi";
import FetchingModal from "../../../components/common/FetchingModal";
import ApprovalTimeline from "../../../components/admin/approval/ApprovalTimeline";
import "./AdminExpenseApprovalDetailPage.css";

const AdminExpenseApprovalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [approvalRequest, setApprovalRequest] = useState(null);
  const [expense, setExpense] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptImageError, setReceiptImageError] = useState(null);
  const [extraction, setExtraction] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    if (id) {
      loadApprovalDetail();
    }
  }, [id]);

  const loadApprovalDetail = async () => {
    setLoading(true);
    try {
      // ApprovalRequest 조회
      const approvalData = await getApprovalRequest(id);
      setApprovalRequest(approvalData);

      // Expense 조회 (refId 사용)
      if (approvalData.refId) {
        try {
          const expenseResponse = await expenseApi.getExpense(approvalData.refId);
          setExpense(expenseResponse.data);

          // 영수증 정보 조회 (있는 경우)
          if (expenseResponse.data.receiptId) {
            try {
              const receiptData = await getReceipt(expenseResponse.data.receiptId);
              setReceipt(receiptData);

              // 영수증 이미지 로드
              try {
                const imageResponse = await getReceiptImage(expenseResponse.data.receiptId);
                const blob = new Blob([imageResponse.data], { type: "image/jpeg" });
                const url = URL.createObjectURL(blob);
                setReceiptImage(url);
                setReceiptImageError(null);
              } catch (error) {
                console.error("영수증 이미지 로드 실패:", error);
                setReceiptImage(null);
                setReceiptImageError("이미지를 불러올 수 없습니다.");
              }

              // OCR 추출 결과 조회
              try {
                const extractionData = await getReceiptExtraction(expenseResponse.data.receiptId);
                setExtraction(extractionData);
              } catch (error) {
                console.error("OCR 결과 조회 실패:", error);
                setExtraction(null);
              }
            } catch (error) {
              console.error("영수증 정보 조회 실패:", error);
            }
          } else {
            setReceiptImage(null);
            setReceiptImageError("영수증이 업로드되지 않았습니다.");
          }
        } catch (error) {
          console.error("지출 내역 조회 실패:", error);
        }
      }

      // 결재 로그 조회
      try {
        const logsData = await getApprovalLogs(id);
        setLogs(logsData || []);
      } catch (error) {
        console.error("결재 로그 조회 실패:", error);
        setLogs([]);
      }
    } catch (error) {
      console.error("결재 상세 조회 실패:", error);
      alert("결재 정보를 불러올 수 없습니다.");
      navigate("/admin/approval");
    } finally {
      setLoading(false);
    }
  };

  const handleActionConfirm = async () => {
    if (!approvalRequest || !actionType) {
      alert("결재 처리 유형을 선택해주세요.");
      return;
    }

    // ApprovalRequest id가 null인 경우 (DRAFT 상태) 처리 불가
    if (!approvalRequest.id) {
      alert("임시저장 상태의 지출 내역은 결재 처리할 수 없습니다. 먼저 제출해주세요.");
      return;
    }

    // 반려와 보완요청은 사유 필수
    if ((actionType === "REJECT" || actionType === "REQUEST_MORE_INFO") && !actionReason.trim()) {
      alert("사유를 입력해주세요.");
      return;
    }

    try {
      await actionApproval(approvalRequest.id, {
        action: actionType,
        message: actionReason || undefined,
      });

      // 성공 시 상세 정보 다시 로드
      handleCloseActionModal();
      await loadApprovalDetail();
    } catch (error) {
      console.error("액션 처리 실패:", error);
      const errorMessage = error.response?.data?.message || error.message || "알 수 없는 오류가 발생했습니다.";
      alert(`${actionType === "APPROVE" ? "승인" : actionType === "REJECT" ? "반려" : "보완 요청"} 처리에 실패했습니다.\n${errorMessage}`);
    }
  };

  const handleOpenActionModal = (type) => {
    // type이 null이면 기본값 없이 모달 열기 (사용자가 선택)
    setActionType(type || null);
    setActionReason("");
    setShowActionModal(true);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setActionType(null);
    setActionReason("");
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      DRAFT: "임시저장",
      SUBMITTED: "상신",
      APPROVED: "결재완료",
      REJECTED: "반려",
      REQUEST_MORE_INFO: "보완요청",
    };
    return statusMap[status || ""] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      DRAFT: "status-draft",
      SUBMITTED: "status-submitted",
      APPROVED: "status-approved",
      REJECTED: "status-rejected",
      REQUEST_MORE_INFO: "status-request-more-info",
    };
    return classMap[status || ""] || "";
  };

  // 결재 처리 가능 여부
  const canProcess = approvalRequest?.statusSnapshot === "SUBMITTED" || approvalRequest?.statusSnapshot === "REQUEST_MORE_INFO";

  if (loading && !approvalRequest) {
    return (
      <div className="admin-expense-approval-detail-page">
        <FetchingModal />
      </div>
    );
  }

  if (!approvalRequest) {
    return (
      <div className="admin-expense-approval-detail-page">
        <div className="empty-state">결재 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="admin-expense-approval-detail-page">
      {loading && <FetchingModal />}

      <div className="page-header-with-tab">
        <div className="page-title-section">
          <h1 className="page-title">지출 결재 상세</h1>
          <button className="close-tab-btn" onClick={() => {
            // URL 쿼리 파라미터를 유지하여 목록 페이지로 이동 (mall 패턴)
            const queryString = searchParams.toString();
            navigate(`/admin/approval${queryString ? `?${queryString}` : ""}`);
          }}>
            ×
          </button>
        </div>
      </div>

      <div className="detail-content">
        {/* 좌측: 지출 정보 및 영수증 */}
        <div className="detail-left">
          {/* 지출 내역 정보 */}
          <div className="detail-card">
            <h2 className="card-title">지출 내역</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>전자결재 상태</label>
                <span className={`status-badge ${getStatusClass(approvalRequest.statusSnapshot)}`}>
                  {getStatusLabel(approvalRequest.statusSnapshot)}
                </span>
              </div>
              {expense && (
                <>
                  <div className="detail-item">
                    <label>지출 일자</label>
                    <span>{expense.receiptDate || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <label>가맹점명</label>
                    <span>{expense.merchant || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <label>이용금액</label>
                    <span className="amount-value">
                      {expense.amount ? expense.amount.toLocaleString() + "원" : "-"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>사용용도</label>
                    <span>{expense.category || "-"}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>상세내용</label>
                    <span>{expense.description || "-"}</span>
                  </div>
                </>
              )}
              <div className="detail-item">
                <label>요청자</label>
                <span>{approvalRequest.requesterName || "-"}</span>
              </div>
              <div className="detail-item">
                <label>상신일</label>
                <span>
                  {approvalRequest.createdAt
                    ? approvalRequest.createdAt.split("T")[0]
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* 영수증 이미지 (있는 경우) */}
          {receiptImageError || receiptImage ? (
            <div className="detail-card">
              <h2 className="card-title">영수증 원본</h2>
              <div className="receipt-image-container">
                {receiptImage ? (
                  <img src={receiptImage} alt="영수증 원본" className="receipt-image" />
                ) : (
                  <div className="no-image">{receiptImageError}</div>
                )}
              </div>
            </div>
          ) : null}

          {/* OCR 추출 결과 (있는 경우) */}
          {extraction && (
            <div className="detail-card">
              <h2 className="card-title">OCR 추출 결과</h2>
              <div className="extraction-results">
                <div className="extraction-info">
                  <span className="info-label">인식 모델:</span>
                  <span className="info-value">{extraction.modelName || "-"}</span>
                </div>
                <div className="extraction-info">
                  <span className="info-label">신뢰도:</span>
                  <span className="info-value">
                    {extraction.confidence
                      ? `${(extraction.confidence * 100).toFixed(1)}%`
                      : "-"}
                  </span>
                </div>
                <div className="extraction-data">
                  <div className="extraction-item">
                    <label>지출 일자</label>
                    <div className="extraction-value">{extraction.extractedDate || "-"}</div>
                  </div>
                  <div className="extraction-item">
                    <label>가맹점명</label>
                    <div className="extraction-value">{extraction.extractedMerchant || "-"}</div>
                  </div>
                  <div className="extraction-item">
                    <label>금액</label>
                    <div className="extraction-value amount">
                      {extraction.extractedAmount
                        ? `${extraction.extractedAmount.toLocaleString()}원`
                        : "-"}
                    </div>
                  </div>
                  <div className="extraction-item">
                    <label>카테고리</label>
                    <div className="extraction-value">{extraction.extractedCategory || "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI 결재 추천 (준비 중) */}
          <div className="detail-card">
            <h2 className="card-title">🤖 AI 결재 추천</h2>
            <div className="ai-placeholder">
              <p>AI 검토 기능은 준비 중입니다</p>
              <p className="ai-placeholder-hint">AI가 지출 내역을 분석하여 승인/반려/보완 요청을 추천해드립니다.</p>
            </div>
          </div>
        </div>

        {/* 우측: 결재 타임라인 및 액션 */}
        <div className="detail-right">
          {/* 결재 타임라인 */}
          <div className="detail-card">
            <h2 className="card-title">결재 이력</h2>
            <ApprovalTimeline logs={logs} approvalRequest={approvalRequest} />
          </div>

          {/* 결재 처리 버튼 (단일) */}
          {approvalRequest.id && (approvalRequest.statusSnapshot === "SUBMITTED" || approvalRequest.statusSnapshot === "REQUEST_MORE_INFO") ? (
            <div className="detail-card">
              <h2 className="card-title">결재 처리</h2>
              <button
                className="btn btn-primary btn-block"
                onClick={() => handleOpenActionModal(null)}
              >
                결재 처리하기
              </button>
            </div>
          ) : approvalRequest.statusSnapshot === "DRAFT" ? (
            <div className="detail-card">
              <h2 className="card-title">결재 처리</h2>
              <div className="info-message">
                <p>임시저장 상태의 지출 내역입니다.</p>
                <p>결재 처리를 하려면 먼저 제출해주세요.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 통합 결재 처리 모달 */}
      {showActionModal && (
        <div className="modal-overlay" onClick={handleCloseActionModal}>
          <div className="modal-content approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">결재 처리</h3>
              <button className="modal-close-btn" onClick={handleCloseActionModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* 문서 정보 */}
              <div className="approval-document-info">
                <div className="info-row">
                  <span className="info-label">결재 문서명:</span>
                  <span className="info-value">{expense?.merchant || "지출 내역"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">요청자:</span>
                  <span className="info-value">{approvalRequest?.requesterName || "-"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">상신일:</span>
                  <span className="info-value">
                    {approvalRequest?.createdAt
                      ? approvalRequest.createdAt.split("T")[0]
                      : "-"}
                  </span>
                </div>
              </div>

              {/* 결재 처리 유형 선택 */}
              <div className="form-group">
                <label className="form-label">결재 처리 유형</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="actionType"
                      value="APPROVE"
                      checked={actionType === "APPROVE"}
                      onChange={(e) => setActionType(e.target.value)}
                    />
                    <span className="radio-text">승인</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="actionType"
                      value="REJECT"
                      checked={actionType === "REJECT"}
                      onChange={(e) => setActionType(e.target.value)}
                    />
                    <span className="radio-text">반려</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="actionType"
                      value="REQUEST_MORE_INFO"
                      checked={actionType === "REQUEST_MORE_INFO"}
                      onChange={(e) => setActionType(e.target.value)}
                    />
                    <span className="radio-text">보완 요청</span>
                  </label>
                </div>
                
                {/* 기준 가이드라인 */}
                <div className="approval-guideline">
                  <button
                    type="button"
                    className="guideline-toggle"
                    onClick={() => {
                      const guideline = document.querySelector('.guideline-content');
                      if (guideline) {
                        guideline.style.display = guideline.style.display === 'none' ? 'block' : 'none';
                      }
                    }}
                  >
                    📋 기준 가이드라인 보기
                  </button>
                  <div className="guideline-content" style={{ display: 'none' }}>
                    <div className="guideline-section">
                      <h4>✅ 보완 요청 (REQUEST_MORE_INFO)</h4>
                      <ul>
                        <li>영수증이 없거나 불명확한 경우</li>
                        <li>금액이 의심스러운 경우 (비정상적으로 높은 금액)</li>
                        <li>가맹점명이 불명확하거나 매칭되지 않는 경우</li>
                        <li>사용 목적/설명이 부족한 경우</li>
                        <li>추가 증빙 자료가 필요한 경우 (회의록, 계약서, 견적서 등)</li>
                      </ul>
                    </div>
                    <div className="guideline-section">
                      <h4>❌ 반려 (REJECTED)</h4>
                      <ul>
                        <li>명백한 규정 위반 (개인 용도 지출 등)</li>
                        <li>허위/조작 의심이 명확한 경우</li>
                        <li>반복적인 보완 요청에도 불구하고 자료가 제출되지 않은 경우</li>
                        <li>예산 초과로 인한 불가피한 반려</li>
                        <li>회사 정책상 승인 불가능한 지출</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 결재 의견 입력 */}
              <div className="form-group">
                <label className="form-label">
                  결재 의견
                  {(actionType === "REJECT" || actionType === "REQUEST_MORE_INFO") && (
                    <span className="required"> *</span>
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionType === "APPROVE"
                      ? "의견을 입력하세요 (선택사항)"
                      : actionType === "REJECT"
                      ? "반려 사유를 입력하세요 (필수)"
                      : "보완 요청 사유를 입력하세요 (필수)"
                  }
                  rows={5}
                />
                {(actionType === "REJECT" || actionType === "REQUEST_MORE_INFO") && (
                  <div className="form-hint">
                    * 반려 및 보완 요청 시 사유 입력이 필수입니다.
                  </div>
                )}
              </div>
            </div>

            {/* 모달 액션 버튼 */}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCloseActionModal}>
                취소
              </button>
              <button
                className={`btn ${
                  !actionType
                    ? "btn-secondary"
                    : actionType === "APPROVE"
                    ? "btn-success"
                    : actionType === "REJECT"
                    ? "btn-danger"
                    : "btn-warning"
                }`}
                onClick={handleActionConfirm}
                disabled={
                  !actionType ||
                  ((actionType === "REJECT" || actionType === "REQUEST_MORE_INFO") &&
                    !actionReason.trim())
                }
              >
                처리하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenseApprovalDetailPage;

