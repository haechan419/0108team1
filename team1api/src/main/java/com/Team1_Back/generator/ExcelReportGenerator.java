package com.Team1_Back.generator;

import com.Team1_Back.domain.enums.DataScope;
import com.Team1_Back.report.entity.ReportJob;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.FileOutputStream;
import java.nio.file.Path;

@Component
public class ExcelReportGenerator {

    private String displayScope(DataScope scope) {
        if (scope == null) return "";
        return switch (scope) {
            case MY -> "My Data";
            case DEPT -> "Department";
            case ALL -> "All";
        };
    }

    public void generate(Path outputFile, ReportJob job) throws Exception {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Report");

            // 헤더 스타일(선택, 최소한만)
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row r0 = sheet.createRow(0);
            Cell h0 = r0.createCell(0);
            h0.setCellValue("Key");
            h0.setCellStyle(headerStyle);

            Cell h1 = r0.createCell(1);
            h1.setCellValue("Value");
            h1.setCellStyle(headerStyle);

            int row = 1;
            row = kv(sheet, row, "Report Type", job.getReportTypeId());
            row = kv(sheet, row, "Period", job.getPeriod());
            row = kv(sheet, row, "Scope", displayScope(job.getDataScope()));
            row = kv(sheet, row, "Category", job.getCategoryJson());
            row = kv(sheet, row, "Requested By", String.valueOf(job.getRequestedBy()));
            row = kv(sheet, row, "Dept (snapshot)", job.getDepartmentSnapshot());

            // ✅ A안: ReportService에서 계산해 주입한 값 사용
            long records = (job.getApprovedCount() == null) ? 0L : job.getApprovedCount().longValue();
            long total = (job.getApprovedTotal() == null) ? 0L : job.getApprovedTotal();

            row = kv(sheet, row, "Records Included", String.valueOf(job.getApprovedCount() == null ? 0 : job.getApprovedCount()));
            row = kv(sheet, row, "Total Amount (KRW)", String.valueOf(job.getApprovedTotal() == null ? 0 : job.getApprovedTotal()));


            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);

            try (FileOutputStream fos = new FileOutputStream(outputFile.toFile())) {
                wb.write(fos);
            }
        }
    }

    private int kv(Sheet sheet, int rowIdx, String key, String value) {
        Row r = sheet.createRow(rowIdx);
        r.createCell(0).setCellValue(key);
        r.createCell(1).setCellValue((value == null || value.isBlank()) ? "-" : value);
        return rowIdx + 1;
    }

    private String formatNumber(long n) {
        return String.format("%,d", n);
    }
}
