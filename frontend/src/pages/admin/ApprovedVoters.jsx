import { useState, useEffect } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/ErrorMessage";

const ApprovedVoters = () => {
  const [voters, setVoters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rollNumberInput, setRollNumberInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApprovedVoters();
  }, [page, search]);

  const fetchApprovedVoters = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/approved-voters?page=${page}&search=${search}`);
      setVoters(data.voters);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load eligible voters list");
    } finally {
      setLoading(false);
    }
  };

  const handleSingleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!rollNumberInput.trim()) return;

    setProcessing(true);
    try {
      const { data } = await api.post("/admin/approved-voters", {
        voters: [
          {
            rollNumber: rollNumberInput.trim().toUpperCase(),
            name: nameInput.trim(),
            email: emailInput.trim().toLowerCase(),
            isEligible: true,
          },
        ],
      });
      setSuccess(data.message);
      setRollNumberInput("");
      setNameInput("");
      setEmailInput("");
      setPage(1);
      fetchApprovedVoters();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add voter");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!bulkInput.trim()) return;

    setProcessing(true);
    const lines = bulkInput.split("\n").filter((l) => l.trim().length > 0);
    try {
      const { data } = await api.post("/admin/approved-voters", { voters: lines });
      setSuccess(data.message);
      setBulkInput("");
      setPage(1);
      fetchApprovedVoters();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to bulk add voters");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleEligibility = async (id) => {
    setError("");
    setSuccess("");
    try {
      const { data } = await api.patch(`/admin/approved-voters/${id}/toggle-eligibility`);
      setSuccess(data.message);
      fetchApprovedVoters();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change eligibility");
    }
  };

  const handleDeleteVoter = async (id) => {
    if (!window.confirm("Are you sure you want to remove this voter from the eligible list?")) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await api.delete(`/admin/approved-voters/${id}`);
      setSuccess("Voter successfully removed.");
      fetchApprovedVoters();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove voter");
    }
  };

  const handleFileUpload = (e) => {
    setError("");
    setSuccess("");
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setBulkInput(text);
      setSuccess("File content loaded into bulk box. Click 'Import Bulk List' to save.");
    };
    reader.onerror = () => {
      setError("Error reading file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="page">
      <h2>Voter Eligibility List</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Only pre-approved voters with an active Voter ID Number on this list are eligible to register and cast a vote.
      </p>

      {error && <ErrorMessage message={error} />}
      {success && <div className="success-message">{success}</div>}

      <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }}>
        {/* Left Column: Add Voters */}
        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3>Add Single Eligible Voter</h3>
            <form onSubmit={handleSingleAdd} style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label>Voter ID Number *</label>
                <input
                  type="text"
                  value={rollNumberInput}
                  onChange={(e) => setRollNumberInput(e.target.value)}
                  placeholder="VOT-2024-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Alice Smith"
                />
              </div>

              <div className="form-group">
                <label>Registered Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="alice@example.com"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={processing}
              >
                {processing ? "Saving..." : "Add Eligible Voter"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>Bulk Add / CSV Import</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Format per line: <code>VoterID, FullName, RegisteredEmail</code>
            </p>
            <form onSubmit={handleBulkAdd}>
              <div className="form-group">
                <textarea
                  rows="5"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="VOT-2024-001, Alice Smith, alice@example.com&#10;VOT-2024-002, Bob Jones, bob@example.com"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="form-group">
                <label>Or Upload CSV/Text File</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={processing}
              >
                {processing ? "Saving..." : "Import Bulk List"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List & Search */}
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Eligible Voters ({total})</h3>
              <input
                type="text"
                placeholder="Search Voter ID / Name / Email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}
              />
            </div>

            {loading && voters.length === 0 ? (
              <Loading message="Loading list..." />
            ) : voters.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                {search ? "No matches found." : "Pre-approval list is currently empty."}
              </p>
            ) : (
              <div>
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Voter ID</th>
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Name / Email</th>
                      <th style={{ textAlign: "center", padding: "0.5rem" }}>Status</th>
                      <th style={{ textAlign: "right", padding: "0.5rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((voter) => (
                      <tr key={voter._id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{voter.rollNumber}</td>
                        <td style={{ padding: "0.5rem", fontSize: "0.9rem" }}>
                          <div>{voter.name || "N/A"}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{voter.email || "No email linked"}</div>
                        </td>
                        <td style={{ textAlign: "center", padding: "0.5rem" }}>
                          <span
                            className="badge"
                            style={{
                              cursor: "pointer",
                              background: voter.isEligible ? "#f0fdf4" : "#fef2f2",
                              color: voter.isEligible ? "var(--success)" : "var(--danger)",
                            }}
                            onClick={() => handleToggleEligibility(voter._id)}
                            title="Click to toggle eligibility"
                          >
                            {voter.isEligible ? "Eligible" : "Ineligible"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", padding: "0.5rem" }}>
                          <button
                            onClick={() => handleDeleteVoter(voter._id)}
                            className="btn btn-danger"
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
                    <button
                      className="btn"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Prev
                    </button>
                    <span style={{ alignSelf: "center" }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovedVoters;
