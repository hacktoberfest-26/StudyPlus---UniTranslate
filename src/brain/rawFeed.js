/**
 * Unstructured feed the Librarian ingests (simulates text extracted from syllabus PDFs
 * and departmental spreadsheets). Formats are deliberately inconsistent.
 */
export const RAW_SYLLABUS_FEED = [
  {
    source: 'syllabus_CYB-205.pdf',
    text: 'CYB-205 | Cybersecurity Fundamentals | 6 cfu | Prof. G. Russo | wed 16:00-18:00 | H-Farm | hybrid | attendance 70% | prereq: Programming 101 | room Lab C303',
  },
  {
    source: 'dept_export_2026.xlsx',
    text: 'NLP-330 | Natural Language Processing | 9 CFU | Prof. L. Marino | Thursday 08:00-10:00 | ca foscari | In Person | attendance: 75 % | prereq: Statistics, Programming 101 | room Room B301',
  },
  {
    source: 'syllabus_ETH-120_scan.pdf',
    text: 'ETH-120 | AI Ethics & Governance | six cfu | Prof. ? | TBA | H-FARM | hybrid',
  },
];
