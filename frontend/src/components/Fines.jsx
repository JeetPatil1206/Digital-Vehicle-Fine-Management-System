
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [vehicleId, setVehicleId] = useState("");
  const [violationType, setViolationType] = useState("");
  const [description, setDescription] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function loadFines() {
    setLoading(true);
    setError("");

    try {
      const dashboard = await api.get("/dashboard");
      const admin = dashboard.data?.role === "ADMIN";
      setIsAdmin(admin);

      const response = await api.get("/fines");
      setFines(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        `Unable to load fines (HTTP ${err.response?.status || "Network Error"}).`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFines();
  }, []);

  async function handleCreateFine(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !vehicleId.trim() ||
      !violationType.trim() ||
      !fineAmount ||
      Number(fineAmount) <= 0
    ) {
      setError("Enter a vehicle ID, violation type, and positive fine amount.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        vehicleId: Number(vehicleId),
        violationType: violationType.trim(),
        description: description.trim(),
        fineAmount: Number(fineAmount),
      };

      if (dueDate) payload.dueDate = dueDate;

      await api.post("/fines", payload);

      setMessage("Fine created successfully!");
      setVehicleId("");
      setViolationType("");
      setDescription("");
      setFineAmount("");
      setDueDate("");
      setShowForm(false);

      await loadFines();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Unable to create fine (HTTP ${err.response?.status || "Network Error"}).`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h2>{isAdmin ? "Fine Management" : "My Fines"}</h2>
          <p>
            {isAdmin
              ? "View all fines and issue fines for registered vehicles."
              : "View traffic fines and payment status for your vehicles."}
          </p>
        </div>

        <div className="button-group">
          {isAdmin && (
            <button onClick={() => {
              setShowForm(!showForm);
              setError("");
              setMessage("");
            }}>
              {showForm ? "Cancel" : "+ Create Fine"}
            </button>
          )}

          <button onClick={loadFines} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {isAdmin && showForm && (
        <div className="content-card">
          <h3>Create New Fine</h3>

          <form onSubmit={handleCreateFine}>
            <div className="form-group">
              <label htmlFor="vehicleId">Vehicle ID</label>
              <input
                id="vehicleId"
                type="number"
                min="1"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="Enter registered vehicle ID"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="violationType">Violation Type</label>
              <input
                id="violationType"
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
                placeholder="e.g. Signal Jump"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter details of the traffic violation"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fineAmount">Fine Amount (₹)</label>
              <input
                id="fineAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="e.g. 500"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date (optional)</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Fine"}
            </button>
          </form>
        </div>
      )}

      {!loading && !error && fines.length === 0 && (
        <div className="empty-state">
          <h3>No fines found</h3>
          <p>
            {isAdmin
              ? "Create a fine to see it listed here."
              : "Fines associated with your vehicles will appear here."}
          </p>
        </div>
      )}

      {!loading && fines.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fine ID</th>
                <th>Vehicle</th>
                <th>Violation</th>
                <th>Amount</th>
                <th>Issued At</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {fines.map((fine) => (
                <tr key={fine.fineId}>
                  <td>{fine.fineId}</td>
                  <td>{fine.vehicleNumber || "—"}</td>
                  <td>
                    <strong>{fine.violationType || "—"}</strong>
                    {fine.description && <div>{fine.description}</div>}
                  </td>
                  <td>
                    ₹{Number(fine.fineAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {fine.issuedAt
                      ? new Date(fine.issuedAt).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td>{fine.dueDate || "—"}</td>
                  <td>
                    <span
                      className={`status-badge ${(fine.status || "pending").toLowerCase()}`}
                    >
                      {fine.status || "UNKNOWN"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
