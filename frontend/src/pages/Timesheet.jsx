import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

export function Timesheet() {
  const [entries, setEntries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staffId: "", projectId: "", date: new Date().toISOString().slice(0, 10), hours: "", taskDescription: "" });
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  function load() {
    api.get("/timesheets").then(setEntries);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/staff").then(setStaff);
    api.get("/projects").then(setProjects);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/timesheets", { ...form, projectId: form.projectId || undefined });
      setShowForm(false);
      setForm({ staffId: "", projectId: "", date: new Date().toISOString().slice(0, 10), hours: "", taskDescription: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this timesheet entry?")) return;
    await api.delete(`/timesheets/${id}`).catch((err) => setError(err.message));
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Timesheet</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Log hours"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Staff member</label>
              <select required value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
                <option value="">Select staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Project (optional)</label>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Hours</label>
              <input type="number" step="0.25" required value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Task description</label>
              <input value={form.taskDescription} onChange={(e) => setForm({ ...form, taskDescription: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">No timesheet entries yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Project</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Task</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((e) => (
                <tr key={e.id}>
                  <td>{e.staff_name}</td>
                  <td>{e.project_name || "—"}</td>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td>{e.hours}</td>
                  <td>{e.task_description || "—"}</td>
                  <td>
                    <button className="btn secondary" onClick={() => handleDelete(e.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={entries.length} onChange={setPage} />
      </div>
    </div>
  );
}
