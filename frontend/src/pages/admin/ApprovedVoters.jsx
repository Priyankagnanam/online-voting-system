import { useState, useEffect } from "react";
import {
  UserPlus,
  Upload,
  Trash2,
  Search,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
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
      <div className="page-header">
        <div>
          <h2>Voter Eligibility List</h2>
          <p className="page-subtitle">
            Only pre-approved voters with an active Voter ID Number on this list are eligible
            to register and cast a vote.
          </p>
        </div>
        <span className="chip">
          <ClipboardCheck size={14} /> {total} eligible
        </span>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <div className="success-message">{success}</div>}

      <div className="grid-2">
        <div className="stack">
          <div className="card">
            <h3>Add Single Eligible Voter</h3>
            <form onSubmit={handleSingleAdd} className="inline-form">
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
                className="btn btn-primary btn-block"
                disabled={processing}
              >
                <UserPlus size={16} />
                {processing ? "Saving..." : "Add Eligible Voter"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>Bulk Add / CSV Import</h3>
            <p className="field-hint">
              Format per line: <code>VoterID, FullName, RegisteredEmail</code>
            </p>
            <form onSubmit={handleBulkAdd} className="inline-form">
              <div className="form-group">
                <textarea
                  rows="5"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={"VOT-2024-001, Alice Smith, alice@example.com\nVOT-2024-002, Bob Jones, bob@example.com"}
                />
              </div>

              <div className="form-group">
                <label>Or Upload CSV/Text File</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary btn-block"
                disabled={processing}
              >
                <Upload size={16} />
                {processing ? "Saving..." : "Import Bulk List"}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ marginBottom: 0 }}>Eligible Voters ({total})</h3>
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search Voter ID / Name / Email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {loading && voters.length === 0 ? (
              <Loading message="Loading list..." />
            ) : voters.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon"><Inbox size={24} /></span>
                <h3>{search ? "No matches found" : "List is empty"}</h3>
                <p>
                  {search
                    ? "Try a different search term."
                    : "Add voters to the pre-approval list to make them eligible."}
                </p>
              </div>
            ) : (
              <div>
                <div className="table-container">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Voter ID</th>
                          <th>Name / Email</th>
                          <th className="text-center">Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voters.map((voter) => (
                          <tr key={voter._id}>
                            <td>
                              <span style={{ fontWeight: 700 }}>{voter.rollNumber}</span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{voter.name || "N/A"}</div>
                              <div className="table-muted" style={{ fontSize: "0.8rem" }}>
                                {voter.email || "No email linked"}
                              </div>
                            </td>
                            <td className="text-center">
                              <span
                                className={`badge ${voter.isEligible ? "badge-success" : "badge-danger"}`}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleToggleEligibility(voter._id)}
                                title="Click to toggle eligibility"
                              >
                                {voter.isEligible ? "Eligible" : "Ineligible"}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  onClick={() => handleDeleteVoter(voter._id)}
                                  className="btn btn-danger btn-sm"
                                >
                                  <Trash2 size={14} /> Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft size={15} /> Prev
                    </button>
                    <span className="pagination-info">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next <ChevronRight size={15} />
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