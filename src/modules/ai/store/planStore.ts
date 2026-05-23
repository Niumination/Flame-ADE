import { create } from "zustand";

export type QueuedEdit = {
  id: string;
  kind: string;
  path: string;
  originalContent: string;
  proposedContent: string;
  isNewFile: boolean;
  description?: string;
};

let editCounter = 0;

export function newQueuedEditId(): string {
  return `edit-${Date.now()}-${editCounter++}`;
}

interface PlanStore {
  active: boolean;
  queue: QueuedEdit[];
  enqueue: (edit: QueuedEdit) => void;
  clear: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
  active: false,
  queue: [],
  enqueue: (edit) => set((s) => ({ queue: [...s.queue, edit] })),
  clear: () => set({ queue: [] }),
}));
