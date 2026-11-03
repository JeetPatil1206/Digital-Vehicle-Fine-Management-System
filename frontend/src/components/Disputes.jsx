
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [pendingFines, setPendingFines] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [fineId, setFineId] = useState("");
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const [reviewingId, setReviewingId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("ACCEPTED");
  const [adminResponse, setAdminResponse] = useState("");

  async function loadDisputes() {
    setLoading(true);
    setError("");

    try {
      const dashboard = await api.get("/dashboard");
      const admin = dashboard.data?.role === "ADMIN";
      setIsAdmin(admin);

      const response = await api.get("/disputes");
      setDisputes(Array.isArray(response.data) ? response.data : []);

      if (!admin) {
        const fineResponse = await api.get("/fines");
        const paidOrPending = (Array.isArray(fineResponse.data)
          ? fineResponse.data
          : []
        ).filter(
          (fine) =>
            !["CANCELLED", "VOID"].includes(
              (fine.status || "").toUpperCase()
            )
        );

        setPendingFines(paidOrPending);
      } else {
        setPendingFines([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Unable to load disputes (HTTP ${err.response?.status || "Network Error"}).`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDisputes();
  }, []);

  async function handleSubmitDispute(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!fineId || !reason.trim()) {
      setError("Select a fine and enter the reason for your dispute.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        fineId: Number(fineId),
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim() || null,
      };

      await api.post("/disputes", payload);

      setMessage("Dispute submitted successfully!");
      setFineId("");
      setReason("");
      setEvidenceUrl("");
      setShowForm(false);

      await loadDisputes();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Unable to submit dispute (HTTP ${err.response?.status || "Network Error"}).`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReview(disputeId) {
    setError("");
    setMessage("");

    if (!adminResponse.trim()) {
      setError("Enter an explanation for your decision.");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/disputes/${disputeId}/review`, {
        status: reviewStatus,
        adminResponse: adminResponse.trim(),
      });

      setMessage(`Dispute #${disputeId} reviewed successfully.`);
      setReviewingId(null);
      setAdminResponse("");

      await loadDisputes();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Unable to review dispute (HTTP ${err.response?.status || "Network Error"}).`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h2>{isAdmin ? "Dispute Management" : "My Disputes"}</h2>
          <p>
            {isAdmin
              ? "Review disputes submitted by vehicle owners."
              : "Submit a dispute against a fine and track its review status."}
          </p>
        </div>

        <div className="button-group">
          {!isAdmin && (
            <button onClick={() => {
              setShowForm(!showForm);
              setError("");
              setMessage("");
            }}>
              {showForm ? "Cancel" : "+ Raise Dispute"}
            </button>
          )}

          <button onClick={loadDisputes} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {!isAdmin && showForm && (
        <div className="content-card">
          <h3>Raise a Dispute</h3>

          <form onSubmit={handleSubmitDispute}>
            <div className="form-group">
              <label htmlFor="fineId">Select Fine</label>
              <select
                id="fineId"
                value={fineId}
                onChange={(event) => setFineId(event.target.value)}
                required
              >
                <option value="">Choose a fine</option>
                {pendingFines.map((fine) => (
                  <option key={fine.fineId} value={fine.fineId}>
                    Fine #{fine.fineId} — {fine.vehicleNumber || "Vehicle"} —
                    {" "}₹{Number(fine.fineAmount || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Dispute</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why you believe this fine is incorrect."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="evidenceUrl">Evidence URL (optional)</label>
              <input
                id="evidenceUrl"
                type="url"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
                placeholder="https://example.com/evidence"
              />
            </div>

            <button type="submit" disabled={saving || pendingFines.length === 0}>
              {saving ? "Submitting..." : "Submit Dispute"}
            </button>

            {pendingFines.length === 0 && (
              <p>You have no eligible fines available to select.</p>
            )}
          </form>
        </div>
      )}

      {loading && <p>Loading disputes...</p>}

      {!loading && !error && disputes.length === 0 && (
        <div className="empty-state">
          <h3>No disputes found</h3>
          <p>
            {isAdmin
              ? "Owner-submitted disputes will appear here."
              : "Your submitted disputes will appear here."}
          </p>
        </div>
      )}

      {!loading && disputes.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Dispute ID</th>
                <th>Fine ID</th>
                <th>Vehicle</th>
                {isAdmin && <th>Owner ID</th>}
                <th>Reason</th>
                <th>Status</th>
                <th>Admin Response</th>
                <th>Submitted At</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {disputes.map((dispute) => (
                <>
                  <tr key={dispute.disputeId}>
                    <td>{dispute.disputeId}</td>
                    <td>{dispute.fineId}</td>
                    <td>{dispute.vehicleNumber || "—"}</td>
                    {isAdmin && <td>{dispute.userId}</td>}
                    <td>
                      {dispute.reason}
                      {dispute.evidenceUrl && (
                        <div>
                          <a
                            href={dispute.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View evidence
                          </a>
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${(dispute.status || "open").toLowerCase()}`}
                      >
                        {dispute.status || "OPEN"}
                      </span>
                    </td>
                    <td>{dispute.adminResponse || "Awaiting review"}</td>
                    <td>
                      {dispute.createdAt
                        ? new Date(dispute.createdAt).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    {isAdmin && (
                      <td>
                        {["OPEN", "PENDING"].includes(
                          (dispute.status || "").toUpperCase()
                        ) ? (
                          <button
                            onClick={() => {
                              setReviewingId(
                                reviewingId === dispute.disputeId
                                  ? null
                                  : dispute.disputeId
                              );
                              setReviewStatus("ACCEPTED");
                              setAdminResponse("");
                              setError("");
                            }}
                          >
                            {reviewingId === dispute.disputeId
                              ? "Cancel"
                              : "Review"}
                          </button>
                        ) : (
                          "Reviewed"
                        )}
                      </td>
                    )}
                  </tr>

                  {isAdmin && reviewingId === dispute.disputeId && (
                    <tr key={`review-${dispute.disputeId}`}>
                      <td colSpan={9}>
                        <div className="content-card">
                          <h3>Review Dispute #{dispute.disputeId}</h3>

                          <div className="form-group">
                            <label htmlFor={`status-${dispute.disputeId}`}>
                              Decision
                            </label>
                            <select
                              id={`status-${dispute.disputeId}`}
                              value={reviewStatus}
                              onChange={(event) =>
                                setReviewStatus(event.target.value)
                              }
                            >
                              <option value="ACCEPTED">Accept Dispute</option>
                              <option value="REJECTED">Reject Dispute</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label htmlFor={`response-${dispute.disputeId}`}>
                              Admin Response
                            </label>
                            <textarea
                              id={`response-${dispute.disputeId}`}
                              value={adminResponse}
                              onChange={(event) =>
                                setAdminResponse(event.target.value)
                              }
                              placeholder="Explain the decision to the owner."
                              rows="3"
                            />
                          </div>

                          <button
                            onClick={() => handleReview(dispute.disputeId)}
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Submit Review"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
