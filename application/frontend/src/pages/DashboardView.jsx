import "../styles/App.css";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import DashboardTabs from "../components/DashboardTabs.jsx";
import MediaSection from "../components/MediaSection.jsx";
import { buildApiUrl } from "../lib/api.js";

function DashboardView({ viewUserId = null, readOnly = false, showNavbar = true, allowDelete = false }) {
    const [activeView, setActiveView] = useState("movies");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [markModalOpen, setMarkModalOpen] = useState(false);
    const [addContext, setAddContext] = useState({ type: "movies", section: "seen" });
    const [markContext, setMarkContext] = useState({ id: null, title: "", media_type: "" });
    const [formTitle, setFormTitle] = useState("");
    const [formReason, setFormReason] = useState("");
    const [formRating, setFormRating] = useState("");
    const [markRating, setMarkRating] = useState("");
    const [saving, setSaving] = useState(false);
    const [marking, setMarking] = useState(false);
    const canAdd = !readOnly;
    const canMark = !readOnly;
    const canDelete = allowDelete || !readOnly;
    const views = useMemo(
        () => [
            {
                id: "movies",
                label: "Películas",
                sections: [
                    {
                        id: "seen-movies",
                        title: "Películas Vistas",
                        addLabel: "Agregar película",
                        tables: [
                            { title: "Me encantó", columns: ["Título", "Acciones"] },
                            { title: "Me gustó", columns: ["Título", "Acciones"] },
                            { title: "No me gustó", columns: ["Título", "Acciones"] }
                        ]
                    },
                    {
                        id: "watchlist-movies",
                        title: "Películas por ver",
                        addLabel: "Agregar película",
                        tables: [
                            { title: null, columns: ["Título", "Razón", "Acciones"] }
                        ]
                    }
                ]
            },
            {
                id: "series",
                label: "Series",
                sections: [
                    {
                        id: "seen-series",
                        title: "Series Vistas",
                        addLabel: "Agregar serie",
                        tables: [
                            { title: "Me encantó", columns: ["Título", "Acciones"] },
                            { title: "Me gustó", columns: ["Título", "Acciones"] },
                            { title: "No me gustó", columns: ["Título", "Acciones"] }
                        ]
                    },
                    {
                        id: "watchlist-series",
                        title: "Series por ver",
                        addLabel: "Agregar serie",
                        tables: [
                            { title: null, columns: ["Título", "Razón", "Acciones"] }
                        ]
                    }
                ]
            },
            {
                id: "games",
                label: "Juegos",
                sections: [
                    {
                        id: "seen-games",
                        title: "Juegos Jugados",
                        addLabel: "Agregar juego",
                        tables: [
                            { title: "Me encantó", columns: ["Título", "Acciones"] },
                            { title: "Me gustó", columns: ["Título", "Acciones"] },
                            { title: "No me gustó", columns: ["Título", "Acciones"] }
                        ]
                    },
                    {
                        id: "watchlist-games",
                        title: "Juegos por jugar",
                        addLabel: "Agregar juego",
                        tables: [
                            { title: null, columns: ["Título", "Razón", "Acciones"] }
                        ]
                    }
                ]
            }
        ],
        []
    );

    const activeContent = views.find((view) => view.id === activeView);
    const typeMap = { movies: "movie", series: "series", games: "game" };

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const loadItems = async () => {
        setError("");
        setLoading(true);
        try {
            const params = viewUserId ? `?user_id=${encodeURIComponent(viewUserId)}` : "";
            const response = await fetch(buildApiUrl(`/api/media${params}`), {
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                }
            });
            const data = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al cargar items");
            }
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || "Error al cargar items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [viewUserId]);

    const openAddModal = (sectionId) => {
        if (!canAdd) return;
        const section = sectionId.includes("watchlist") ? "watchlist" : "seen";
        const type = sectionId.includes("movies")
            ? "movies"
            : sectionId.includes("series")
                ? "series"
                : "games";
        setError("");
        setAddContext({ type, section });
        setFormTitle("");
        setFormReason("");
        setFormRating("");
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setError("");
        setAddModalOpen(false);
    };

    const handleCreate = async () => {
        if (!canAdd) return;
        if (!formTitle.trim()) return;
        if (addContext.section === "seen" && !formRating) {
            setError("Selecciona una calificación");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const payload = {
                title: formTitle.trim(),
                media_type: typeMap[addContext.type],
                status: addContext.section === "watchlist" ? "watchlist" : "seen",
                rating: addContext.section === "seen" ? formRating : null,
                reason: addContext.section === "watchlist" ? formReason.trim() : null
            };

            const response = await fetch(buildApiUrl("/api/media"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al guardar");
            }
            setAddModalOpen(false);
            await loadItems();
        } catch (err) {
            setError(err?.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row) => {
        if (!canDelete) return;
        if (!row?.id) return;
        const confirmed = window.confirm(`¿Eliminar "${row.title}"?`);
        if (!confirmed) return;
        setError("");
        try {
            const response = await fetch(buildApiUrl(`/api/media/${row.id}`), {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                }
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al eliminar");
            }
            await loadItems();
        } catch (err) {
            setError(err?.message || "Error al eliminar");
        }
    };

    const openMarkSeenModal = (row) => {
        if (!canMark) return;
        setError("");
        setMarkContext({
            id: row.id,
            title: row.title,
            media_type: row.media_type
        });
        setMarkRating("");
        setMarkModalOpen(true);
    };

    const handleMarkSeen = async () => {
        if (!canMark) return;
        if (!markContext.id) return;
        if (!markRating) {
            setError("Selecciona una calificación");
            return;
        }
        setMarking(true);
        setError("");
        try {
            const response = await fetch(buildApiUrl(`/api/media/${markContext.id}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ status: "seen", rating: markRating })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.error || data?.message || "Error al actualizar");
            }
            setMarkModalOpen(false);
            await loadItems();
        } catch (err) {
            setError(err?.message || "Error al actualizar");
        } finally {
            setMarking(false);
        }
    };

    const activeItems = items.filter((item) => {
        const normalizedType =
            item.media_type === "movie"
                ? "movies"
                : item.media_type === "series"
                    ? "series"
                    : "games";
        return normalizedType === activeView;
    });

    const buildTablesForSection = (sectionId, sectionType) => {
        const sectionItems =
            sectionType === "watchlist"
                ? activeItems.filter((item) => item.status === "watchlist")
                : activeItems.filter((item) => item.status === "seen");

        if (sectionType === "watchlist") {
            return [
                {
                    title: null,
                    columns: ["Título", "Razón", "Acciones"],
                    rows: sectionItems.map((item) => ({
                        id: item.id,
                        title: item.title,
                        reason: item.reason,
                        media_type: item.media_type
                    })),
                    isWatchlist: true
                }
            ];
        }

        const buckets = [
            { title: "Me encantó", rating: "loved" },
            { title: "Me gustó", rating: "liked" },
            { title: "No me gustó", rating: "disliked" }
        ];

        return buckets.map((bucket) => ({
            title: bucket.title,
            columns: ["Título", "Acciones"],
            rows: sectionItems
                .filter((item) => item.rating === bucket.rating)
                .map((item) => ({
                    id: item.id,
                    title: item.title,
                    media_type: item.media_type
                })),
            isWatchlist: false
        }));
    };

    return (
        <div className="dashboard-shell">
            {showNavbar ? <Navbar /> : null}
            <main className="dashboard-page">
                <header className="dashboard-hero">
                    <h1>Gestor de Medios</h1>
                    <DashboardTabs
                        tabs={views}
                        active={activeView}
                        onChange={setActiveView}
                    />
                </header>
                {error ? <div className="dashboard-error">{error}</div> : null}
                {loading ? <div className="dashboard-loading">Cargando...</div> : null}
                <section className="dashboard-body">
                    {activeContent?.sections.map((section) => (
                        <MediaSection
                            key={section.id}
                            {...section}
                            tables={buildTablesForSection(section.id, section.id.includes("watchlist") ? "watchlist" : "seen")}
                            onAddClick={openAddModal}
                            onDelete={handleDelete}
                            onMarkSeen={openMarkSeenModal}
                            canAdd={canAdd}
                            canDelete={canDelete}
                            canMark={canMark}
                        />
                    ))}
                </section>
                {canAdd && addModalOpen ? (
                    <div className="dashboard-modal-backdrop" onClick={closeAddModal}>
                        <div
                            className="dashboard-modal"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <h2 className="dashboard-modal-title">
                                {addContext.section === "watchlist"
                                    ? `Agregar ${addContext.type === "movies" ? "Película" : addContext.type === "series" ? "Serie" : "Juego"} a por ver`
                                    : `Agregar ${addContext.type === "movies" ? "Película" : addContext.type === "series" ? "Serie" : "Juego"} a vistas`}
                            </h2>
                            <input
                                className="dashboard-input"
                                placeholder="Nombre"
                                value={formTitle}
                                onChange={(event) => setFormTitle(event.target.value)}
                            />
                            {addContext.section === "watchlist" ? (
                                <input
                                    className="dashboard-input"
                                    placeholder="Razón por ver"
                                    value={formReason}
                                    onChange={(event) => setFormReason(event.target.value)}
                                />
                            ) : (
                                <div className="dashboard-rating">
                                    <p>Calificación:</p>
                                    <label>
                                        <input
                                            type="radio"
                                            name="rating"
                                            value="loved"
                                            checked={formRating === "loved"}
                                            onChange={(event) => setFormRating(event.target.value)}
                                        />
                                        Me encantó
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="rating"
                                            value="liked"
                                            checked={formRating === "liked"}
                                            onChange={(event) => setFormRating(event.target.value)}
                                        />
                                        Me gustó
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="rating"
                                            value="disliked"
                                            checked={formRating === "disliked"}
                                            onChange={(event) => setFormRating(event.target.value)}
                                        />
                                        No me gustó
                                    </label>
                                </div>
                            )}
                            <div className="dashboard-modal-actions">
                                <button type="button" className="modal-btn secondary" onClick={closeAddModal}>
                                    Cancelar
                                </button>
                                <button type="button" className="modal-btn primary" onClick={handleCreate} disabled={saving}>
                                    {saving ? "Agregando..." : "Agregar"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
                {canMark && markModalOpen ? (
                    <div
                        className="dashboard-modal-backdrop"
                        onClick={() => {
                            setError("");
                            setMarkModalOpen(false);
                        }}
                    >
                        <div
                            className="dashboard-modal"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <h2 className="dashboard-modal-title">Marcar como visto</h2>
                            <p className="dashboard-modal-subtitle">{markContext.title}</p>
                            <div className="dashboard-rating">
                                <p>Calificación:</p>
                                <label>
                                    <input
                                        type="radio"
                                        name="mark-rating"
                                        value="loved"
                                        checked={markRating === "loved"}
                                        onChange={(event) => setMarkRating(event.target.value)}
                                    />
                                    Me encantó
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="mark-rating"
                                        value="liked"
                                        checked={markRating === "liked"}
                                        onChange={(event) => setMarkRating(event.target.value)}
                                    />
                                    Me gustó
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="mark-rating"
                                        value="disliked"
                                        checked={markRating === "disliked"}
                                        onChange={(event) => setMarkRating(event.target.value)}
                                    />
                                    No me gustó
                                </label>
                            </div>
                            <div className="dashboard-modal-actions">
                                <button
                                    type="button"
                                    className="modal-btn secondary"
                                    onClick={() => {
                                        setError("");
                                        setMarkModalOpen(false);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="modal-btn primary"
                                    onClick={handleMarkSeen}
                                    disabled={marking}
                                >
                                    {marking ? "Marcando..." : "Marcar"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

export default DashboardView;
