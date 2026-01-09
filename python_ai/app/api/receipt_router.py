from fastapi import APIRouter, UploadFile, File
from app.services.receipt_service import ReceiptService
from app.utils.image_util import resize_image
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/receipt")
service = ReceiptService()

@router.post("/extract")
async def extract_receipt(file: UploadFile = File(...)):
    """영수증 이미지 업로드 및 분석 API"""
    logger.info(f"[Python API] 영수증 OCR 요청 받음: filename={file.filename}, size={file.size} bytes")
    
    try:
        contents = await file.read()
        logger.info(f"[Python API] 파일 읽기 완료: {len(contents)} bytes")
        
        # 이미지 크기 최적화 (API 비용 절감)
        optimized_img = resize_image(contents)
        logger.info(f"[Python API] 이미지 최적화 완료: {len(optimized_img)} bytes")
        
        # 동기 함수를 비동기 컨텍스트에서 실행
        logger.info("[Python API] OpenAI Vision API 호출 시작...")
        result = await asyncio.to_thread(service.analyze, optimized_img)
        
        if result.get("error"):
            logger.error(f"[Python API] OCR 처리 중 오류: {result.get('error')}")
        else:
            logger.info(f"[Python API] OCR 결과: merchant={result.get('extractedMerchant')}, "
                       f"amount={result.get('extractedAmount')}, date={result.get('extractedDate')}, "
                       f"category={result.get('extractedCategory')}")
        
        return result
    except Exception as e:
        logger.error(f"[Python API] OCR 처리 중 예외 발생: {str(e)}", exc_info=True)
        return {"error": f"이미지 처리 중 오류 발생: {str(e)}"}