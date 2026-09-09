import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, UserPlus, Inbox, X } from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    party: "",
    description: "",
    electionId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [candidatesRes, electionsRes] = await Promise.all([
        api.get("/candidates"),
        api.get("/elections"),
      ]);
      setCandidates(candidatesRes.data.candidates);
      setElections(electionsRes.data.elections);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load data");
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
        await api.put(`/candidates/${editingId}`, form);
        setSuccess("Candidate updated");
      } else {
        await api.post("/candidates", form);
        setSuccess("Candidate added");
      }
      setForm({ name: "", party: "", description: "", electionId: "" });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (candidate) => {
    setForm({
      name: candidate.name,
      party: candidate.party,
      description: candidate.description || "",
      electionId: candidate.electionId?._id || candidate.electionId,
    });
    setEditingId(candidate._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    try {
      await api.delete(`/candidates/${id}`);
      setSuccess("Candidate deleted");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  };

  if (loading) return <Loading message="Loading candidates..." />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Candidate Management</h2>
          <p className="page-subtitle">{candidates.length} candidate(s) across all elections.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ name: "", party: "", description: "", electionId: "" });
          }}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Candidate</>}
        </button>
      </div>

      <ErrorMessage message={error} />
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3>{editingId ? "Edit Candidate" : "Add Candidate"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Candidate full name"
              />
            </div>
            <div className="form-group">
              <label>Party</label>
              <input
                type="text"
                value={form.party}
                onChange={(e) => setForm({ ...form, party: e.target.value })}
                placeholder="Independent"
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
            <div className="form-group">
              <label>Election</label>
              <select
                value={form.electionId}
                onChange={(e) => setForm({ ...form, electionId: e.target.value })}
                required
              >
                <option value="">Select Election</option>
                {elections.map((election) => (
                  <option key={election._id} value={election._id}>
                    {election.title} ({election.status})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">
              <UserPlus size={16} />
              {editingId ? "Update" : "Add"}
            </button>
          </form>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon"><Inbox size={24} /></span>
            <h3>No candidates yet</h3>
            <p>Add candidates to your elections to get started.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Party</th>
                  <th>Election</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span className="candidate-avatar" style={{ width: 34, height: 34, fontSize: "0.95rem" }}>
                          {candidate.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                        <span style={{ fontWeight: 600 }}>{candidate.name}</span>
                      </div>
                    </td>
                    <td>{candidate.party}</td>
                    <td className="table-muted">{candidate.electionId?.title || "N/A"}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(candidate)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(candidate._id)}>
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

export default CandidateManagement;