import { useState, useEffect } from "react";
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
      <h2>Voter Management</h2>
      <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
        {voters.length} registered voter(s)
      </p>

      {voters.length === 0 ? (
        <div className="card">
          <p>No voters registered yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Verified</th>
                <th>Voted</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {voters.map((voter) => (
                <tr key={voter._id}>
                  <td>{voter.name}</td>
                  <td>{voter.email}</td>
                  <td>
                    <span className={`badge ${voter.isVerified ? "badge-active" : "badge-ended"}`}>
                      {voter.isVerified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>{voter.votedElections?.length || 0}</td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {new Date(voter.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ marginRight: "0.5rem", fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                      onClick={() => toggleVerification(voter._id)}
                    >
                      {voter.isVerified ? "Unverify" : "Verify"}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                      onClick={() => deleteUser(voter._id)}
                    >
                      Delete
                    </button>
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

export default VoterManagement;
