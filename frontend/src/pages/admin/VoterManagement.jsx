import { useState, useEffect } from "react";
import {
  Users,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Inbox,
  Vote,
} from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const approvalBadge = (status) => {
  if (status === "APPROVED") return "badge-active";
  if (status === "REJECTED") return "badge-danger";
  return "badge-warning";
};

const votingBadge = (status) => (status === "VOTED" ? "badge-info" : "badge-ended");

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

  const setApproval = async (userId, approvalStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/approval`, { approvalStatus });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update approval status");
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
            Review voter registration and approve or reject access to voting.
          </p>
        </div>
        <span className="chip">
          <Users size={14} /> {voters.length} registered voter(s)
        </span>
      </div>

      {voters.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon"><Inbox size={24} /></span>
            <h3>No voters registered</h3>
            <p>Registered voters will appear here for approval.</p>
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
                  <th>Voter ID</th>
                  <th className="text-center">Approval Status</th>
                  <th className="text-center">Voting Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((voter) => {
                  const isApproved = voter.approvalStatus === "APPROVED";
                  const isRejected = voter.approvalStatus === "REJECTED";
                  return (
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
                      <td className="table-muted">{voter.rollNumber || "—"}</td>
                      <td className="text-center">
                        <span className={`badge ${approvalBadge(voter.approvalStatus)}`}>
                          {voter.approvalStatus === "APPROVED" ? (
                            <><CheckCircle2 size={12} /> Approved</>
                          ) : voter.approvalStatus === "REJECTED" ? (
                            <><XCircle size={12} /> Rejected</>
                          ) : (
                            <><Clock size={12} /> Pending</>
                          )}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${votingBadge(voter.votingStatus)}`}>
                          {voter.votingStatus === "VOTED" ? (
                            <><Vote size={12} /> Voted</>
                          ) : (
                            <><XCircle size={12} /> Not Voted</>
                          )}
                        </span>
                        {voter.votingStatus === "VOTED" && (voter.votedElectionDetails || []).length > 0 && (
                          <span className="field-hint" style={{ display: "block", marginTop: "0.25rem" }}>
                            {voter.votedElectionDetails.map((e) => e.title).join(", ")}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {!isApproved && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => setApproval(voter._id, "APPROVED")}
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setApproval(voter._id, "REJECTED")}
                            >
                              <X size={14} /> Reject
                            </button>
                          )}
                          {isApproved && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggleVerification(voter._id)}
                              title={voter.isVerified ? "Mark email as unverified" : "Mark email as verified"}
                            >
                              <ShieldCheck size={14} />
                              {voter.isVerified ? "Unverify Email" : "Verify Email"}
                            </button>
                          )}
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => deleteUser(voter._id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterManagement;