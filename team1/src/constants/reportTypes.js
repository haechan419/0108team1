export const REPORT_TYPES = [
    // ===== EMPLOYEE =====
    {
        id: "PERSONAL_DETAIL_EXCEL",
        label: "Personal Detailed Records (Excel)",
        outputFormat: "EXCEL",
        roles: ["EMPLOYEE"],
    },
    {
        id: "PERSONAL_SUMMARY_PDF",
        label: "Personal Summary Report (PDF)",
        outputFormat: "PDF",
        roles: ["EMPLOYEE"],
    },

    // ===== ADMIN =====
    {
        id: "DEPT_DETAIL_EXCEL",
        label: "Department Detailed Records (Excel)",
        outputFormat: "EXCEL",
        roles: ["ADMIN"],
    },
    {
        id: "DEPT_SUMMARY_PDF",
        label: "Department Summary Report (PDF)",
        outputFormat: "PDF",
        roles: ["ADMIN"],
    },
    {
        id: "AI_STRATEGY_PDF",
        label: "AI Strategy Insight Report (PDF)",
        outputFormat: "PDF",
        roles: ["ADMIN"],
    },
];
