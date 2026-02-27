import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import DashboardView from "./DashboardView.jsx";
import { buildApiUrl } from "../lib/api.js";
import "../styles/App.css";

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadUsers = async () => {
        setError("");
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(buildApiUrl("/api/admin/users"), {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : ""
                }
            });
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al cargar usuarios");
            }
            setUsers(Array.isArray(data) ? data : []);
            if (!selectedUser && Array.isArray(data) && data.length > 0) {
                setSelectedUser(data[0]);
            }
        } catch (err) {
            setError(err?.message || "Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div className="dashboard-shell">
            <Navbar />
            <main className="admin-page">
                <header className="admin-header">
                    <h1>Dashboard Administrador</h1>
                    <p>Selecciona un usuario para ver su dashboard.</p>
                </header>
                {error ? <div className="dashboard-error">{error}</div> : null}
                {loading ? <div className="dashboard-loading">Cargando usuarios...</div> : null}
                <section className="admin-user-list">
                    {users.length === 0 && !loading ? (
                        <div className="admin-empty">No hay usuarios disponibles.</div>
                    ) : (
                        users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                className={`admin-user-btn ${selectedUser?.id === user.id ? "active" : ""}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                <div className="admin-user-name">{user.username}</div>
                                <div className="admin-user-email">{user.email}</div>
                                <span className="admin-user-role">{user.role}</span>
                            </button>
                        ))
                    )}
                </section>
                {selectedUser ? (
                    <section className="admin-dashboard-view">
                        <div className="admin-selected-label">
                            Dashboard de {selectedUser.username}
                        </div>
                        <DashboardView
                            viewUserId={selectedUser.id}
                            readOnly
                            showNavbar={false}
                        />
                    </section>
                ) : null}
            </main>
        </div>
    );
}

export default AdminDashboard;
