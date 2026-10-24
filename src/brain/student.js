/**
 * H-OS Brain — Student Record & Degree Requirements.
 */
export const DEGREE_REQUIREMENTS = {
  totalCfu: 180,
  years: 3,
  buckets: [
    { id: 'core', label: 'Mandatory Core', required: 108, bar: 'bg-blue-500', text: 'text-blue-700' },
    { id: 'electives', label: 'Electives', required: 60, bar: 'bg-indigo-500', text: 'text-indigo-700' },
    { id: 'thesis', label: 'Thesis', required: 12, bar: 'bg-amber-500', text: 'text-amber-700' },
  ],
};

export const STUDENT = {
  id: 'stu-alex',
  name: 'Alex',
  programme: 'BSc Digital Management',
  track: 'AI/Data',
  term: 'Year 3 · Fall Semester',
  completedCfu: { core: 72, electives: 42, thesis: 0 },
  // Skill ids from the skill graph already passed in previous years.
  completedSkills: ['prog101', 'stats', 'marketing', 'calc'],
  careerGoals: ['ai-data-analyst', 'fintech-pm'],
  // Credits Alex should carry this semester to graduate on time; above max triggers an overload alert.
  semesterTargetCfu: 30,
  semesterMaxCfu: 36,
};

/** Draft plan Alex starts the demo with — ADS-301 deliberately overlaps the compulsory DBS-210. */
export const INITIAL_PLAN = [
  { code: 'DBS-210', status: 'confirmed' },
  { code: 'UXD-150', status: 'confirmed' },
  { code: 'ADS-301', status: 'draft' },
  { code: 'BCT-240', status: 'draft' },
];

export const ROLES = {
  student: { label: '🎓 Student (Alex - AI/Data Track)', short: 'Student' },
  advisor: { label: '👨‍🏫 Academic Advisor (Prof. Rossi)', short: 'Advisor' },
  admin: { label: '🏛️ Department Admin', short: 'Admin' },
};

/** Other advisees of Prof. Rossi — static sample records to populate the advisor dashboard. */
export const SAMPLE_ADVISEES = [
  { id: 'stu-giulia', name: 'Giulia Bianco', track: 'Digital Marketing', completed: 126, planned: 30, status: 'approved', critical: 0, warnings: 0 },
  { id: 'stu-marco', name: 'Marco Testa', track: 'AI/Data', completed: 98, planned: 33, status: 'submitted', critical: 1, warnings: 1 },
  { id: 'stu-sara', name: 'Sara Lombardi', track: 'FinTech', completed: 140, planned: 24, status: 'draft', critical: 0, warnings: 1 },
];
