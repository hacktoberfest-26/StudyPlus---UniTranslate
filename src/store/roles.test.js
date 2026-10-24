import { describe, it, expect, beforeEach } from 'vitest';
import { usePlanStore } from './usePlanStore.js';

const store = () => usePlanStore.getState();
const codes = () => store().plan.map((p) => p.code);

describe('Role permissions', () => {
  beforeEach(() => {
    store().resetDemo();
    usePlanStore.setState({ toursDone: { student: true, advisor: true, admin: true } });
  });

  it('only the student can change the study plan', () => {
    for (const role of ['advisor', 'admin']) {
      store().setRole(role);
      store().addCourse('DMN-310');
      store().removeCourse('BCT-240');
      store().swapCourse('ADS-301', 'DMA-230');
      expect(codes()).toEqual(['DBS-210', 'UXD-150', 'ADS-301', 'BCT-240']);
      expect(store().pendingChange).toBeNull();
    }
    store().setRole('student');
    store().addCourse('DMN-310');
    expect(codes()).toContain('DMN-310');
  });

  it('only the advisor can approve, and only the admin can ingest', () => {
    store().setRole('student');
    store().approveDraft();
    store().runIngest();
    expect(store().submission).toBe('draft');
    expect(store().ingestReport).toBeNull();

    store().setRole('advisor');
    store().submitDraft();
    expect(store().submission).toBe('draft');
    store().approveDraft();
    expect(store().submission).toBe('draft'); // not submitted yet

    store().setRole('student');
    store().submitDraft();
    expect(store().submission).toBe('draft'); // blocked by the ADS/DBS overlap
    store().swapCourse('ADS-301', 'DMA-230');
    store().confirmPendingChange();
    store().submitDraft();
    expect(store().submission).toBe('submitted');

    store().setRole('advisor');
    store().approveDraft();
    expect(store().submission).toBe('approved');
    expect(store().plan.every((p) => p.status === 'confirmed')).toBe(true);
    expect(store().reviewLog.map((e) => e.action)).toEqual(['submitted', 'approved']);

    store().setRole('admin');
    store().runIngest();
    expect(store().ingestReport).toHaveLength(3);
  });

  it('switching role opens that workspace on its own first view', () => {
    store().setRole('advisor');
    expect(store().activeTab).toBe('advisees');
    store().setRole('admin');
    expect(store().activeTab).toBe('courses');
  });
});
