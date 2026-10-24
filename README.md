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
| **AI Tutor** | `src/agents/tutorEngine.js` | Context-aware planner / concept tutor, reasoning over live Brain + plan state |
| **State** | `src/store/` | Zustand store (persisted "auto-save") + memoised derived hooks shared by every view |

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

The tutor is a deterministic rule engine, so the demo works offline. To use a hosted LLM, replace
`tutorRespond()` with an API call and keep its `{ text, cards, bulkAdd }` return shape.
