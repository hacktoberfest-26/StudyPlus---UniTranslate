# UniTranslate

Course planning for future students, current students, academic advisors and department staff.
It replaces confusing course-planning portals with clear starting points: *explore a course*,
*start from a goal*, *plan my week*, *ask the tutor*. Behind them, the calendar, degree progress,
prerequisite checks and tutor all react instantly to every change.

Built with **React 19 + Vite**, **Tailwind CSS v4**, **Zustand** and **lucide-react**.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Librarian, agent and tutor logic (Vitest)
npm run build    # production bundle in dist/
```

## Architecture

| Layer | Folder | Responsibility |
| --- | --- | --- |
| **The Brain** (knowledge store) | `src/brain/` | Course syllabi & timetables, CFU buckets (180 total), student record (114 CFU), skill graph, career pathways, raw syllabus feed |
| **The Librarian** | `src/librarian/` | Normalises course records into the Brain schema, parses unstructured syllabus text, flags or quarantines bad data, detects timetable overlaps |
| **Proactive Agents** | `src/agents/proactiveAgent.js` | "Management by exception": re-runs on every draft change and emits critical (overlap), warning (prerequisite, missing compulsory, credit shortage/overload) and success (smart alternative) alerts |
| **Tutor** | `src/agents/tutorEngine.js` | Planner / concept tutor over live Brain + plan state, using deterministic rules (an open-weight model is a future step, see below) |
| **State** | `src/store/` | Zustand store (persisted "auto-save") + memoised derived hooks shared by every view |

## For judges: H-OS mapping, what is real, and what is next

**Try it:** demo accounts are pre-filled on the sign-in page. Pick a role and tap *Sign in*.

### The three H-OS layers in this codebase

| H-OS layer | Where | How it works |
| --- | --- | --- |
| **Brain** | `src/brain/*.js` | One structured store with 10 courses (CFU, sessions, rooms, prerequisites, syllabus), the degree rules (180 CFU: 108 core / 60 electives / 12 thesis), the student record (114 CFU, passed skills, career goals), a 16-node skill graph and 7 career pathways across 7 programmes. |
| **Librarian** | `src/librarian/` | `ingest.js` parses messy syllabus text. `normalize.js` turns it into the Brain schema: it fixes "six cfu" → 6 and "wed"/"Thursday" → day codes, maps campus and format aliases, and validates every record. Records that can't be trusted (e.g. no timetable slot) are **quarantined with a reason** instead of being published. `schedule.js` detects slot clashes. |
| **Proactive agents** | `src/agents/` | **EVENT**: any change to the plan or the catalogue. **CONTEXT**: the catalogue, the student record and the draft plan. **REASONING**: clash detection, prerequisite status, credit totals, and ranking of replacement courses by bucket, career fit and reviews. **ACTION**: a non-dismissable alert with a one-click *Smart Recommendation* swap. An impact agent (`impact.js`) predicts the consequences before a change is applied. Critical alerts **block** submission and advisor approval in the store, not just in the UI. |

### What is real vs. mocked in the prototype

| Real (working code, unit-tested) | Mocked or planned |
| --- | --- |
| Clash detection, prerequisite checks, credit buckets, smart-swap ranking, impact preview | Course and student data are **illustrative samples**, not official university data |
| Librarian normalisation, validation, quarantine and duplicate detection on 3 messy records | PDF reading: the feed is pre-extracted text |
| Four role workspaces with permissions enforced in the store (19 unit tests) | Sign-in is local: no real accounts or server |
| Ghost calendar, skill tree and career routes generated from the Brain | Tutor answers come from deterministic rules, not a language model |
| Everything runs in the browser and nothing leaves the device | Notifications, calendar sync, language and data export are labelled placeholders |
| WCAG 2 A/AA clean (axe-core) in light, dark, colour-blind and high-contrast modes | Application and live chat flows stop at a "prototype" message |

### Future step: Gemma 4 (not part of the prototype)

The prototype contains no language model. The code is built so one can be added later at two points, without changing the rest of the app:

1. **Librarian → `ingestFeed()`**: an open-weight model such as Gemma 4 reads syllabus PDFs and pages (text and images) and returns the raw course object. `normalizeCourse()` stays as the **schema guard**, so a wrong or incomplete answer is quarantined, never published.
2. **Tutor → `tutorRespond(message, ctx)`**: the model answers in plain language. It uses the same deterministic planning functions (`rankCandidates`, `findFillers`, `prerequisiteStatus`) and returns the same `{ text, cards, bulkAdd }` shape. Clash and prerequisite alerts stay deterministic.
3. **Privacy**: a small edge model running on the student's device would keep records and career goals local.

### Getting data when universities don't cooperate

UniTranslate works **alongside** official systems. It never replaces them: enrolment still happens on the university portal, and UniTranslate links back to it.

1. **Public data first**: catalogues, syllabi and timetables are usually published as web pages and PDFs. The Librarian ingests them and keeps the source URL and retrieval date on every record. Records that fail validation are quarantined.
2. **Student-held data, on-device**: students import their own timetable export (ICS), study-plan PDF or transcript. It is read locally and never uploaded.
3. **Community corrections**: "Report a bug" already sends corrections with a reference number to a moderation inbox. Agreeing reports from several students raise confidence in a record.
4. **Bottom-up partners**: student associations, individual departments and advisors. The advisor workspace works without central IT.
5. **Open schema**: once the course schema is public, a university can publish its own feed and replace the scraping. The schema is designed to align with existing exchange efforts such as Erasmus Without Paper.

## Limitations and how we plan to address them

### Known limitations

| Limitation | What it means | Planned answer |
| --- | --- | --- |
| **Dependence on university data** | Recommendations are only as good as the catalogue, timetable and rules behind them. Wrong or late data gives wrong advice. | Collaboration with universities for official feeds. Until then, public sources and quarantine of untrustworthy records (see above). |
| **No official decision-making** | UniTranslate advises. It cannot enrol a student or grant an exception; only the university and the advisor can. | Collaboration with universities so that advisor approval in UniTranslate is recognised by the official process. Until then, every action links back to the official portal. |
| **Limited initial coverage** | The first version covers one pilot (one campus, a few programmes), not every university. | Grow programme by programme with the open schema, starting where students and departments are willing. |
| **Open source still needs resources** | Code is free, but hosting, data upkeep and moderation take people and time. | Student volunteers (contributions recognised as internships or extra-curricular credit), with clear documentation and tests so newcomers can help safely. |
| **The benefit is not yet validated** | We believe it reduces clashes and late changes, but we have not measured it with real students. | A pilot semester comparing clash rate, plan changes after the deadline, and advisor time per plan, with and without the tool. |
| **The smart function can weaken the student's chosen pathway** | A "Smart Recommendation" optimises for no clash and good fit. It can quietly swap a course the student wanted for their own reasons. | The swap already asks for confirmation and lists what is lost, including career skills. Future work: explain *why* each suggestion is made, offer several alternatives instead of one, and let the student mark a course as "keep: my choice" so agents never suggest dropping it. |

### Other risks we identified

| Risk | Suggested future solution (within the Brain / Librarian / Agents design) |
| --- | --- |
| **Stale data**: a timetable changes after students have planned | Librarian re-checks sources on a schedule and shows a "last verified" date on each course. When a source changes, agents raise an alert for every affected student. |
| **Extraction errors** from automatic reading of PDFs | Every record passes the schema guard. Low-confidence or invalid records are quarantined for human review in the admin inbox, never shown to students. |
| **Privacy of student records** | Process personal data on the device, store only what is needed, and ask for explicit consent before any sharing with an advisor. |
| **Over-trust in automatic advice** | Agents explain their reasoning, never act without confirmation, and point to the advisor for decisions that matter. |
| **Complex or exceptional rules** (transfers, Erasmus credits, part-time students) | Rules are stored as data in the Brain rather than in code, and advisors can record approved exceptions so agents respect them. |
| **Bias in recommendations** (towards popular courses or high-salary careers) | Show the ranking factors openly, keep the logic open source so it can be audited, and let students choose what matters to them. |
| **Unreliable career data** (salaries, demand) | Use dated, cited labour-market sources and label figures as estimates. Prototype figures are illustrative. |
| **Language and access barriers** | Accessibility is already WCAG 2 A/AA tested. Next: Italian and other languages, and lightweight pages for older devices. |
| **No real authentication** | Connect to the university's single sign-on, so no new passwords are created and roles come from official records. |
| **Legal limits on collecting data** | Only public pages, respecting robots.txt and site terms, with attribution and source links. Never log in on a student's behalf or enrol automatically. |
| **Project continuity** when volunteers change | Modular layers, unit tests and accessibility checks in the repository, plus contribution guides, so new volunteers can take over safely. |

## Features

- **Sign in first**: the sign-in / create-account page asks *who you are* (future student, current student, academic advisor, department staff), so each person lands straight in their own workspace. Demo accounts are pre-filled; nothing leaves the device.
- **Four workspaces**, each with its own views, colour and guided tour. Permissions are enforced in the store, not just hidden in the UI:
  - *Future student*: **Find your path** (pick interests, choose a career, see every route to it year by year, then compare routes), **All programmes** (where each programme can lead) and **My shortlist** (saved routes plus next steps to apply).
  - *Current student*: **Home** with four entry points and "Needs your attention", then **Explore courses**, **My week**, **Start from a goal** and **Ask the tutor**. The live alert panel only appears where the plan is edited.
  - *Academic advisor*: **My Advisees**, **Plan Review** (findings, courses, read-only timetable, approve / request changes, history) and a read-only catalogue.
  - *Department staff*: **Course Data & Librarian**, **Department Timetable** and **Reports & feedback** (bug reports and messages from every user, which can be marked resolved).
- **Account menu**: account & profile, notifications, language & region, calendar sync, privacy & data, display & accessibility, guided tour, help, reset demo, sign out. Most settings are prototype placeholders and are labelled as such.
- **Help & feedback** (the **?** button, account menu or footer, signed in or out):
  - contact details with copy buttons, office hours and a message form;
  - a bug-report form with type, location (pre-filled), severity, screenshot, follow-up email and optional technical details, which returns a reference number;
  - an FAQ.
- **Non-dismissable agent alert panel**: overlap alerts have no close control. They disappear only when the conflict is resolved, e.g. via **⚡ Apply Smart Recommendation**, which swaps in the best-ranked non-overlapping elective. On mobile, critical alerts also stay pinned at the top of the screen.
- **Explore courses**: search plus filters for campus, format, CFU and schedule days. Course cards show code, lecturer, schedule, attendance tag, an official syllabus modal, inline clash and prerequisite badges, and Add / Preview / Compare buttons. Comparing 2–3 courses opens a matrix of CFU, workload, review score, schedule, conflicts with the draft, prerequisites and assessment.
- **My week**: a Mon–Fri 08:00–18:00 grid with colour-coded blocks.
  - *Confirmed Schedule / Draft Preview* toggle switches between enrolled courses only and the full draft.
  - Hover or pin a course to overlay a striped ghost block; any collision zone flashes red with **🔥 Schedule Collision!**.
- **Start from a goal**: a four-tier node graph (foundations → this semester → unlocked subjects → careers) whose node status comes from the student's record and plan. Clicking a node or career highlights its exact prerequisite path and offers to add the conflict-free courses on it.
- **Ask the tutor**: available as a dedicated tab and as a floating drawer.
  - *Study Planner* mode finds non-conflicting electives, fills credit gaps, checks prerequisites and maps courses to careers.
  - *Course Concept Tutor* mode explains syllabi, syllabus differences and key concepts.
  - Replies render mini course cards with **⚡ Add to Plan** and **📅 Ghost Preview on Calendar**.

- **Guided tour**: opens on the first visit and walks through every area, switching tabs as it goes. Skip it from the first card; replay it anytime from the account menu.
- **Change confirmations**: an impact agent (`src/agents/impact.js`) compares alerts before and after each change.
  - Dropping a course always asks first and lists the consequences: lost credits, a released confirmed seat, career skills lost, and new or resolved alerts.
  - Adding or swapping asks only when the change creates a clash, a missing prerequisite or a credit problem, or when it would reopen a plan that was already submitted.

- **Display & accessibility** (account menu, settings or footer; saved per device and kept by *Reset demo*):
  - *Theme*: System (follows the OS or host setting), Light or Dark.
  - *Colour-blind friendly*: an Okabe–Ito palette that stays distinct with protanopia, deuteranopia and tritanopia, plus patterns on calendar blocks, legends and the progress bar so colour is never the only cue.
  - *Text size* (100 / 112.5 / 125%), *High contrast*, *Reduce motion* and a *Readable font* (Atkinson Hyperlegible).
  - Always on: a skip-to-content link, visible keyboard focus, labelled regions and controls, and type labels on calendar blocks. Every workspace passes an axe-core WCAG 2 A/AA audit in light, dark, colour-blind and high-contrast modes.
  - Dark mode and the colour-blind palette work by re-pointing Tailwind's colour variables in `src/index.css`. The `ink` palette is for panels that stay dark in both themes.

- **Fluid layout**: the whole page scrolls naturally. The tab bar stays pinned at the top, and on wide screens the alert panel sticks beside the content. You can resize:
  - the alert panel, by dragging its edge;
  - columns in every data table, by dragging header edges, using ← → on a focused handle, or double-clicking to reset;
  - the calendar, with a zoom control;
  - the skill tree, with zoom or *Fit to screen*.

  - every main panel and table (course list, calendars, skill tree, AI tutor, advisees, plan courses, course records), each in a frame. Drag the right-edge grip for width, the bottom grip for height, or the corner for both. The content adapts:
    - the course grid changes its number of columns, because it uses container queries;
    - the skill tree's *Fit to screen* re-fits to the frame;
    - tables stretch their columns, and their headers stay pinned while you scroll inside the frame;
    - the content scrolls inside the frame when it is larger.

  Sizes are remembered on the device. Handles work with mouse, touch (iPad) and keyboard (arrow keys; Home or double-click to reset), and *Reset size* restores a frame.

## Project layout

```
src/
  brain/        courses.js · student.js · skillGraph.js · pathways.js · rawFeed.js
  librarian/    schedule.js · normalize.js · ingest.js
  agents/       planning.js · proactiveAgent.js · tutorEngine.js · agents.test.js
  store/        usePlanStore.js · derived.js
  components/
    auth/       SignInPage
    home/       StudentHome
    newcomer/   PathFinder · RouteCard · Programmes · Shortlist
    layout/     Header · AccountMenu · SettingsPanel · DisplaySettings · Footer · TabNav · DegreeProgress · RoleContextBar · LibrarianConsole
    support/    HelpCenter
    alerts/     ProactiveAlerts · ConfirmChangeDialog
    catalogue/  CourseCatalogue · CourseCard · ComparisonDrawer · SyllabusModal
    schedule/   ScheduleCalendar · WeekGrid
    skills/     SkillTree
    chat/       AdvisorChatbot (+ ChatDrawer) · ChatCourseCard
    advisor/    AdviseesDashboard · PlanReview
    admin/      CourseDataAdmin · DepartmentTimetable · ReportsInbox
    tour/       GuidedTour
    ui/         primitives (Stars, TypeChip, RichText, Modal) · resize (ResizableBox, ResizeHandle, ZoomControl)
```

The tutor is a deterministic rule engine, so the demo works offline. See *Future step: Gemma 4* above for how a model could replace it later.
