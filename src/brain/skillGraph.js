/**
 * H-OS Brain — Skill Graph & Career Pathways.
 *
 * Nodes are skills (a skill is earned by passing the course with `code`).
 * `requires` lists prerequisite skill ids, so the graph is a DAG flowing tier 1 → 4.
 */
export const SKILL_NODES = [
  // Tier 1 — Foundations
  { id: 'prog101', label: 'Programming 101', tier: 1, cfu: 6, requires: [] },
  { id: 'stats', label: 'Statistics', tier: 1, cfu: 6, requires: [] },
  { id: 'calc', label: 'Calculus', tier: 1, cfu: 6, requires: [] },
  { id: 'linalg', label: 'Linear Algebra', tier: 1, cfu: 6, requires: ['calc'], code: 'MAT-110' },
  { id: 'marketing', label: 'Marketing Basics', tier: 1, cfu: 6, requires: [] },

  // Tier 2 — This semester's catalogue
  { id: 'ads', label: 'Advanced Data Science', tier: 2, cfu: 9, requires: ['stats', 'prog101'], code: 'ADS-301' },
  { id: 'ml', label: 'Machine Learning', tier: 2, cfu: 9, requires: ['linalg', 'calc'], code: 'ML-320' },
  { id: 'dmining', label: 'Data Mining', tier: 2, cfu: 6, requires: ['stats', 'prog101'], code: 'DMN-310' },
  { id: 'dbs', label: 'Digital Business Strategy', tier: 2, cfu: 6, requires: ['marketing'], code: 'DBS-210' },
  { id: 'dma', label: 'Digital Marketing Analytics', tier: 2, cfu: 6, requires: ['marketing'], code: 'DMA-230' },
  { id: 'fintech', label: 'FinTech & Digital Payments', tier: 2, cfu: 6, requires: ['marketing'], code: 'FIN-260' },
  { id: 'ux', label: 'UX Design Principles', tier: 2, cfu: 6, requires: [], code: 'UXD-150' },

  // Tier 3 — Unlocked advanced subjects (future semesters)
  { id: 'dl', label: 'Deep Learning & LLMs', tier: 3, cfu: 9, requires: ['ml'] },
  { id: 'bigdata', label: 'Big Data Infrastructure', tier: 3, cfu: 9, requires: ['ads', 'prog101'] },
  { id: 'quant', label: 'Quantitative Risk Modelling', tier: 3, cfu: 6, requires: ['stats', 'linalg'] },
  { id: 'pmlab', label: 'Product Management Lab', tier: 3, cfu: 6, requires: ['ux', 'dbs'] },
];

export const CAREERS = [
  {
    id: 'ai-data-analyst',
    label: 'AI Data Analyst',
    demand: 'High Demand',
    salary: '€45–65k',
    requires: ['ads', 'ml', 'dmining', 'dl'],
    keywords: ['ai data analyst', 'data analyst', 'analyst', 'ai'],
  },
  {
    id: 'quant-risk',
    label: 'Quantitative Risk Specialist',
    demand: 'Medium Demand',
    salary: '€55–80k',
    requires: ['quant', 'ml', 'stats'],
    keywords: ['quant', 'risk', 'quantitative'],
  },
  {
    id: 'fintech-pm',
    label: 'FinTech Product Manager',
    demand: 'High Demand',
    salary: '€50–75k',
    requires: ['fintech', 'pmlab', 'dma', 'dbs'],
    keywords: ['fintech', 'product manager', 'pm'],
  },
];

export const SKILL_BY_ID = Object.fromEntries(SKILL_NODES.map((n) => [n.id, n]));
