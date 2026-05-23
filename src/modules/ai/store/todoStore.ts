import { create } from "zustand";
import type { Todo } from "../lib/todos";

interface TodoStore {
  todos: Record<string, Todo[]>;
  setTodos: (sessionId: string, todos: Todo[]) => void;
}

export const useTodosStore = create<TodoStore>((set) => ({
  todos: {},
  setTodos: (sessionId, todos) =>
    set((s) => ({
      todos: { ...s.todos, [sessionId]: todos },
    })),
}));
