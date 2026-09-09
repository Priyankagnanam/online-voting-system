import { useState, useEffect } from "react";
import { Users, Trash2, CheckCircle2, XCircle, ShieldCheck, Inbox } from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const VoterManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load voters");
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/verify`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update user");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  if (loading) return <Loading message="Loading voters..." />;
  if (error) return <ErrorMessage message={error} />;

  const voters = users.filter((u) => u.role === "voter");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Voter Management</h2>
          <p className="page-subtitle">
            <span className="chip">
              <Users size={14} /> {voters.length} registered voter(s)
            </span>
          </p>
        </div>
      </div>

      {voters.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon"><Inbox size={24} /></span>
            <h3>No voters registered</h3>
            <p>Registered voters will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Verified</th>
                  <th>Voted</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((voter) => (
                  <tr key={voter._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span className="candidate-avatar" style={{ width: 34, height: 34, fontSize: "0.95rem" }}>
                          {voter.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                        <span style={{ fontWeight: 600 }}>{voter.name}</span>
                      </div>
                    </td>
                    <td className="table-muted">{voter.email}</td>
                    <td>
                      <span className={`badge ${voter.isVerified ? "badge-active" : "badge-ended"}`}>
                        {voter.isVerified ? <><CheckCircle2 size={12} /> Verified</> : <><XCircle size={12} /> Not verified</>}
                      </span>
                    </td>
                    <td>{voter.votedElections?.length || 0}</td>
                    <td className="table-muted">{new Date(voter.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className={`btn btn-sm ${voter.isVerified ? "btn-secondary" : "btn-outline"}`}
                          onClick={() => toggleVerification(voter._id)}
                        >
                          <ShieldCheck size={14} />
                          {voter.isVerified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteUser(voter._id)}
                        >
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

export default VoterManagement;