import { useEffect, useState } from "react";
import { getReceipt, getExtraction, getReceiptImage } from "../../api/receiptApi";
import useCustomMove from "../../hooks/useCustomMove";
import FetchingModal from "../common/FetchingModal";
import "./ReceiptDetailComponent.css";

const initState = {
  id: 0,
  expenseId: 0,
  fileUrl: "",
  fileHash: "",
  uploadedByName: "",
  createdAt: null,
};

const initExtraction = {
  receiptId: 0,
  modelName: "",
  extractedDate: null,
  extractedAmount: null,
  extractedMerchant: "",
  extractedCategory: "",
  confidence: null,
  extractedJson: null,
  createdAt: null,
};

const ReceiptDetailComponent = ({ id }) => {
  const [receipt, setReceipt] = useState(initState);
  const [extraction, setExtraction] = useState(initExtraction);
  const [imageUrl, setImageUrl] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  const { moveToExpenseDetail, moveToExpenseList } = useCustomMove();

  useEffect(() => {
    // id가 없거나 유효하지 않으면 에러 표시
    if (!id || id === "undefined" || isNaN(parseInt(id))) {
      setError("영수증 ID가 올바르지 않습니다.");
      setFetching(false);
      return;
    }

    setFetching(true);
    setError(null);

    // 영수증 정보 조회
    getReceipt(id)
      .then((data) => {
        setReceipt(data);
        // 이미지 로드
        loadImage(id);
      })
      .catch((err) => {
        console.error("영수증 조회 실패:", err);
        setError("영수증을 불러올 수 없습니다. " + (err.response?.data?.message || err.message || ""));
      })
      .finally(() => {
        setFetching(false);
      });

    // OCR 추출 결과 조회
    getExtraction(id)
      .then((data) => {
        setExtraction(data);
      })
      .catch((err) => {
        console.error("OCR 결과 조회 실패:", err);
        // OCR 결과가 없을 수 있으므로 에러는 무시
      });
  }, [id]);

  const loadImage = async (receiptId) => {
    try {
      const response = await getReceiptImage(receiptId);
      const blob = new Blob([response.data], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error) {
      console.error("영수증 이미지 로드 실패:", error);
    }
  };

  const handleApplyExtraction = () => {
    if (extraction && window.confirm("OCR 추출 결과를 지출 내역에 적용하시겠습니까?")) {
      if (receipt.expenseId) {
        moveToExpenseDetail(receipt.expenseId);
      }
    }
  };

  const makeDiv = (title, value) => (
    <div className="flex justify-center">
      <div className="relative mb-4 flex w-full flex-wrap items-stretch">
        <div className="w-1/5 p-6 text-right font-bold">{title}</div>
        <div className="w-4/5 p-6 rounded-r border border-solid shadow-md">{value}</div>
      </div>
    </div>
  );

  // 에러가 있거나 id가 없으면 에러 메시지 표시
  if (error || !id || id === "undefined") {
    return (
      <div className="border-2 border-sky-200 mt-10 m-2 p-4">
        <div className="text-center p-8">
          <div className="text-red-500 text-xl font-bold mb-4">오류</div>
          <p className="text-gray-600 mb-4">{error || "영수증 ID가 필요합니다."}</p>
          <button
            type="button"
            className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
            onClick={moveToExpenseList}
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-sky-200 mt-10 m-2 p-4">
      {fetching ? <FetchingModal /> : <></>}

      {/* 영수증 이미지 섹션 */}
      <div className="mb-6">
        <div className="text-2xl font-bold mb-4">영수증 이미지</div>
        <div className="flex justify-center mb-4">
          <div className="border-2 border-gray-300 rounded p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt="영수증" className="max-w-full max-h-[600px] object-contain" />
            ) : (
              <div className="text-gray-500">이미지를 불러오는 중...</div>
            )}
          </div>
        </div>
        {makeDiv("업로드 일시", receipt.createdAt ? new Date(receipt.createdAt).toLocaleString("ko-KR") : "-")}
        {makeDiv("업로드자", receipt.uploadedByName || "-")}
        {receipt.fileHash && makeDiv("파일 해시", <span className="font-mono text-xs">{receipt.fileHash}</span>)}
      </div>

      {/* OCR 추출 결과 섹션 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold">AI 추출 결과</div>
          {extraction && extraction.receiptId > 0 && (
            <button
              type="button"
              className="inline-block rounded p-2 text-sm text-white bg-blue-500"
              onClick={handleApplyExtraction}
            >
              결과 적용
            </button>
          )}
        </div>

        {extraction && extraction.receiptId > 0 ? (
          <>
            {makeDiv("모델명", extraction.modelName || "-")}
            {makeDiv(
              "신뢰도",
              extraction.confidence ? `${(extraction.confidence * 100).toFixed(1)}%` : "-"
            )}
            {makeDiv(
              "추출 일시",
              extraction.createdAt ? new Date(extraction.createdAt).toLocaleString("ko-KR") : "-"
            )}
            {makeDiv("추출된 날짜", extraction.extractedDate || "-")}
            {makeDiv(
              "추출된 금액",
              extraction.extractedAmount ? extraction.extractedAmount.toLocaleString() + "원" : "-"
            )}
            {makeDiv("추출된 가맹점명", extraction.extractedMerchant || "-")}
            {makeDiv("추출된 카테고리", extraction.extractedCategory || "-")}

            {extraction.extractedJson && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold">원본 JSON 데이터</div>
                  <button
                    type="button"
                    className="text-xs p-1 bg-gray-200 rounded border border-gray-300"
                    onClick={() => {
                      try {
                        const jsonText =
                          typeof extraction.extractedJson === "string"
                            ? extraction.extractedJson
                            : JSON.stringify(extraction.extractedJson);
                        navigator.clipboard.writeText(jsonText);
                        alert("JSON 데이터가 클립보드에 복사되었습니다.");
                      } catch (error) {
                        console.error("복사 실패:", error);
                      }
                    }}
                  >
                    복사
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-[300px] text-xs">
                  {(() => {
                    try {
                      const jsonObj =
                        typeof extraction.extractedJson === "string"
                          ? JSON.parse(extraction.extractedJson)
                          : extraction.extractedJson;
                      return JSON.stringify(jsonObj, null, 2);
                    } catch (error) {
                      return extraction.extractedJson;
                    }
                  })()}
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <p>OCR 추출 결과가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              영수증이 업로드된 후 OCR 처리가 완료되면 결과가 표시됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex justify-end p-4">
        {receipt.expenseId > 0 && (
          <button
            type="button"
            className="inline-block rounded p-4 m-2 text-xl w-32 text-white bg-green-500"
            onClick={() => moveToExpenseDetail(receipt.expenseId)}
          >
            지출 내역
          </button>
        )}
        <button
          type="button"
          className="rounded p-4 m-2 text-xl w-32 text-white bg-blue-500"
          onClick={moveToExpenseList}
        >
          목록
        </button>
      </div>
    </div>
  );
};

export default ReceiptDetailComponent;

