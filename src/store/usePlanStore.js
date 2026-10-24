/**
 * Global H-OS state (Zustand). Every plan mutation is "auto-saved" (persisted to
 * localStorage) and re-evaluated by the proactive agents via the derived hooks.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BRAIN_COURSES } from '../brain/courses.js';
import { INITIAL_PLAN, STUDENT } from '../brain/student.js';
import { RAW_SYLLABUS_FEED } from '../brain/rawFeed.js';
import { normalizeCourse } from '../librarian/normalize.js';
import { ingestFeed } from '../librarian/ingest.js';
import { tutorRespond } from '../agents/tutorEngine.js';

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

      return {
        ...initialState(),
        toast,

        setRole: (role) => set({ role }),
        setTab: (activeTab) => set({ activeTab }),
        setScheduleMode: (scheduleMode) => set({ scheduleMode }),

        addCourse: (code) => {
          const course = findCourse(code);
          if (!course) return;
          if (get().plan.some((p) => p.code === code)) {
            toast(`"${course.title}" is already in your draft plan.`);
            return;
          }
          commitPlan([...get().plan, { code, status: 'draft' }]);
          if (get().ghostCode === code) set({ ghostCode: null });
          toast(`Added "${course.title}" to your draft plan.`, 'success');
        },

        addMany: (codes) => {
          const fresh = codes.filter((code) => findCourse(code) && !get().plan.some((p) => p.code === code));
          if (!fresh.length) {
            toast('Those courses are already in your draft plan.');
            return;
          }
          commitPlan([...get().plan, ...fresh.map((code) => ({ code, status: 'draft' }))]);
          toast(`Added ${fresh.length} course(s) to your draft plan.`, 'success');
        },

        removeCourse: (code) => {
          const course = findCourse(code);
          commitPlan(get().plan.filter((p) => p.code !== code));
          toast(`Dropped "${course?.title ?? code}" from your plan.`);
        },

        swapCourse: (dropCode, addCode) => {
          const drop = findCourse(dropCode);
          const add = findCourse(addCode);
          if (!drop || !add) return;
          commitPlan([...get().plan.filter((p) => p.code !== dropCode && p.code !== addCode), { code: addCode, status: 'draft' }]);
          set({ ghostCode: null });
          toast(`Smart recommendation applied: "${add.title}" replaces "${drop.title}".`, 'success');
        },

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
          set({ submission: 'submitted', advisorNote: null, lastSavedAt: new Date().toISOString() });
          toast('Draft submitted to Prof. Rossi for review.', 'success');
        },
        approveDraft: () => {
          set((s) => ({
            plan: s.plan.map((p) => ({ ...p, status: 'confirmed' })),
            submission: 'approved',
            advisorNote: null,
            lastSavedAt: new Date().toISOString(),
          }));
          toast('Draft approved — all courses are now confirmed.', 'success');
        },
        requestChanges: (note) => {
          set({ submission: 'changes', advisorNote: note || 'Please revise your draft plan.' });
          toast('Change request sent to Alex.');
        },

        runIngest: () => {
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
          set({ ...initialState(), role: get().role });
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
      }),
    },
  ),
);
