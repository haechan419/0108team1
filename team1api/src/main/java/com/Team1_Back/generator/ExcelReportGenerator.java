package com.Team1_Back.generator;

import com.Team1_Back.report.entity.ReportJob;
import com.Team1_Back.domain.enums.DataScope;
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

            Row r0 = sheet.createRow(0);
            r0.createCell(0).setCellValue("Key");
            r0.createCell(1).setCellValue("Value");

            int row = 1;
            row = kv(sheet, row, "Report Type", job.getReportTypeId());
            row = kv(sheet, row, "Period", job.getPeriod());
            row = kv(sheet, row, "Scope", displayScope(job.getDataScope()));
            row = kv(sheet, row, "Category", job.getCategoryJson());
            row = kv(sheet, row, "Requested By", String.valueOf(job.getRequestedBy()));
            row = kv(sheet, row, "Dept (snapshot)", job.getDepartmentSnapshot());

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
        r.createCell(1).setCellValue(value == null ? "-" : value);
        return rowIdx + 1;
    }
}
