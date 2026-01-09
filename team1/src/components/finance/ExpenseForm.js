import React, { useState, useEffect } from "react";
import { uploadReceipt, getExtraction } from "../../api/receiptApi";
import OcrResultModal from "./OcrResultModal";
import FetchingModal from "../common/FetchingModal";
import useCustomMove from "../../hooks/useCustomMove";
import "./ExpenseForm.css";

const ExpenseForm = ({ expense, onSubmit, onCancel, onSubmitComplete }) => {
  const [formData, setFormData] = useState({
    receiptDate: expense?.receiptDate || new Date().toISOString().split("T")[0],
    merchant: expense?.merchant || "",
    amount: expense?.amount || 0,
    category: expense?.category || "",
    description: expense?.description || "",
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [uploadedReceiptId, setUploadedReceiptId] = useState(null);
  const [ocrApplied, setOcrApplied] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [useReceipt, setUseReceipt] = useState(true); // 영수증 사용 여부 (기본값: true)

  const { moveToExpenseList } = useCustomMove();

  useEffect(() => {
    if (expense) {
      setFormData({
        receiptDate: expense.receiptDate || "",
        merchant: expense.merchant || "",
        amount: expense.amount || 0,
        category: expense.category || "",
        description: expense.description || "",
      });
    }
  }, [expense]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setReceiptFile(selectedFile);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // 영수증 업로드 및 OCR 결과 조회
  const handleReceiptUpload = async (expenseId) => {
    if (!receiptFile || !expenseId) return;

    setUploadingReceipt(true);
    setFetching(true);
    try {
      // 영수증 업로드
      const receiptData = await uploadReceipt(expenseId, receiptFile);
      setUploadedReceiptId(receiptData.id);
      
      // OCR 처리 중 상태 표시
      setOcrProcessing(true);
      
      // OCR 결과 조회 (최대 5번 재시도, 2초 간격)
      let extraction = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries && !extraction) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
          extraction = await getExtraction(receiptData.id);
          if (extraction) break;
        } catch (error) {
          // OCR 결과가 아직 없을 수 있음
          console.log(`OCR 결과 조회 시도 ${retryCount + 1}/${maxRetries}`);
        }
        retryCount++;
      }
      
      setOcrProcessing(false);
      setFetching(false);
      
      if (extraction) {
        setOcrResult(extraction);
        setShowOcrModal(true);
      } else {
        alert("영수증이 업로드되었습니다. OCR 처리는 진행 중입니다.");
      }
    } catch (error) {
      console.error("영수증 업로드 실패:", error);
      setOcrProcessing(false);
      setFetching(false);
      alert("영수증 업로드에 실패했습니다. 나중에 다시 시도해주세요.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  // OCR 결과를 폼에 적용
  const handleApplyOcrResult = (extraction) => {
    if (!extraction) return;
    
    setFormData({
      ...formData,
      receiptDate: extraction.extractedDate || formData.receiptDate,
      merchant: extraction.extractedMerchant || formData.merchant,
      amount: extraction.extractedAmount || formData.amount,
      category: extraction.extractedCategory || formData.category,
    });
    
    setOcrApplied(true);
    setShowOcrModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 영수증 모드인데 영수증이 없거나 OCR 적용이 안 된 경우 (등록 모드만 체크)
    if (!expense && useReceipt && !receiptFile && !ocrApplied) {
      alert("먼저 영수증을 업로드하고 AI 인식 결과를 확인해주세요.");
      return;
    }

    // 직접 입력 모드에서 필수 필드 검증
    if (!useReceipt) {
      if (!formData.receiptDate || !formData.merchant || !formData.amount || !formData.category) {
        alert("필수 항목을 모두 입력해주세요.");
        return;
      }
    }
    
    setFetching(true);
    try {
      // 지출 등록/수정
      const result = await onSubmit(formData);
      
      // 영수증 업로드 및 OCR 처리 (영수증 모드이고 새로 업로드한 영수증이 있는 경우)
      const expenseId = expense ? expense.id : (result?.id || result?.result);
      if (useReceipt && receiptFile && expenseId) {
        await handleReceiptUpload(expenseId);
      } else {
        setFetching(false);
        // 직접 입력 모드이거나 영수증이 없는 경우 바로 완료
        if (onSubmitComplete) {
          onSubmitComplete();
        } else {
          moveToExpenseList();
        }
      }
    } catch (error) {
      console.error(expense ? "수정 실패:" : "등록 실패:", error);
      setFetching(false);
      alert(expense ? "지출 수정에 실패했습니다." : "지출 등록에 실패했습니다.");
    }
  };

  // OCR 모달이 닫힐 때 완료 콜백 호출
  const handleOcrModalClose = () => {
    setShowOcrModal(false);
    setFetching(false);
    if (onSubmitComplete) {
      onSubmitComplete();
    } else {
      // 완료 후 목록으로 이동 (D:\uj\fullstack 패턴)
      moveToExpenseList();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      {fetching && <FetchingModal />}
      
      {/* 등록 모드일 때만 선택 옵션 표시 */}
      {!expense && (
        <div className="form-group">
          <div className="registration-mode-selector">
            <label className="mode-selector-label">
              <input
                type="checkbox"
                checked={useReceipt}
                onChange={(e) => {
                  setUseReceipt(e.target.checked);
                  // 체크 해제 시 영수증 관련 상태 초기화
                  if (!e.target.checked) {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    setOcrApplied(false);
                    setOcrResult(null);
                  }
                }}
                className="mode-checkbox"
              />
              <span className="mode-checkbox-label">
                📎 영수증이 있으신가요? (OCR 자동 인식)
              </span>
            </label>
            <p className="mode-hint">
              {useReceipt 
                ? "영수증을 업로드하면 AI가 자동으로 정보를 인식합니다."
                : "영수증 없이 직접 입력하여 등록할 수 있습니다."}
            </p>
          </div>
        </div>
      )}

      {/* 영수증 업로드 모드: 영수증 업로드 영역만 표시 (등록 모드 또는 수정 모드) */}
      {useReceipt && (
        <>
          <div className="form-group receipt-upload-section">
            <div className="receipt-upload-header">
              <label className="form-label receipt-label">
                📎 영수증 업로드
                <span className="receipt-badge">OCR 자동 인식</span>
              </label>
              <span className="receipt-hint">
                {expense 
                  ? "새 영수증을 업로드하면 정보가 자동으로 입력됩니다 (선택사항)"
                  : "영수증을 업로드하면 정보가 자동으로 입력됩니다"}
              </span>
            </div>
            <div className="receipt-upload-area">
              <label className="file-input-label-large">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingReceipt}
                  style={{ display: "none" }}
                />
                {!receiptFile ? (
                  <div className="file-drop-zone">
                    <div className="file-drop-icon">📄</div>
                    <div className="file-drop-text">
                      <strong>클릭하거나 드래그하여 영수증 업로드</strong>
                      <span>이미지 파일 (JPG, PNG 등)</span>
                    </div>
                  </div>
                ) : (
                  <div className="file-preview-container">
                    <div className="file-preview-info">
                      <span className="file-name">{receiptFile.name}</span>
                      <span className="file-size">({(receiptFile.size / 1024).toFixed(2)} KB)</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={uploadingReceipt}
                        className="file-remove-btn"
                      >
                        ×
                      </button>
                    </div>
                    {receiptPreview && (
                      <div className="file-preview-image">
                        <img 
                          src={receiptPreview} 
                          alt="영수증 미리보기" 
                        />
                      </div>
                    )}
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="form-divider"></div>

          {/* OCR 결과 요약 - 입력 폼은 숨기고, 값만 요약으로 표시 (영수증 업로드한 경우만) */}
          {(receiptFile || ocrApplied) && (
          <div className="form-group">
            <label className="form-label">
              AI 인식 결과 요약
              {ocrApplied && <span className="ocr-applied-badge">✓ OCR 적용됨</span>}
            </label>
            <div className="ocr-summary-card">
              <div className="ocr-summary-row">
                <span className="ocr-summary-label">지출 일자</span>
                <span className="ocr-summary-value">{formData.receiptDate || "-"}</span>
              </div>
              <div className="ocr-summary-row">
                <span className="ocr-summary-label">가맹점명</span>
                <span className="ocr-summary-value">{formData.merchant || "-"}</span>
              </div>
              <div className="ocr-summary-row">
                <span className="ocr-summary-label">금액</span>
                <span className="ocr-summary-value">
                  {formData.amount ? `${formData.amount.toLocaleString()}원` : "-"}
                </span>
              </div>
              <div className="ocr-summary-row">
                <span className="ocr-summary-label">카테고리</span>
                <span className="ocr-summary-value">{formData.category || "-"}</span>
              </div>
            </div>
            <p className="ocr-summary-hint">
              값이 다르다면 OCR 결과 모달에서 직접 수정한 뒤 다시 적용할 수 있습니다.
            </p>
          </div>
          )}
        </>
      )}

      {/* 직접 입력 모드: 일반 입력 폼 표시 */}
      {(!expense && !useReceipt) && (
        <>
          <div className="form-group">
            <label className="form-label">지출 일자 *</label>
            <input
              className="form-input"
              type="date"
              value={formData.receiptDate}
              onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">가맹점명 *</label>
            <input
              className="form-input"
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              required
              placeholder="가맹점명을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label className="form-label">금액 *</label>
            <input
              className="form-input"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
              required
              min="0"
              placeholder="금액을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label className="form-label">카테고리 *</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">선택하세요</option>
              <option value="식비">식비</option>
              <option value="교통비">교통비</option>
              <option value="비품">비품</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">상세내용</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="상세 내용을 입력하세요"
            />
          </div>
        </>
      )}

      {/* 수정 모드: 기존 데이터 표시 */}
      {expense && (
        <>
          <div className="form-group">
            <label className="form-label">지출 일자</label>
            <input
              className="form-input"
              type="date"
              value={formData.receiptDate}
              onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">가맹점명</label>
            <input
              className="form-input"
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">금액</label>
            <input
              className="form-input"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">카테고리</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">선택하세요</option>
              <option value="식비">식비</option>
              <option value="교통비">교통비</option>
              <option value="비품">비품</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">상세내용</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </>
      )}


      <div className="form-actions" style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
        <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={uploadingReceipt || ocrProcessing}>
          취소
        </button>
        {/* AI 사전 검증 버튼 (비활성화) */}
        <button 
          className="btn btn-ai-precheck" 
          type="button" 
          disabled={true}
          title="AI 사전 검증 기능은 준비 중입니다"
          style={{
            backgroundColor: "#9ca3af",
            color: "white",
            cursor: "not-allowed",
            opacity: 0.6
          }}
        >
          🤖 AI 사전 검증
        </button>
        <button className="btn btn-primary" type="submit" disabled={uploadingReceipt || ocrProcessing}>
          {uploadingReceipt ? "업로드 중..." : ocrProcessing ? "OCR 처리 중..." : expense ? "수정" : "등록"}
        </button>
      </div>

      {/* OCR 결과 모달 */}
      <OcrResultModal
        isOpen={showOcrModal}
        onClose={handleOcrModalClose}
        extraction={ocrResult}
        onApply={handleApplyOcrResult}
        onCancel={handleOcrModalClose}
      />
    </form>
  );
};

export default ExpenseForm;

