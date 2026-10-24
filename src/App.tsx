import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodo,
  type Todo,
} from "./api";

const PRIORITIES = ["low", "medium", "high"] as const;

const PRIORITY_META: Record<string, { fg: string; bg: string; label: string }> = {
  high: { fg: "#b91c1c", bg: "#fef2f2", label: "High" },
  medium: { fg: "#b45309", bg: "#fffbeb", label: "Medium" },
  low: { fg: "#6b7280", bg: "#f3f4f6", label: "Low" },
};

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("medium");

  async function refresh() {
    try {
      setTodos(await listTodos());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Poll so changes made on the mobile app show up here live.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  async function add() {
    if (!title.trim()) return;
    await createTodo({ title, assignee: assignee || null, priority });
    setTitle("");
    setAssignee("");
    setPriority("medium");
    refresh();
  }

  const stats = useMemo(() => {
    const done = todos.filter((t) => t.done).length;
    return { total: todos.length, done, open: todos.length - done };
  }, [todos]);

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandDot} /> Todo Admin
        </div>
        <nav style={styles.nav}>
          {["Tasks", "Team", "Reports", "Settings"].map((item, i) => (
            <div key={item} style={{ ...styles.navItem, ...(i === 0 ? styles.navActive : {}) }}>
              {item}
            </div>
          ))}
        </nav>
        <div style={styles.sidebarFoot}>Admin console · v1.0</div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Tasks</h1>
            <p style={styles.sub}>
              {stats.total} total · {stats.open} open · {stats.done} done
              {error && <span style={styles.err}> · API: {error}</span>}
            </p>
          </div>
        </header>

        <section style={styles.stats}>
          <Stat label="Total" value={`${stats.total}`} />
          <Stat label="Open" value={`${stats.open}`} />
          <Stat label="Done" value={`${stats.done}`} tone="green" />
        </section>

        <section style={styles.addRow}>
          <input
            style={styles.input}
            placeholder="New task title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <input
            style={{ ...styles.input, maxWidth: 160 }}
            placeholder="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
          <select
            style={styles.select}
            value={priority}
            onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
          <button style={styles.addBtn} onClick={add}>
            + Add task
          </button>
        </section>

        <section style={styles.panel}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["", "Task", "Assignee", "Priority", "Created", ""].map((h, i) => (
                  <th key={i} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todos.map((t) => {
                const pm = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
                return (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={async () => {
                          await updateTodo(t.id, { done: !t.done });
                          refresh();
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 600,
                        textDecoration: t.done ? "line-through" : "none",
                        color: t.done ? "var(--soft)" : "var(--ink)",
                      }}
                    >
                      {t.title}
                    </td>
                    <td style={styles.td}>{t.assignee ?? "—"}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color: pm.fg, background: pm.bg }}>
                        {pm.label}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "var(--soft)" }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.del}
                        onClick={async () => {
                          await deleteTodo(t.id);
                          refresh();
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {todos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "var(--soft)" }}>
                    No tasks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color: tone === "green" ? "var(--green)" : "var(--ink)" }}>
        {value}
      </div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: { display: "flex", height: "100%", minHeight: "100vh" },
  sidebar: { width: 200, background: "#0f1222", color: "#e6e9f2", display: "flex", flexDirection: "column", padding: "20px 14px" },
  brand: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, padding: "4px 8px 18px" },
  brandDot: { width: 12, height: 12, borderRadius: 4, background: "var(--accent)" },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navItem: { padding: "9px 10px", borderRadius: 8, color: "#aab0c6", fontSize: 14 },
  navActive: { background: "rgba(79,70,229,.28)", color: "#fff", fontWeight: 600 },
  sidebarFoot: { marginTop: "auto", color: "#6b7194", fontSize: 12, padding: 8 },
  main: { flex: 1, padding: "24px 28px", overflow: "auto" },
  header: { marginBottom: 18 },
  h1: { fontSize: 24, fontWeight: 700 },
  sub: { color: "var(--soft)", marginTop: 2 },
  err: { color: "var(--red)" },
  stats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18, maxWidth: 520 },
  statCard: { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" },
  statValue: { fontSize: 24, fontWeight: 700 },
  statLabel: { color: "var(--soft)", fontSize: 13, marginTop: 2 },
  addRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  input: { flex: 1, minWidth: 180, border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", background: "#fff" },
  select: { border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", background: "#fff" },
  addBtn: { background: "var(--accent)", color: "#fff", border: 0, borderRadius: 10, padding: "9px 16px", fontWeight: 600 },
  panel: { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 8 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--soft)", padding: "10px 12px", fontWeight: 700 },
  tr: { borderTop: "1px solid var(--line)" },
  td: { padding: "12px", fontSize: 14, verticalAlign: "middle" },
  badge: { padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  del: { background: "transparent", border: "1px solid var(--line)", color: "var(--red)", borderRadius: 8, padding: "5px 10px", fontSize: 13 },
};
