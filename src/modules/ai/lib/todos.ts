export type Todo = {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
};

let counter = 0;

export function newTodoId(): string {
  return `todo-${Date.now()}-${counter++}`;
}

export function validateTodos(todos: Todo[]): string | null {
  if (!todos.length) return "todos list is empty";
  const inProgress = todos.filter((t) => t.status === "in_progress");
  if (inProgress.length > 1) return "only one item can be in_progress";
  return null;
}
