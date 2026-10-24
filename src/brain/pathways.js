/**
 * Brain — career pathways for newcomers (students who have finished high school and
 * have not chosen a programme yet). Each career lists every route the university offers
 * to reach it, so a newcomer can start from the goal and work backwards.
 */

export const INTERESTS = [
  { id: 'data', label: 'Numbers & data' },
  { id: 'tech', label: 'Building technology' },
  { id: 'people', label: 'Working with people' },
  { id: 'design', label: 'Design & creativity' },
  { id: 'business', label: 'Business & markets' },
  { id: 'society', label: 'Society & sustainability' },
];

export const PROGRAMMES = {
  'dm-ai': {
    name: 'BSc Digital Management',
    track: 'AI/Data track',
    years: 3,
    campus: 'H-FARM Campus',
    language: 'English',
    entry: ['High-school diploma', 'English B2', 'Admission test: logic & maths'],
    intake: 'September · applications close 30 April',
  },
  'dm-fintech': {
    name: 'BSc Digital Management',
    track: 'FinTech & Product track',
    years: 3,
    campus: 'H-FARM Campus',
    language: 'English',
    entry: ['High-school diploma', 'English B2', 'Admission test: logic & maths'],
    intake: 'September · applications close 30 April',
  },
  'econ-fin': {
    name: 'BSc Economics & Finance',
    track: 'Quantitative track',
    years: 3,
    campus: "Ca' Foscari Main Campus",
    language: 'English or Italian',
    entry: ['High-school diploma', 'Strong maths results recommended', 'TOLC-E admission test'],
    intake: 'September · applications close 15 May',
  },
  cs: {
    name: 'BSc Computer Science',
    track: 'Software & AI',
    years: 3,
    campus: "Ca' Foscari Scientific Campus",
    language: 'Italian (some courses in English)',
    entry: ['High-school diploma', 'TOLC-I admission test'],
    intake: 'September · applications close 31 July',
  },
  design: {
    name: 'BSc Design & Digital Experience',
    track: 'Interaction design',
    years: 3,
    campus: 'H-FARM Campus',
    language: 'English',
    entry: ['High-school diploma', 'English B2', 'Portfolio or creative task'],
    intake: 'September · applications close 30 April',
  },
  business: {
    name: 'BSc Business Administration',
    track: 'Marketing & Management',
    years: 3,
    campus: "Ca' Foscari Main Campus",
    language: 'English or Italian',
    entry: ['High-school diploma', 'TOLC-E admission test'],
    intake: 'September · applications close 15 May',
  },
  env: {
    name: 'BSc Environmental Sciences',
    track: 'Sustainability & data',
    years: 3,
    campus: "Ca' Foscari Scientific Campus",
    language: 'Italian',
    entry: ['High-school diploma', 'TOLC-S admission test'],
    intake: 'September · applications close 31 July',
  },
};

/**
 * route.kind: 'direct' (bachelor leads straight there), 'master' (bachelor + master),
 * 'switch' (a related bachelor plus electives/minor that open the door).
 */
