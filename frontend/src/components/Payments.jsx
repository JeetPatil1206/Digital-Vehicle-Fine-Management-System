
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [pendingFines, setPendingFines] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fineId, setFineId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  async function loadPayments() {
    setLoading(true);
    setError("");

    try {
      const dashboard = await api.get("/dashboard");
      const admin = dashboard.data?.role === "ADMIN";
      setIsAdmin(admin);

      const paymentResponse = await api.get("/payments");
      setPayments(
        Array.isArray(paymentResponse.data) ? paymentResponse.data : []
      );

      if (!admin) {
        const fineResponse = await api.get("/fines");
        const pending = (Array.isArray(fineResponse.data)
          ? fineResponse.data
          : []
        ).filter(
          (fine) => (fine.status || "").toUpperCase() === "PENDING"
        );

        setPendingFines(pending);
      } else {
        setPendingFines([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Unable to load payments (HTTP ${err.response?.status || "Network Error"}).`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handlePayment(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!fineId) {
      setError("Please select a pending fine.");
      return;
    }

    setPaying(true);

    try {
      const response = await api.post("/payments", {
        fineId: Number(fineId),
        paymentMethod,
      });

      setMessage(
        `Demo payment successful! Transaction reference: ${
          response.data?.transactionReference || "Created"
        }`
      );
      setFineId("");

      await loadPayments();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Payment failed (HTTP ${err.response?.status || "Network Error"}).`
      );
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h2>{isAdmin ? "Payment Management" : "Payments"}</h2>
          <p>
            {isAdmin
              ? "View payment records for all registered vehicles."
              : "Pay pending fines and view your payment history."}
          </p>
        </div>

        <button onClick={loadPayments} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {!isAdmin && !loading && pendingFines.length > 0 && (
        <div className="content-card">
          <h3>Pay a Pending Fine</h3>
          <p>Select one of your pending fines to make a demo payment.</p>

          <form onSubmit={handlePayment}>
            <div className="form-group">
              <label htmlFor="fineId">Select Fine</label>
              <select
                id="fineId"
                value={fineId}
                onChange={(event) => setFineId(event.target.value)}
                required
              >
                <option value="">Choose a pending fine</option>
                {pendingFines.map((fine) => (
                  <option key={fine.fineId} value={fine.fineId}>
                    Fine #{fine.fineId} — {fine.vehicleNumber || "Vehicle"} — ₹
                    {Number(fine.fineAmount || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="UPI">UPI (Demo)</option>
                <option value="CARD">Card (Demo)</option>
                <option value="NET_BANKING">Net Banking (Demo)</option>
                <option value="CASH">Cash (Demo)</option>
              </select>
            </div>

            <button type="submit" disabled={paying}>
              {paying ? "Processing..." : "Pay Fine"}
            </button>
          </form>
          <p>Demo only: no real money will be transferred.</p>
        </div>
      )}

      {!isAdmin && !loading && pendingFines.length === 0 && (
        <div className="empty-state">
          <h3>No pending fines</h3>
          <p>You have no fines awaiting payment.</p>
        </div>
      )}

      {loading && <p>Loading payment records...</p>}

      {!loading && !error && payments.length === 0 && (
        <div className="empty-state">
          <h3>No payment records found</h3>
          <p>Completed payment records will appear here.</p>
        </div>
      )}

      {!loading && payments.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Fine ID</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction Reference</th>
                <th>Status</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>{payment.paymentId}</td>
                  <td>{payment.fineId}</td>
                  <td>{payment.vehicleNumber || "—"}</td>
                  <td>
                    ₹{Number(payment.amount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>{payment.paymentMethod || "—"}</td>
                  <td>{payment.transactionReference || "—"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        (payment.paymentStatus || "unknown").toLowerCase()
                      }`}
                    >
                      {payment.paymentStatus || "UNKNOWN"}
                    </span>
                  </td>
                  <td>
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleString("en-IN")
                      : "—"}
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
