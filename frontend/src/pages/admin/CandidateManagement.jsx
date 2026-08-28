import { useState, useEffect } from "react";
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
      <h2>Candidate Management</h2>
      <ErrorMessage message={error} />
      {success && <div className="success-message">{success}</div>}

      <button
        className="btn btn-primary"
        onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setForm({ name: "", party: "", description: "", electionId: "" });
        }}
        style={{ marginBottom: "1rem" }}
      >
        {showForm ? "Cancel" : "+ Add Candidate"}
      </button>

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
              {editingId ? "Update" : "Add"}
            </button>
          </form>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="card"><p>No candidates yet.</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Party</th>
                <th>Election</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.party}</td>
                  <td>{candidate.electionId?.title || "N/A"}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", marginRight: "0.3rem" }} onClick={() => handleEdit(candidate)}>Edit</button>
                    <button className="btn btn-danger" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }} onClick={() => handleDelete(candidate._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;
