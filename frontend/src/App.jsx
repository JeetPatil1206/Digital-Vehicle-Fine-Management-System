
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Payments from "./components/Payments";
import Disputes from "./components/Disputes";
import Fines from "./components/Fines";
import Vehicles from "./components/Vehicles";

import Login from "./pages/Login";
import Register from "./pages/Register";
import api from "./services/api";

import "./App.css";

// Menu for vehicle owners
const ownerMenuItems = [
  { label: "Dashboard", icon: "▦" },
  { label: "My Vehicles", icon: "🚘" },
  { label: "My Fines", icon: "▤" },
  { label: "Payments", icon: "₹" },
  { label: "Disputes", icon: "⚖" },
];

// Menu for administrators
const adminMenuItems = [
  { label: "Dashboard", icon: "▦" },
  { label: "Manage Vehicles", icon: "🚘" },
  { label: "Manage Fines", icon: "▤" },
  { label: "Payments", icon: "₹" },
  { label: "Disputes", icon: "⚖" },
];

function Dashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState("");

  // Load the saved theme when the dashboard opens.
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  // Save the theme whenever it changes.
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Load the logged-in user's dashboard.
  // Admins also receive administrator statistics.
  useEffect(() => {
    api
      .get("/dashboard")
      .then(async (response) => {
        const userData = response.data;

        setDashboardData(userData);
        setError("");

        if (userData.role === "ADMIN") {
          try {
            const adminResponse = await api.get("/admin/dashboard");

            setDashboardData({
              ...userData,
              ...adminResponse.data,
            });
          } catch {
            setError("Unable to load admin statistics.");
          }
        }
      })
      .catch(() => {
        setError("Unable to load dashboard data from the backend.");
      });
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  const vehicles = dashboardData?.vehicles || [];
  const fines = dashboardData?.fines || [];

  let storedUser = {};

  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    storedUser = {};
  }

  const userName =
    dashboardData?.fullName ||
    storedUser.fullName ||
    "User";

  const userRole =
    dashboardData?.role ||
    storedUser.role ||
    "OWNER";

  const isAdmin = userRole === "ADMIN";

  const menuItems = isAdmin ? adminMenuItems : ownerMenuItems;

  return (
    <div className={`app-layout ${darkMode ? "dark-mode" : "light-mode"}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">V</div>

          <div>
            <h2>FineTrack</h2>
            <span>Vehicle Management</span>
          </div>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${
                activePage === item.label ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.label);
                setError("");
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logged-in user profile */}
        <div className="sidebar-bottom">
          <div className="profile-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{userName}</strong>
            <span>{isAdmin ? "Administrator" : "Vehicle Owner"}</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Vehicle Management / {activePage}
            </p>
            <h1>{activePage}</h1>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="theme-button"
              onClick={() => setDarkMode((current) => !current)}
              aria-label="Switch color theme"
              aria-pressed={darkMode}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>

            <button
              type="button"
              className="primary-button logout-button"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </header>

        {/* Error message */}
        {error && <div className="auth-error">{error}</div>}

        {/* Dashboard page */}
        {activePage === "Dashboard" ? (
          <>
            <section className="welcome-section">
              <div>
                <p className="eyebrow">
                  DIGITAL VEHICLE FINE MANAGEMENT
                </p>

                <h2>Welcome to FineTrack</h2>

                <p>
                  Manage vehicles, traffic fines, and payments in one place.
                </p>
              </div>

              <div className="welcome-icon">🚘</div>
            </section>

            {/* Dashboard statistics */}
            <section className="stats-grid">
              {isAdmin ? (
                <>
                  <StatCard
                    title="Registered Users"
                    value={dashboardData?.totalUsers ?? "—"}
                    icon="👥"
                  />

                  <StatCard
                    title="Total Vehicles"
                    value={dashboardData?.totalVehicles ?? "—"}
                    icon="🚗"
                  />

                  <StatCard
                    title="Total Fines"
                    value={dashboardData?.totalFines ?? "—"}
                    icon="📋"
                  />

                  <StatCard
                    title="Pending Fines"
                    value={dashboardData?.pendingFines ?? "—"}
                    icon="⏳"
                  />

                  <StatCard
                    title="Total Payments"
                    value={dashboardData?.totalPayments ?? "—"}
                    icon="₹"
                  />

                  <StatCard
                    title="Open Disputes"
                    value={dashboardData?.openDisputes ?? "—"}
                    icon="⚖️"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    title="Registered Vehicles"
                    value={dashboardData ? vehicles.length : "—"}
                    icon="🚗"
                  />

                  <StatCard
                    title="Total Fines"
                    value={dashboardData ? fines.length : "—"}
                    icon="📋"
                  />

                  <StatCard
                    title="Pending Amount"
                    value={
                      dashboardData
                        ? fines
                            .filter((fine) => fine.status === "PENDING")
                            .reduce(
                              (sum, fine) =>
                                sum + Number(fine.fineAmount || 0),
                              0
                            )
                            .toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 2,
                            })
                        : "—"
                    }
                    icon="₹"
                  />

                  <StatCard
                    title="Payments Made"
                    value={
                      dashboardData
                        ? fines.filter((fine) => fine.status === "PAID").length
                        : "—"
                    }
                    icon="✓"
                  />
                </>
              )}
            </section>

            {/* Quick access */}
            <section className="content-card">
              <div className="card-heading">
                <h3>Quick Access</h3>
                <p>Select a section to manage your account.</p>
              </div>

              <div className="quick-grid">
                {menuItems.slice(1).map((item) => (
                  <button
                    className="quick-card"
                    key={item.label}
                    onClick={() => {
                      setActivePage(item.label);
                      setError("");
                    }}
                  >
                    <span className="quick-icon">{item.icon}</span>
                    <strong>{item.label}</strong>
                    <span className="quick-arrow">→</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : activePage === "My Vehicles" ||
          activePage === "Manage Vehicles" ? (
          <Vehicles />
        ) : activePage === "My Fines" ||
          activePage === "Manage Fines" ? (
          <Fines />
        ) : activePage === "Payments" ? (
          <Payments />
        ) : activePage === "Disputes" ? (
          <Disputes />
        ) : (
          <section className="content-card placeholder-card">
            <h2>{activePage}</h2>
            <p>Select a section from the sidebar.</p>

            <button
              className="primary-button"
              onClick={() => setActivePage("Dashboard")}
            >
              Back to Dashboard
            </button>
          </section>
        )}

        <footer>Digital Vehicle Fine Management System</footer>
      </main>
    </div>
  );
}

// Reusable statistics card
function StatCard({ title, value, icon }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>

      <strong className="stat-value">{value}</strong>

      <span className="stat-note">From backend data</span>
    </article>
  );
}

// Prevent dashboard access without a login token
function ProtectedDashboard() {
  return localStorage.getItem("token") ? (
    <Dashboard />
  ) : (
    <Navigate to="/login" replace />
  );
}

// Application routes
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
