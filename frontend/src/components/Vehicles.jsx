
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editNumber, setEditNumber] = useState("");
  const [editType, setEditType] = useState("Car");

  // Load the correct vehicle list for the logged-in role.
  async function loadVehicles() {
    setLoading(true);
    setError("");

    try {
      const dashboardResponse = await api.get("/dashboard");
      const admin = dashboardResponse.data.role === "ADMIN";

      setIsAdmin(admin);

      const response = await api.get(
        admin ? "/admin/vehicles" : "/vehicles"
      );

      setVehicles(response.data);
    } catch (err) {
      console.error("Vehicles API error:", err.response?.data);

      setError(
        `Failed to load vehicles (HTTP ${
          err.response?.status || "Network Error"
        }).`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  // Register a vehicle for the logged-in owner.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const number = vehicleNumber.trim().toUpperCase();

    if (!number) {
      setError("Please enter a vehicle number.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/vehicles", {
        vehicleNumber: number,
        vehicleType,
      });

      setMessage("Vehicle registered successfully!");
      setVehicleNumber("");
      setVehicleType("Car");
      setShowForm(false);

      await loadVehicles();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          `Unable to register vehicle (HTTP ${
            err.response?.status || "Network Error"
          }).`
      );
    } finally {
      setSaving(false);
    }
  }

  // Start editing a vehicle.
  function startEditing(vehicle) {
    setEditingId(vehicle.vehicleId);
    setEditNumber(vehicle.vehicleNumber);
    setEditType(vehicle.vehicleType || "Car");
    setError("");
    setMessage("");
  }

  // Save admin changes.
  async function handleUpdate(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const number = editNumber.trim().toUpperCase();

    if (!number || !editType.trim()) {
      setError("Vehicle number and type are required.");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/admin/vehicles/${editingId}`, {
        vehicleNumber: number,
        vehicleType: editType,
      });

      setMessage("Vehicle updated successfully!");
      setEditingId(null);

      await loadVehicles();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          `Unable to update vehicle (HTTP ${
            err.response?.status || "Network Error"
          }).`
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete a vehicle as an admin.
  async function handleDelete(vehicle) {
    const confirmed = window.confirm(
      `Delete vehicle ${vehicle.vehicleNumber}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/vehicles/${vehicle.vehicleId}`);

      setMessage("Vehicle deleted successfully!");
      await loadVehicles();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          `Unable to delete vehicle (HTTP ${
            err.response?.status || "Network Error"
          }). The vehicle may have related records.`
      );
    }
  }

  return (
    <section className="content-card">
      <div className="card-heading">
        <h2>{isAdmin ? "Manage Vehicles" : "My Vehicles"}</h2>
        <p>
          {isAdmin
            ? "View and manage registered vehicles."
            : "Register and manage your vehicles."}
        </p>
      </div>

      <div className="vehicle-actions">
        {!isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setMessage("");
            }}
          >
            {showForm ? "Cancel" : "+ Add Vehicle"}
          </button>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={loadVehicles}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && (
        <p className="success-message">{message}</p>
      )}

      {error && (
        <p className="auth-error">{error}</p>
      )}

      {showForm && !isAdmin && (
        <form
          className="vehicle-form"
          onSubmit={handleSubmit}
        >
          <h3>Register a New Vehicle</h3>

          <label htmlFor="vehicleNumber">
            Vehicle Number
          </label>

          <input
            id="vehicleNumber"
            type="text"
            placeholder="e.g. MH02AB1234"
            value={vehicleNumber}
            onChange={(event) =>
              setVehicleNumber(event.target.value.toUpperCase())
            }
            maxLength={15}
            required
          />

          <label htmlFor="vehicleType">
            Vehicle Type
          </label>

          <select
            id="vehicleType"
            value={vehicleType}
            onChange={(event) =>
              setVehicleType(event.target.value)
            }
            required
          >
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="Scooter">Scooter</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
            <option value="Other">Other</option>
          </select>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Registering..." : "Register Vehicle"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <p>
          {isAdmin
            ? "No registered vehicles found."
            : "No vehicles registered yet. Click Add Vehicle to register your first vehicle."}
        </p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Vehicle Number</th>
                <th>Vehicle Type</th>
                {isAdmin && <th>Owner</th>}
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.vehicleId}>
                  <td>{vehicle.vehicleId}</td>

                  <td>
                    {editingId === vehicle.vehicleId ? (
                      <input
                        value={editNumber}
                        onChange={(event) =>
                          setEditNumber(
                            event.target.value.toUpperCase()
                          )
                        }
                        maxLength={15}
                        required
                      />
                    ) : (
                      vehicle.vehicleNumber
                    )}
                  </td>

                  <td>
                    {editingId === vehicle.vehicleId ? (
                      <select
                        value={editType}
                        onChange={(event) =>
                          setEditType(event.target.value)
                        }
                      >
                        <option value="Car">Car</option>
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Truck">Truck</option>
                        <option value="Bus">Bus</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      vehicle.vehicleType
                    )}
                  </td>

                  {isAdmin && (
                    <td>
                      {vehicle.ownerName ||
                        `Owner ID: ${vehicle.ownerId}`}
                    </td>
                  )}

                  {isAdmin && (
                    <td>
                      {editingId === vehicle.vehicleId ? (
                        <>
                          <button
                            type="button"
                            className="primary-button"
                            disabled={saving}
                            onClick={handleUpdate}
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => startEditing(vehicle)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => handleDelete(vehicle)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
