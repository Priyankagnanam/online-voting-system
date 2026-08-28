import { useState, useEffect } from "react";
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
      <h2>Election Management</h2>
      <ErrorMessage message={error} />
      {success && <div className="success-message">{success}</div>}

      <button
        className="btn btn-primary"
        onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setForm({ title: "", description: "", startDate: "", endDate: "" });
        }}
        style={{ marginBottom: "1rem" }}
      >
        {showForm ? "Cancel" : "+ New Election"}
      </button>

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
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update" : "Create"}
            </button>
          </form>
        </div>
      )}

      {elections.length === 0 ? (
        <div className="card"><p>No elections yet.</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((election) => (
                <tr key={election._id}>
                  <td>{election.title}</td>
                  <td><span className={`badge badge-${election.status}`}>{election.status}</span></td>
                  <td style={{ fontSize: "0.85rem" }}>{new Date(election.startDate).toLocaleDateString()}</td>
                  <td style={{ fontSize: "0.85rem" }}>{new Date(election.endDate).toLocaleDateString()}</td>
                  <td>
                    {election.status === "upcoming" && (
                      <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", marginRight: "0.3rem" }} onClick={() => handleStatusChange(election._id, "active")}>Start</button>
                    )}
                    {election.status === "active" && (
                      <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", marginRight: "0.3rem" }} onClick={() => handleStatusChange(election._id, "ended")}>End</button>
                    )}
                    <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", marginRight: "0.3rem" }} onClick={() => handleEdit(election)}>Edit</button>
                    <button className="btn btn-danger" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }} onClick={() => handleDelete(election._id)}>Delete</button>
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

export default ElectionManagement;
