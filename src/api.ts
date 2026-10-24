// The admin is served at https://web-<short>.app.withvibe.dev and the API at
// https://api-<short>.app.withvibe.dev. Derive the API base from our own host
// by swapping the first subdomain label's prefix — no build-time env needed.
// Falls back to localhost:8080 for local `npm run dev`.
export function apiBase(): string {
  const { protocol, host } = window.location;
  if (host.startsWith("localhost") || host.startsWith("127.")) {
    return "http://localhost:8080";
  }
  return `${protocol}//${host.replace(/^[^.-]+-/, "api-")}`;
}

export type Todo = {
  id: number;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  assignee: string | null;
  createdAt: string;
};

const base = apiBase();

export async function listTodos(): Promise<Todo[]> {
  const r = await fetch(`${base}/todos`);
  if (!r.ok) throw new Error(`list failed: ${r.status}`);
  return r.json();
}

export async function createTodo(input: Partial<Todo>): Promise<Todo> {
  const r = await fetch(`${base}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`create failed: ${r.status}`);
  return r.json();
}

export async function updateTodo(id: number, input: Partial<Todo>): Promise<Todo> {
  const r = await fetch(`${base}/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`update failed: ${r.status}`);
  return r.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const r = await fetch(`${base}/todos/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`delete failed: ${r.status}`);
}
