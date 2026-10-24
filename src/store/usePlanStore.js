/**
 * Global H-OS state (Zustand). Every plan mutation is "auto-saved" (persisted to
 * localStorage) and re-evaluated by the proactive agents via the derived hooks.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BRAIN_COURSES } from '../brain/courses.js';
import { INITIAL_PLAN, STUDENT, ROLES } from '../brain/student.js';

/** The view each role lands on. */
export const DEFAULT_TAB = { student: 'catalog', advisor: 'advisees', admin: 'courses' };
import { RAW_SYLLABUS_FEED } from '../brain/rawFeed.js';
import { normalizeCourse } from '../librarian/normalize.js';
import { ingestFeed } from '../librarian/ingest.js';
import { tutorRespond } from '../agents/tutorEngine.js';
import { assessChange } from '../agents/impact.js';
import { runProactiveAgents } from '../agents/proactiveAgent.js';

const initialCatalog = () => BRAIN_COURSES.map((raw) => normalizeCourse(raw).course);

let idSeq = 0;
const nextId = () => `${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

const initialState = () => ({
  role: 'student',
  catalog: initialCatalog(),
  plan: INITIAL_PLAN.map((p) => ({ ...p })),
  submission: 'draft',
  advisorNote: null,
  lastSavedAt: null,
  ingestReport: null,
  activeTab: 'catalog',
  scheduleMode: 'confirmed',
  ghostCode: null,
  hoverGhostCode: null,
  compareCodes: [],
  compareOpen: false,
  syllabusCode: null,
  chatOpen: false,
  tutorMode: 'planner',
  messages: [],
  typing: false,
  toasts: [],
  pendingChange: null,
  toursDone: {},
  tourStep: null,
  reviewLog: [],
});

export const usePlanStore = create(
  persist(
    (set, get) => {
      const findCourse = (code) => get().catalog.find((c) => c.code === code);

      /** Applies a plan change, stamps the auto-save time and re-opens a submitted draft. */
      const commitPlan = (plan) =>
        set({
          plan,
          lastSavedAt: new Date().toISOString(),
          submission: 'draft',
        });

      const toast = (text, tone = 'info') => {
        const id = nextId();
        set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
      };

      /** Commits an add / remove / swap and reports it. */
      const applyChange = ({ kind, codes }) => {
        const titles = codes.map((c) => findCourse(c)?.title ?? c);
        const plan = get().plan;
        if (kind === 'remove') {
          commitPlan(plan.filter((p) => !codes.includes(p.code)));
          toast(`Dropped "${titles[0]}" from your plan.`);
        } else if (kind === 'swap') {
          const [drop, add] = codes;
          commitPlan([...plan.filter((p) => p.code !== drop && p.code !== add), { code: add, status: 'draft' }]);
          set({ ghostCode: null });
          toast(`Swap applied: "${titles[1]}" replaces "${titles[0]}".`, 'success');
        } else {
          commitPlan([...plan, ...codes.map((code) => ({ code, status: 'draft' }))]);
          if (codes.includes(get().ghostCode)) set({ ghostCode: null });
          toast(codes.length === 1 ? `Added "${titles[0]}" to your draft plan.` : `Added ${codes.length} courses to your draft plan.`, 'success');
        }
      };

      /**
       * Every plan change goes through the impact agent first. Drops always ask for
       * confirmation; adds and swaps ask only when they create a new problem.
       */
      const proposeChange = (change) => {
        const { plan, catalog, submission } = get();
        const { effects, needsConfirm } = assessChange({ plan, catalog, student: STUDENT, change });
        const reopens = submission === 'submitted' || submission === 'approved';
        if (reopens) {
          effects.push({
            tone: 'warning',
            text: `Your plan is currently ${submission === 'approved' ? 'approved' : 'submitted for review'}. This change sets it back to Active Draft, so you will need to submit it again.`,
          });
        }
        if (!needsConfirm && !reopens) {
          applyChange(change);
          return;
        }
        set({ pendingChange: { change, effects } });
      };

      /**
       * Each role only gets its own actions: the plan belongs to the student, the
       * decision to the advisor and the catalogue data to the admin.
       */
      const allowed = (role, what) => {
        if (get().role === role) return true;
        toast(`Only the ${ROLES[role].short.toLowerCase()} can ${what}.`, 'warning');
        return false;
      };
      const hasCritical = () =>
        runProactiveAgents({ plan: get().plan, catalog: get().catalog, student: STUDENT }).some((a) => a.severity === 'critical');
      const logReview = (action, note) =>
        set((s) => ({ reviewLog: [...s.reviewLog, { id: nextId(), at: new Date().toISOString(), action, note: note || null }] }));

      return {
        ...initialState(),
        toast,

        setRole: (role) => {
          set({
            role,
            activeTab: DEFAULT_TAB[role],
            chatOpen: false,
            compareOpen: false,
            compareCodes: [],
            pendingChange: null,
            ghostCode: null,
            hoverGhostCode: null,
          });
          // Each interface has its own short tour the first time it is opened.
          if (!get().toursDone[role]) get().startTour();
        },
        setTab: (activeTab) => set({ activeTab }),
        setScheduleMode: (scheduleMode) => set({ scheduleMode }),

        addCourse: (code) => {
          if (!allowed('student', 'change the study plan')) return;
          const course = findCourse(code);
          if (!course) return;
          if (get().plan.some((p) => p.code === code)) {
            toast(`"${course.title}" is already in your draft plan.`);
            return;
          }
          proposeChange({ kind: 'add', codes: [code] });
        },

        addMany: (codes) => {
          if (!allowed('student', 'change the study plan')) return;
          const fresh = codes.filter((code) => findCourse(code) && !get().plan.some((p) => p.code === code));
          if (!fresh.length) {
            toast('Those courses are already in your draft plan.');
            return;
          }
          proposeChange({ kind: 'add', codes: fresh });
        },

        removeCourse: (code) => {
          if (!allowed('student', 'change the study plan')) return;
          if (findCourse(code)) proposeChange({ kind: 'remove', codes: [code] });
        },

        swapCourse: (dropCode, addCode) => {
          if (!allowed('student', 'change the study plan')) return;
          if (findCourse(dropCode) && findCourse(addCode)) proposeChange({ kind: 'swap', codes: [dropCode, addCode] });
        },

        confirmPendingChange: () => {
          const pending = get().pendingChange;
          set({ pendingChange: null });
          if (pending) applyChange(pending.change);
        },
        cancelPendingChange: () => set({ pendingChange: null }),

        startTour: () => set({ tourStep: 0, chatOpen: false, compareOpen: false, syllabusCode: null }),
        setTourStep: (tourStep) => set({ tourStep }),
        endTour: () =>
          set((s) => ({ tourStep: null, toursDone: { ...s.toursDone, [s.role]: true }, activeTab: DEFAULT_TAB[s.role] })),

        previewCourse: (code) => {
          set({ ghostCode: code, activeTab: 'schedule', scheduleMode: 'draft', chatOpen: false, compareOpen: false });
        },
        setHoverGhost: (hoverGhostCode) => set({ hoverGhostCode }),
        clearGhost: () => set({ ghostCode: null, hoverGhostCode: null }),

        toggleCompare: (code) => {
          const { compareCodes } = get();
          if (compareCodes.includes(code)) {
            set({ compareCodes: compareCodes.filter((c) => c !== code) });
          } else if (compareCodes.length >= 3) {
            toast('You can compare up to 3 courses at a time.', 'warning');
          } else {
            set({ compareCodes: [...compareCodes, code] });
          }
        },
        openCompare: () => set({ compareOpen: true }),
        closeCompare: () => set({ compareOpen: false }),
        clearCompare: () => set({ compareCodes: [], compareOpen: false }),

        openSyllabus: (syllabusCode) => set({ syllabusCode }),
        closeSyllabus: () => set({ syllabusCode: null }),

        submitDraft: () => {
          if (!allowed('student', 'submit the plan')) return;
          if (hasCritical()) {
            toast('Resolve the timetable overlap before submitting.', 'warning');
            return;
          }
          logReview('submitted');
          set({ submission: 'submitted', advisorNote: null, lastSavedAt: new Date().toISOString() });
          toast('Draft submitted to Prof. Rossi for review.', 'success');
        },
        approveDraft: (note) => {
          if (!allowed('advisor', 'approve a plan')) return;
          if (get().submission !== 'submitted' || hasCritical()) {
            toast('Only a submitted plan without timetable overlaps can be approved.', 'warning');
            return;
          }
          logReview('approved', note);
          set((s) => ({
            plan: s.plan.map((p) => ({ ...p, status: 'confirmed' })),
            submission: 'approved',
            advisorNote: null,
            lastSavedAt: new Date().toISOString(),
          }));
          toast('Draft approved — all courses are now confirmed.', 'success');
        },
        requestChanges: (note) => {
          if (!allowed('advisor', 'request changes')) return;
          logReview('changes', note || 'Please revise your draft plan.');
          set({ submission: 'changes', advisorNote: note || 'Please revise your draft plan.' });
          toast('Change request sent to Alex.');
        },

        runIngest: () => {
          if (!allowed('admin', 'run the Librarian ingestion')) return;
          const report = ingestFeed(RAW_SYLLABUS_FEED, get().catalog.map((c) => c.code));
          const published = report.filter((r) => r.publishable).map((r) => r.course);
          set((s) => ({ ingestReport: report, catalog: [...s.catalog, ...published] }));
          toast(`Librarian ingested ${report.length} records: ${published.length} published, ${report.length - published.length} held back.`, 'success');
        },

        openChat: () => set({ chatOpen: true }),
        closeChat: () => set({ chatOpen: false }),
        toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
        setTutorMode: (tutorMode) => set({ tutorMode }),

        sendChat: (text) => {
          const message = text.trim();
          if (!message || get().typing) return;
          set((s) => ({
            messages: [...s.messages, { id: nextId(), role: 'user', text: message, at: new Date().toISOString() }],
            typing: true,
          }));
          // Simulated model latency; the reply is computed from state at answer time.
          setTimeout(() => {
            const { tutorMode, catalog, plan } = get();
            const reply = tutorRespond(message, { mode: tutorMode, catalog, plan, student: STUDENT });
            set((s) => ({
              messages: [...s.messages, { id: nextId(), role: 'ai', at: new Date().toISOString(), ...reply }],
              typing: false,
            }));
          }, 900);
        },

        /** Ask the tutor from anywhere in the app (alerts, skill tree…). */
        askTutor: (prompt) => {
          if (get().role !== 'student') return;
          if (get().activeTab !== 'advisor') set({ chatOpen: true });
          get().sendChat(prompt);
        },

        runAlertAction: (action) => {
          const s = get();
          switch (action.kind) {
            case 'swap':
              return s.swapCourse(action.drop, action.add);
            case 'drop':
              return s.removeCourse(action.code);
            case 'add':
              return s.addCourse(action.code);
            case 'preview':
              return s.previewCourse(action.code);
            case 'ask-tutor':
              return s.askTutor(action.prompt);
            default:
              return undefined;
          }
        },

        resetDemo: () => {
          set({ ...initialState(), role: get().role, activeTab: DEFAULT_TAB[get().role], toursDone: get().toursDone });
          toast('Demo data reset.');
        },
      };
    },
    {
      name: 'studyplus-hos-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        role: s.role,
        catalog: s.catalog,
        plan: s.plan,
        submission: s.submission,
        advisorNote: s.advisorNote,
        lastSavedAt: s.lastSavedAt,
        ingestReport: s.ingestReport,
        toursDone: s.toursDone,
        reviewLog: s.reviewLog,
      }),
      version: 1,
      // v0 stored a single `tourDone` flag for the (then only) student tour.
      migrate: (state, version) => {
        if (version === 0 && state) {
          state.toursDone = { student: !!state.tourDone };
          delete state.tourDone;
        }
        return state;
      },
    },
  ),
);
