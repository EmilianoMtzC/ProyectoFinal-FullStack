export function getApiBaseUrl() {
    const raw = (import.meta.env.VITE_API_URL || "http://localhost:3000").trim();
    if (!raw) return "http://localhost:3000";

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    return withProtocol.replace(/\/+$/, "");
}

export function buildApiUrl(path = "") {
    const base = getApiBaseUrl();
    if (!path) return base;
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

