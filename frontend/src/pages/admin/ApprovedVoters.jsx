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
  
  const [inputEmails, setInputEmails] = useState("");
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
      setError(err.response?.data?.error || "Failed to load approved voters list");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoters = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!inputEmails.trim()) return;

    setProcessing(true);
    // Split by comma, newline or space
    const emailList = inputEmails
      .split(/[\n,; \t]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emailList.length === 0) {
      setError("No valid emails found to add.");
      setProcessing(false);
      return;
    }

    try {
      const { data } = await api.post("/admin/approved-voters", { emails: emailList });
      setSuccess(data.message);
      setInputEmails("");
      setPage(1);
      fetchApprovedVoters();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add approved voters");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteVoter = async (id) => {
    if (!window.confirm("Are you sure you want to remove this email from the pre-approved list?")) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await api.delete(`/admin/approved-voters/${id}`);
      setSuccess("Email successfully removed.");
      fetchApprovedVoters();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove email");
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
      // Extract emails using regex
      const emailsFound = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
      if (emailsFound.length === 0) {
        setError("No emails found inside the uploaded file.");
        return;
      }
      setInputEmails(emailsFound.join("\n"));
      setSuccess(`Extracted ${emailsFound.length} email(s) from file. Click 'Save' to approve them.`);
    };
    reader.onerror = () => {
      setError("Error reading file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="page">
      <h2>Voter Pre-Approval List</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Pre-approve voter email addresses. Only users with emails on this list will be allowed to register. If the list is completely empty, any email can register.
      </p>

      {error && <ErrorMessage message={error} />}
      {success && <div className="success-message">{success}</div>}

      <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }}>
        {/* Left Column: Add Voters */}
        <div>
          <div className="card">
            <h3>Add Pre-Approved Voters</h3>
            <form onSubmit={handleAddVoters} style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label>Voter Emails (Comma or newline separated)</label>
                <textarea
                  rows="6"
                  value={inputEmails}
                  onChange={(e) => setInputEmails(e.target.value)}
                  placeholder="voter1@test.com&#10;voter2@test.com"
                  required
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
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={processing}
              >
                {processing ? "Saving..." : "Save Approved Emails"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List & Search */}
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Approved Voters ({total})</h3>
              <input
                type="text"
                placeholder="Search email..."
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
                      <th style={{ textAlign: "left", padding: "0.5rem" }}>Email Address</th>
                      <th style={{ textAlign: "right", padding: "0.5rem" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((voter) => (
                      <tr key={voter._id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.5rem" }}>{voter.email}</td>
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
