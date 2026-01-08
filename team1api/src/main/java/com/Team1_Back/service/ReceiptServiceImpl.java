package com.Team1_Back.service;

import com.Team1_Back.domain.*;
import com.Team1_Back.dto.ReceiptDTO;
import com.Team1_Back.dto.ReceiptExtractionDTO;
import com.Team1_Back.repository.*;
import com.Team1_Back.util.CustomFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class ReceiptServiceImpl implements ReceiptService {

    private final ReceiptUploadRepository receiptUploadRepository;
    private final ReceiptAiExtractionRepository receiptAiExtractionRepository;
    private final ReceiptVerificationRepository receiptVerificationRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CustomFileUtil customFileUtil;
    private final ModelMapper modelMapper;

    @Override
    public ReceiptDTO upload(Long expenseId, Long userId, MultipartFile file) {
        Expense expense = expenseRepository.findByIdAndWriterId(expenseId, userId)
                .orElseThrow();

        if (!expense.isDraft()) {
            throw new IllegalStateException("DRAFT 상태의 지출 내역에만 영수증을 업로드할 수 있습니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow();

        // 파일 유효성 검증
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("파일이 비어 있습니다.");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new RuntimeException("이미지 파일만 업로드할 수 있습니다.");
        }
        if (file.getSize() > 10 * 1024 * 1024) { // 10MB
            throw new RuntimeException("파일 크기가 너무 큽니다. 10MB 이하만 업로드 가능합니다.");
        }

        // 파일 저장
        String fileUrl = customFileUtil.saveFile(file, "receipts");

        // 파일 해시 생성 (중복 확인용)
        String fileHash = customFileUtil.generateFileHash(file);

        // 중복 업로드 방지: 동일 해시가 이미 존재하면 예외
        if (fileHash != null && receiptUploadRepository.findByFileHash(fileHash).isPresent()) {
            throw new RuntimeException("이미 업로드된 영수증입니다. 같은 영수증을 중복 업로드할 수 없습니다.");
        }

        // 기존 영수증이 있으면 삭제
        receiptUploadRepository.findByExpenseId(expenseId).ifPresent(receiptUploadRepository::delete);

        // ReceiptUpload 저장
        ReceiptUpload receiptUpload = ReceiptUpload.builder()
                .expense(expense)
                .uploadedBy(user)
                .fileUrl(fileUrl)
                .fileHash(fileHash)
                .mimeType(file.getContentType())
                .build();

        ReceiptUpload saved = receiptUploadRepository.save(receiptUpload);

        // TODO: AI 추출 작업은 비동기로 실행 (별도 서비스에서 처리)
        // 여기서는 ReceiptUpload만 저장하고, AI 추출은 별도 프로세스에서 처리

        return entityToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReceiptDTO get(Long id, Long userId) {
        ReceiptUpload receiptUpload = receiptUploadRepository.findById(id)
                .orElseThrow();

        // 권한 확인: 본인의 지출 내역인지 확인
        if (!receiptUpload.getExpense().getWriter().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        return entityToDTO(receiptUpload);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getImage(Long id, Long userId) {
        ReceiptUpload receiptUpload = receiptUploadRepository.findById(id)
                .orElseThrow();

        // 권한 확인
        if (!receiptUpload.getExpense().getWriter().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        Path filePath = Paths.get(receiptUpload.getFileUrl());
        return customFileUtil.getFileAsResource(filePath);
    }

    @Override
    @Transactional(readOnly = true)
    public ReceiptExtractionDTO getExtraction(Long id, Long userId) {
        ReceiptUpload receiptUpload = receiptUploadRepository.findById(id)
                .orElseThrow();

        // 권한 확인
        if (!receiptUpload.getExpense().getWriter().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        ReceiptAiExtraction extraction = receiptAiExtractionRepository.findByReceiptId(id)
                .orElseThrow();

        return ReceiptExtractionDTO.builder()
                .receiptId(id)
                .modelName(extraction.getModelName())
                .extractedDate(extraction.getExtractedDate())
                .extractedAmount(extraction.getExtractedAmount())
                .extractedMerchant(extraction.getExtractedMerchant())
                .extractedCategory(extraction.getExtractedCategory())
                .confidence(extraction.getConfidence())
                .extractedJson(extraction.getExtractedJson())
                .createdAt(extraction.getCreatedAt())
                .build();
    }

    @Override
    public void remove(Long id, Long userId) {
        ReceiptUpload receiptUpload = receiptUploadRepository.findById(id)
                .orElseThrow();

        // 권한 확인
        if (!receiptUpload.getExpense().getWriter().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // DRAFT 상태인지 확인
        if (!receiptUpload.getExpense().isDraft()) {
            throw new IllegalStateException("DRAFT 상태의 지출 내역에만 영수증을 삭제할 수 있습니다.");
        }

        // 파일 삭제
        Path filePath = Paths.get(receiptUpload.getFileUrl());
        customFileUtil.deleteFile(filePath);

        // ReceiptUpload 삭제 (CASCADE로 ReceiptAiExtraction도 함께 삭제됨)
        receiptUploadRepository.delete(receiptUpload);
    }

    /**
     * ReceiptUpload 엔티티를 ReceiptDTO로 변환합니다 (하이브리드 방식).
     * 
     * <p>ModelMapper로 기본 필드를 매핑하고, 연관 엔티티와 Repository 조회가 필요한 부분은 수동으로 처리합니다.
     * 
     * @param entity 변환할 ReceiptUpload 엔티티
     * @return ReceiptDTO
     */
    private ReceiptDTO entityToDTO(ReceiptUpload entity) {
        // 1. ModelMapper로 기본 필드 매핑
        ReceiptDTO dto = modelMapper.map(entity, ReceiptDTO.class);
        
        // 2. 연관 엔티티 매핑 (수동 처리)
        if (entity.getExpense() != null) {
            dto.setExpenseId(entity.getExpense().getId());
            // Expense의 상태도 추가
            if (entity.getExpense().getStatus() != null) {
                dto.setStatus(entity.getExpense().getStatus().name());
            }
        }
        
        if (entity.getUploadedBy() != null) {
            dto.setUploadedBy(entity.getUploadedBy().getId());
            dto.setUploadedByName(entity.getUploadedBy().getName());
        }

        // 3. Repository 조회가 필요한 데이터 (수동 처리)
        // AI 추출 결과 추가
        Optional<ReceiptAiExtraction> extractionOpt = receiptAiExtractionRepository.findByReceiptId(entity.getId());
        if (extractionOpt.isPresent()) {
            ReceiptAiExtraction extraction = extractionOpt.get();
            dto.setExtractionId(extraction.getId());
            dto.setModelName(extraction.getModelName());
            dto.setExtractedJson(extraction.getExtractedJson());
            dto.setExtractedDate(extraction.getExtractedDate());
            dto.setExtractedAmount(extraction.getExtractedAmount());
            dto.setExtractedMerchant(extraction.getExtractedMerchant());
            dto.setExtractedCategory(extraction.getExtractedCategory());
            dto.setConfidence(extraction.getConfidence());
            dto.setExtractionCreatedAt(extraction.getCreatedAt());
        }

        // 검증 결과 추가
        if (entity.getExpense() != null) {
            Optional<ReceiptVerification> verificationOpt = receiptVerificationRepository.findByExpenseId(entity.getExpense().getId());
            if (verificationOpt.isPresent()) {
                ReceiptVerification verification = verificationOpt.get();
                dto.setVerificationId(verification.getId());
                if (verification.getVerifiedBy() != null) {
                    dto.setVerifiedBy(verification.getVerifiedBy().getId());
                    dto.setVerifiedByName(verification.getVerifiedBy().getName());
                }
                dto.setVerifiedMerchant(verification.getVerifiedMerchant());
                dto.setVerifiedAmount(verification.getVerifiedAmount());
                dto.setVerifiedCategory(verification.getVerifiedCategory());
                dto.setReason(verification.getReason());
                dto.setVerificationCreatedAt(verification.getCreatedAt());
            }
        }

        return dto;
    }
}

