import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Play, Square, Inbox, X } from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const ElectionManagement = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data } = await api.get("/elections");
      setElections(data.elections);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load elections");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (editingId) {
        await api.put(`/elections/${editingId}`, form);
        setSuccess("Election updated");
      } else {
        await api.post("/elections", form);
        setSuccess("Election created");
      }
      setForm({ title: "", description: "", startDate: "", endDate: "" });
      setEditingId(null);
      setShowForm(false);
      fetchElections();
    } catch (err) {
      setError(err.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (election) => {
    setForm({
      title: election.title,
      description: election.description || "",
      startDate: election.startDate?.slice(0, 16) || "",
      endDate: election.endDate?.slice(0, 16) || "",
    });
    setEditingId(election._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this election and all its candidates/votes?")) return;
    try {
      await api.delete(`/elections/${id}`);
      setSuccess("Election deleted");
      fetchElections();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/elections/${id}/status`, { status });
      setSuccess(`Election status changed to ${status}`);
      fetchElections();
    } catch (err) {
      setError(err.response?.data?.error || "Status change failed");
    }
  };

  if (loading) return <Loading message="Loading elections..." />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Election Management</h2>
          <p className="page-subtitle">{elections.length} election(s) on the platform.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ title: "", description: "", startDate: "", endDate: "" });
          }}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Election</>}
        </button>
      </div>

      <ErrorMessage message={error} />
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3>{editingId ? "Edit Election" : "Create Election"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g., General Election 2026"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">
              {editingId ? <><Pencil size={16} /> Update</> : <><Plus size={16} /> Create</>}
            </button>
          </form>
        </div>
      )}

      {elections.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon"><Inbox size={24} /></span>
            <h3>No elections yet</h3>
            <p>Create your first election to get started.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((election) => (
                  <tr key={election._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{election.title}</div>
                      {election.description && (
                        <div className="table-muted" style={{ fontSize: "0.8rem" }}>{election.description}</div>
                      )}
                    </td>
                    <td><span className={`badge badge-${election.status}`}>{election.status}</span></td>
                    <td className="table-muted">{new Date(election.startDate).toLocaleDateString()}</td>
                    <td className="table-muted">{new Date(election.endDate).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        {election.status === "upcoming" && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange(election._id, "active")}>
                            <Play size={14} /> Start
                          </button>
                        )}
                        {election.status === "active" && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(election._id, "ended")}>
                            <Square size={13} /> End
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(election)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(election._id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionManagement;