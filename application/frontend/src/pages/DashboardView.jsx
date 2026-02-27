import "../styles/App.css";
import Navbar from "../components/Navbar.jsx";
import ButtonComponent from "../components/ButtonComponent.jsx";
import { buildApiUrl } from "../lib/api.js";
import { useEffect, useState } from "react";

function decodeJwtPayload(token) {
    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(normalized);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function DashboardView() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [typeFilterOpen, setTypeFilterOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [form, setForm] = useState({
        type: "income",
        category: "",
        amount: "",
        description: "",
        date: ""
    });

    const fetchTransactions = async () => {
        setError("");
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(buildApiUrl("/api/transactions"), {
                headers: {
                    Authorization: token ? `Bearer ${token}` : ""
                }
            });
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al cargar transacciones");
            }
            setTransactions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || "Error al cargar transacciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const payload = token ? decodeJwtPayload(token) : null;
        setCurrentUserId(payload?.userId ?? payload?.id ?? null);
        fetchTransactions();
    }, []);

    const handleDelete = async (txId) => {
        if (!txId) return;
        const confirmed = window.confirm("¿Eliminar esta transacción?");
        if (!confirmed) return;

        setError("");
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(buildApiUrl(`/api/transactions/${txId}`), {
                method: "DELETE",
                headers: {
                    Authorization: token ? `Bearer ${token}` : ""
                }
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al eliminar transacción");
            }

            // Optimistic UI update
            setTransactions((prev) => prev.filter((tx) => tx.id !== txId));
        } catch (err) {
            setError(err?.message || "Error al eliminar transacción");
        }
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        setCreateError("");
        setCreating(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(buildApiUrl("/api/transactions"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : ""
                },
                body: JSON.stringify({
                    type: form.type,
                    category: form.category,
                    amount: Number(form.amount),
                    description: form.description,
                    date: form.date
                })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al crear transacción");
            }
            setShowForm(false);
            setForm({
                type: "income",
                category: "",
                amount: "",
                description: "",
                date: ""
            });
            await fetchTransactions();
        } catch (err) {
            setCreateError(err?.message || "Error al crear transacción");
        } finally {
            setCreating(false);
        }
    };

    const filteredTransactions =
        typeFilter === "all"
            ? transactions
            : transactions.filter((tx) => tx.type === typeFilter);

    return (
        <div>
            <Navbar />
            <main className="page">
                <div style={{ width: "100%" }}>
                    <section className="action-section">
                        <div className="action-bar">
                            <ul className="action-bar-list" style={{ gap: "1.4em" }}>
                                <li>
                                    <span style={{ color: "white", marginRight: "8px" }}>
                                        SORT<br />BY:
                                    </span>
                                </li>
                                <li>
                                    <ButtonComponent
                                        className="sort-date-btn"
                                        text="Date"
                                        onClick={() => console.log("Ordenando por fecha")}
                                    />
                                </li>
                                <li>
                                    <div className="type-filter">
                                        <ButtonComponent
                                            className="sort-type-btn"
                                            text={
                                                typeFilter === "all"
                                                    ? "Type"
                                                    : `Type: ${typeFilter}`
                                            }
                                            onClick={() =>
                                                setTypeFilterOpen((prev) => !prev)
                                            }
                                        />
                                        {typeFilterOpen ? (
                                            <div className="type-filter-menu">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTypeFilter("income");
                                                        setTypeFilterOpen(false);
                                                    }}
                                                >
                                                    income
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTypeFilter("expense");
                                                        setTypeFilterOpen(false);
                                                    }}
                                                >
                                                    expense
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTypeFilter("all");
                                                        setTypeFilterOpen(false);
                                                    }}
                                                >
                                                    all
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </li>
                            </ul>
                            <ButtonComponent
                                className="add-btn"
                                text="+"
                                onClick={() => setShowForm(true)}
                            />
                        </div>
                    </section>
                    <section className="dashboard-panel">
                        <div className="dashboard-header">
                            <span>Transactions</span>
                            {loading ? <span className="muted">Cargando...</span> : null}
                        </div>
                        {error ? <div className="dashboard-error">{error}</div> : null}
                        <div className="table-wrap">
                            <table className="transactions-table">
                                <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredTransactions.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan="6" className="empty-row">
                                            No transactions yet.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td>
                                                {tx.date
                                                    ? new Date(tx.date).toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td>{tx.type || "-"}</td>
                                            <td>{tx.category || "-"}</td>
                                            <td>{tx.amount ?? "-"}</td>
                                            <td>{tx.description || "-"}</td>
                                            <td>
                                                {currentUserId != null && Number(tx.user_id) === Number(currentUserId) ? (
                                                    <button
                                                        type="button"
                                                        className="tx-delete-btn"
                                                        onClick={() => handleDelete(tx.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    {showForm ? (
                        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
                            <form
                                className="modal-card"
                                onSubmit={handleCreate}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <h2>Nueva transacción</h2>
                                <div className="modal-row">
                                    <label>Type</label>
                                    <select name="type" value={form.type} onChange={handleFormChange}>
                                        <option value="income">income</option>
                                        <option value="expense">expense</option>
                                    </select>
                                </div>
                                <div className="modal-row">
                                    <label>Category</label>
                                    <input
                                        name="category"
                                        value={form.category}
                                        onChange={handleFormChange}
                                        placeholder="categoria"
                                        required
                                    />
                                </div>
                                <div className="modal-row">
                                    <label>Amount</label>
                                    <input
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={handleFormChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="modal-row">
                                    <label>Description</label>
                                    <input
                                        name="description"
                                        value={form.description}
                                        onChange={handleFormChange}
                                        placeholder="descripcion"
                                    />
                                </div>
                                <div className="modal-row">
                                    <label>Date</label>
                                    <input
                                        name="date"
                                        type="date"
                                        value={form.date}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                {createError ? (
                                    <div className="dashboard-error">{createError}</div>
                                ) : null}
                                <div className="modal-actions">
                                    <ButtonComponent
                                        text="Cancelar"
                                        onClick={() => setShowForm(false)}
                                        type="button"
                                        style={{ backgroundColor: "#4a4a4a" }}
                                    />
                                    <ButtonComponent
                                        text={creating ? "Guardando..." : "Guardar"}
                                        type="submit"
                                    />
                                </div>
                            </form>
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}

export default DashboardView;
