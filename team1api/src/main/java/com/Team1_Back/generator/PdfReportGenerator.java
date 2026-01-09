package com.Team1_Back.generator;

import com.Team1_Back.report.entity.ReportJob;   // ✅ 여기로 변경
import com.Team1_Back.domain.enums.DataScope;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.FileOutputStream;
import java.nio.file.Path;

@Component
public class PdfReportGenerator {

    private String displayScope(DataScope scope) {
        if (scope == null) return "";
        return switch (scope) {
            case MY -> "My Data";
            case DEPT -> "Department";
            case ALL -> "All";
        };
    }


    public void generate(Path outputFile, ReportJob job) throws Exception { // ✅ 파라미터 타입 변경
        Document doc = new Document(PageSize.A4, 48, 48, 56, 56);
        PdfWriter.getInstance(doc, new FileOutputStream(outputFile.toFile()));
        doc.open();

        Paragraph title = new Paragraph("Report Summary", new Font(Font.HELVETICA, 16, Font.BOLD));
        doc.add(title);
        doc.add(new Paragraph("Confidential", new Font(Font.HELVETICA, 10, Font.ITALIC)));
        doc.add(new Paragraph(" "));

        doc.add(kv("Report Type", job.getReportTypeId()));
        doc.add(kv("Period", job.getPeriod()));
        doc.add(kv("Scope", displayScope(job.getDataScope())));
        doc.add(kv("Category", job.getCategoryJson()));
        doc.add(kv("Requested By", String.valueOf(job.getRequestedBy())));
        doc.add(kv("Dept (snapshot)", job.getDepartmentSnapshot()));
        doc.add(new Paragraph(" "));

        doc.add(new Paragraph("• Records Included : 42"));
        doc.add(new Paragraph("• Total Amount     : ₩1,240,000"));

        doc.close();
    }

    private Paragraph kv(String k, String v) {
        String val = (v == null || v.isBlank()) ? "-" : v;
        return new Paragraph(k + " : " + val, new Font(Font.HELVETICA, 11));
    }
}