export const NEWCOMER_CAREERS = [
  {
    id: 'ai-data-analyst',
    label: 'AI Data Analyst',
    emoji: '📊',
    interests: ['data', 'tech', 'business'],
    demand: 'High demand',
    salary: '€45–65k',
    summary: 'Turns company data into decisions, using statistics, dashboards and machine-learning models.',
    dayToDay: ['Clean and explore data sets', 'Build dashboards for managers', 'Train and test prediction models', 'Explain results to non-technical teams'],
    skills: ['Statistics', 'Python', 'Machine learning', 'Data visualisation'],
    routes: [
      {
        programme: 'dm-ai',
        kind: 'direct',
        fit: 'Most direct',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Foundations', courses: ['Programming 101', 'Statistics', 'Calculus', 'Marketing Basics'] },
          { label: 'Year 2', focus: 'Core data skills', courses: ['Linear Algebra', 'Advanced Data Science', 'Data Mining'] },
          { label: 'Year 3', focus: 'Specialise', courses: ['Machine Learning', 'Deep Learning & LLMs', 'Internship'] },
        ],
        note: 'The AI/Data track was built for this job: you take every key course by year 3.',
      },
      {
        programme: 'cs',
        kind: 'direct',
        fit: 'Strong technical route',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Programming & maths', courses: ['Programming', 'Discrete Maths', 'Calculus'] },
          { label: 'Year 2', focus: 'Systems & data', courses: ['Databases', 'Algorithms', 'Probability & Statistics'] },
          { label: 'Year 3', focus: 'AI electives', courses: ['Machine Learning', 'Data Visualisation', 'Thesis'] },
        ],
        note: 'More coding and less business. Add a statistics elective to round it off.',
      },
      {
        programme: 'econ-fin',
        kind: 'master',
        fit: 'Via a master’s',
        duration: '3 + 2 years',
        steps: [
          { label: 'Bachelor', focus: 'Economics & statistics', courses: ['Econometrics', 'Statistics', 'Programming for Economists'] },
          { label: 'Master', focus: 'MSc Data Analytics', courses: ['Machine Learning', 'Big Data Infrastructure', 'Data Mining'] },
        ],
        note: 'Longer, but leads to analyst roles in banks and consulting.',
      },
    ],
  },
  {
    id: 'fintech-pm',
    label: 'FinTech Product Manager',
    emoji: '💳',
    interests: ['business', 'tech', 'people'],
    demand: 'High demand',
    salary: '€50–75k',
    summary: 'Decides what a digital finance product should do next, working between engineers, designers and the business.',
    dayToDay: ['Talk to users about their problems', 'Write product requirements', 'Prioritise features with engineers', 'Track product metrics'],
    skills: ['Product strategy', 'UX basics', 'Finance & payments', 'Data analysis'],
    routes: [
      {
        programme: 'dm-fintech',
        kind: 'direct',
        fit: 'Most direct',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Business & tech basics', courses: ['Marketing Basics', 'Programming 101', 'Statistics'] },
          { label: 'Year 2', focus: 'Digital products', courses: ['Digital Business Strategy', 'UX Design Principles', 'Digital Marketing Analytics'] },
          { label: 'Year 3', focus: 'FinTech', courses: ['FinTech & Digital Payments', 'Product Management Lab', 'Internship'] },
        ],
        note: 'Combines the business, design and finance pieces product managers need.',
      },
      {
        programme: 'business',
        kind: 'switch',
        fit: 'Flexible route',
        duration: '3 years',
        steps: [
          { label: 'Year 1–2', focus: 'Management core', courses: ['Accounting', 'Marketing', 'Organisation'] },
          { label: 'Year 3', focus: 'Digital minor', courses: ['Digital Business Strategy', 'FinTech & Digital Payments', 'Product internship'] },
        ],
        note: 'A broad business degree. Choose the digital minor in year 3 to aim at FinTech.',
      },
      {
        programme: 'econ-fin',
        kind: 'master',
        fit: 'Via a master’s',
        duration: '3 + 2 years',
        steps: [
          { label: 'Bachelor', focus: 'Finance', courses: ['Corporate Finance', 'Financial Markets', 'Statistics'] },
          { label: 'Master', focus: 'MSc Innovation & Product Management', courses: ['Product Management Lab', 'UX Research', 'Venture Building'] },
        ],
        note: 'Strong finance knowledge first, product skills in the master’s.',
      },
    ],
  },
  {
    id: 'quant-risk',
    label: 'Quantitative Risk Specialist',
    emoji: '📈',
    interests: ['data', 'business'],
    demand: 'Medium demand',
    salary: '€55–80k',
    summary: 'Measures and models financial risk for banks, insurers and investment firms.',
    dayToDay: ['Build risk models', 'Stress-test portfolios', 'Report to regulators', 'Check model assumptions'],
    skills: ['Statistics', 'Linear algebra', 'Programming', 'Financial markets'],
    routes: [
      {
        programme: 'econ-fin',
        kind: 'direct',
        fit: 'Most direct',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Maths & economics', courses: ['Calculus', 'Linear Algebra', 'Microeconomics'] },
          { label: 'Year 2', focus: 'Statistics & markets', courses: ['Statistics', 'Financial Markets', 'Econometrics'] },
          { label: 'Year 3', focus: 'Risk', courses: ['Quantitative Risk Modelling', 'Derivatives', 'Thesis'] },
        ],
        note: 'The quantitative track covers every topic risk teams test in interviews.',
      },
      {
        programme: 'dm-ai',
        kind: 'switch',
        fit: 'Data-first route',
        duration: '3 years',
        steps: [
          { label: 'Year 1–2', focus: 'Data foundations', courses: ['Statistics', 'Linear Algebra', 'Advanced Data Science'] },
          { label: 'Year 3', focus: 'Finance electives', courses: ['Machine Learning', 'Quantitative Risk Modelling', 'FinTech & Digital Payments'] },
        ],
        note: 'Strong on modelling. Pick the finance electives to learn the markets side.',
      },
    ],
  },
  {
    id: 'ux-designer',
    label: 'UX / Product Designer',
    emoji: '🎨',
    interests: ['design', 'people', 'tech'],
    demand: 'High demand',
    salary: '€35–55k',
    summary: 'Designs how apps and websites work and feel, based on research with real users.',
    dayToDay: ['Interview and observe users', 'Sketch and prototype screens', 'Run usability tests', 'Work with developers on details'],
    skills: ['User research', 'Prototyping', 'Visual design', 'Accessibility'],
    routes: [
      {
        programme: 'design',
        kind: 'direct',
        fit: 'Most direct',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Design basics', courses: ['Visual Communication', 'Drawing & Sketching', 'Design History'] },
          { label: 'Year 2', focus: 'Interaction', courses: ['UX Design Principles', 'Prototyping', 'User Research'] },
          { label: 'Year 3', focus: 'Portfolio', courses: ['Design Systems', 'Accessibility', 'Studio project'] },
        ],
        note: 'You graduate with a portfolio, which is what design employers ask for first.',
      },
      {
        programme: 'dm-fintech',
        kind: 'switch',
        fit: 'Business-aware route',
        duration: '3 years',
        steps: [
          { label: 'Year 1–2', focus: 'Digital business', courses: ['Marketing Basics', 'UX Design Principles', 'Digital Business Strategy'] },
          { label: 'Year 3', focus: 'Design electives', courses: ['Product Management Lab', 'Prototyping', 'Portfolio project'] },
        ],
        note: 'Less studio time, more product thinking. Build your portfolio with the electives.',
      },
    ],
  },
  {
    id: 'software-engineer',
    label: 'Software Engineer',
    emoji: '💻',
    interests: ['tech', 'data'],
    demand: 'High demand',
    salary: '€38–60k',
    summary: 'Builds and maintains the software behind apps, websites and services.',
    dayToDay: ['Write and review code', 'Fix bugs', 'Design how systems fit together', 'Work in small product teams'],
    skills: ['Programming', 'Algorithms', 'Databases', 'Teamwork'],
    routes: [
      {
        programme: 'cs',
        kind: 'direct',
        fit: 'Most direct',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Programming', courses: ['Programming', 'Computer Architecture', 'Discrete Maths'] },
          { label: 'Year 2', focus: 'Core CS', courses: ['Algorithms', 'Databases', 'Operating Systems'] },
          { label: 'Year 3', focus: 'Projects', courses: ['Software Engineering', 'Web Development', 'Thesis'] },
        ],
        note: 'The classic route, with the deepest technical grounding.',
      },
      {
        programme: 'dm-ai',
        kind: 'switch',
        fit: 'Product-minded route',
        duration: '3 years',
        steps: [
          { label: 'Year 1–2', focus: 'Programming & data', courses: ['Programming 101', 'Advanced Data Science', 'Blockchain Technology'] },
          { label: 'Year 3', focus: 'Build things', courses: ['Machine Learning', 'Cybersecurity Fundamentals', 'Internship'] },
        ],
        note: 'Fewer pure CS courses. Strong if you want to build data or AI products.',
      },
    ],
  },
  {
    id: 'marketing-manager',
    label: 'Digital Marketing Manager',
    emoji: '📣',
    interests: ['business', 'people', 'design'],
    demand: 'Medium demand',
    salary: '€32–50k',
    summary: 'Plans and measures online campaigns that bring customers to a brand.',
    dayToDay: ['Plan campaigns across channels', 'Read analytics reports', 'Run A/B tests', 'Brief designers and agencies'],
    skills: ['Marketing', 'Analytics', 'Copywriting', 'Budgeting'],
    routes: [
      {
        programme: 'business',
        kind: 'direct',
        fit: 'Most direct',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Business basics', courses: ['Marketing', 'Accounting', 'Statistics'] },
          { label: 'Year 2', focus: 'Marketing', courses: ['Consumer Behaviour', 'Digital Marketing Analytics', 'Branding'] },
          { label: 'Year 3', focus: 'Practice', courses: ['Marketing Strategy', 'Internship', 'Thesis'] },
        ],
        note: 'The broadest marketing grounding, with an internship in year 3.',
      },
      {
        programme: 'dm-fintech',
        kind: 'switch',
        fit: 'Tech-savvy route',
        duration: '3 years',
        steps: [
          { label: 'Year 1–2', focus: 'Digital business', courses: ['Marketing Basics', 'Digital Marketing Analytics', 'UX Design Principles'] },
          { label: 'Year 3', focus: 'Growth', courses: ['Digital Business Strategy', 'Product Management Lab', 'Internship'] },
        ],
        note: 'More data and product skills, which digital marketing teams value.',
      },
    ],
  },
  {
    id: 'sustainability-analyst',
    label: 'Sustainability Data Analyst',
    emoji: '🌱',
    interests: ['society', 'data'],
    demand: 'Growing demand',
    salary: '€33–50k',
    summary: 'Measures environmental and social impact so companies and cities can reduce it.',
    dayToDay: ['Collect emissions and impact data', 'Build sustainability reports', 'Model scenarios', 'Advise on reduction plans'],
    skills: ['Environmental science', 'Statistics', 'Reporting standards', 'Data visualisation'],
    routes: [
      {
        programme: 'env',
        kind: 'direct',
        fit: 'Most direct',
        duration: '3 years',
        steps: [
          { label: 'Year 1', focus: 'Science basics', courses: ['Chemistry', 'Ecology', 'Calculus'] },
          { label: 'Year 2', focus: 'Methods', courses: ['Statistics', 'GIS & Mapping', 'Climate Science'] },
          { label: 'Year 3', focus: 'Impact', courses: ['Environmental Data Analysis', 'Life-cycle Assessment', 'Thesis'] },
        ],
        note: 'Deep subject knowledge. Add a data-visualisation elective.',
      },
      {
        programme: 'dm-ai',
        kind: 'master',
        fit: 'Via a master’s',
        duration: '3 + 2 years',
        steps: [
          { label: 'Bachelor', focus: 'Data skills', courses: ['Statistics', 'Advanced Data Science', 'Data Mining'] },
          { label: 'Master', focus: 'MSc Sustainability Management', courses: ['ESG Reporting', 'Climate Economics', 'Impact Measurement'] },
        ],
        note: 'Data first, sustainability in the master’s. Popular with consulting firms.',
      },
    ],
  },
];

export const ROUTE_KIND = {
  direct: { label: 'Direct', className: 'bg-green-100 text-green-800' },
  switch: { label: 'Flexible', className: 'bg-sky-100 text-sky-800' },
  master: { label: 'Bachelor + master', className: 'bg-purple-100 text-purple-800' },
};
