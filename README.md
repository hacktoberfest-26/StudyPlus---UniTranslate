# StudyPlus UniTranslate — H-OS Academic Module

An AI-powered academic planning operating system for university students, academic advisors and
department admins. It replaces confusing course-planning portals with one live workspace where the
calendar, degree progress, prerequisite checks and AI tutor all react instantly to every draft change.

Built with **React 19 + Vite**, **Tailwind CSS v4**, **Zustand** and **lucide-react**.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Librarian, agent and tutor logic (Vitest)
npm run build    # production bundle in dist/
```

## H-OS architecture

| Layer | Folder | Responsibility |
| --- | --- | --- |
| **The Brain** (knowledge store) | `src/brain/` | Course syllabi & timetables, CFU buckets (180 total), student record (114 CFU), skill graph, career pathways, raw syllabus feed |
| **The Librarian** | `src/librarian/` | Normalises course records into the Brain schema, parses unstructured syllabus text, flags or quarantines bad data, detects timetable overlaps |
| **Proactive Agents** | `src/agents/proactiveAgent.js` | "Management by exception": re-runs on every draft change and emits critical (overlap), warning (prerequisite, missing compulsory, credit shortage/overload) and success (smart alternative) alerts |
| **AI Tutor** | `src/agents/tutorEngine.js` | Context-aware planner / concept tutor, reasoning over live Brain + plan state |
| **State** | `src/store/` | Zustand store (persisted "auto-save") + memoised derived hooks shared by every view |

## Features

- **Global header**: role switcher (🎓 Student · 👨‍🏫 Advisor · 🏛️ Admin), auto-save banner with submission status, and a 3-year progress bar split into Core / Electives / Thesis, with striped segments for credits planned this semester.
- **Role workflows**
  - *Student*: submit the draft to the advisor. Submission is blocked while a critical alert is open.
  - *Advisor*: review the draft, request changes with a note, or approve it (approval confirms every draft course).
  - *Admin*: Librarian console with Brain health stats and one-click ingestion of a messy syllabus feed. Clean records are published to the catalogue; broken ones are quarantined with the reason.
- **Non-dismissable agent alert panel**: overlap alerts have no close control. They disappear only when the conflict is resolved, e.g. via **⚡ Apply Smart Recommendation**, which swaps in the best-ranked non-overlapping elective. On mobile, critical alerts also stay pinned at the top of the screen.
- **Tab 1 · Course Catalogue**: search plus filters for campus, format, CFU and schedule days. Course cards show code, lecturer, schedule, attendance tag, an official syllabus modal, inline clash and prerequisite badges, and Add / Preview / Compare buttons. Comparing 2–3 courses opens a matrix of CFU, workload, review score, schedule, conflicts with the draft, prerequisites and assessment.
- **Tab 2 · Ghost Calendar**: a Mon–Fri 08:00–18:00 grid with colour-coded blocks.
  - *Confirmed Schedule / Draft Preview* toggle switches between enrolled courses only and the full draft.
  - Hover or pin a course to overlay a striped ghost block; any collision zone flashes red with **🔥 Schedule Collision!**.
- **Tab 3 · Skill Tree**: a four-tier node graph (foundations → this semester → unlocked subjects → careers) whose node status comes from the student's record and plan. Clicking a node or career highlights its exact prerequisite path and offers to add the conflict-free courses on it.
- **Tab 4 · StudyPlus AI Tutor**: available as a dedicated tab and as a floating drawer.
  - *Study Planner* mode finds non-conflicting electives, fills credit gaps, checks prerequisites and maps courses to careers.
  - *Course Concept Tutor* mode explains syllabi, syllabus differences and key concepts.
  - Replies render mini course cards with **⚡ Add to Plan** and **📅 Ghost Preview on Calendar**.

- **Guided tour**: opens on the first visit and walks through every area, switching tabs as it goes. Skip it from the first card; replay it anytime with the **Tour** button.
- **Change confirmations**: an impact agent (`src/agents/impact.js`) compares alerts before and after each change.
  - Dropping a course always asks first and lists the consequences: lost credits, a released confirmed seat, career skills lost, and new or resolved alerts.
  - Adding or swapping asks only when the change creates a clash, a missing prerequisite or a credit problem, or when it would reopen a plan that was already submitted.

## Project layout

```
src/
  brain/        courses.js · student.js · skillGraph.js · rawFeed.js
  librarian/    schedule.js · normalize.js · ingest.js
  agents/       planning.js · proactiveAgent.js · tutorEngine.js · agents.test.js
  store/        usePlanStore.js · derived.js
  components/
    layout/     Header · DegreeProgress · RoleContextBar · LibrarianConsole · TabNav
    alerts/     ProactiveAlerts
    catalogue/  CourseCatalogue · CourseCard · ComparisonDrawer · SyllabusModal
    schedule/   ScheduleCalendar
    skills/     SkillTree
    chat/       AdvisorChatbot (+ ChatDrawer) · ChatCourseCard
    ui/         primitives (Stars, TypeChip, RichText, Modal)
```

The tutor is a deterministic rule engine, so the demo works offline. To use a hosted LLM, replace
`tutorRespond()` with an API call and keep its `{ text, cards, bulkAdd }` return shape.
