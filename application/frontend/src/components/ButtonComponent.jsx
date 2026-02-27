import { useState } from "react";
import { buildApiUrl } from "../lib/api.js";

function ButtonComponent({ text, onClick, api, type = "button", className = "", style }) {
    const buttonStyle = {
        backgroundColor: "#5D5D5D",
        color: "white",
        border: "none",
        borderRadius: "20px",
        padding: "6px 14px",
        cursor: "pointer",
        fontWeight: "500",
        fontSize: "0.9rem",
        ...style
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleClick = async (event) => {
        setError("");

        if (api) {
            const {
                path,
                method = "GET",
                body,
                headers,
                auth = true,
                token,
                onSuccess,
                onError
            } = api;

            const resolvedBody = typeof body === "function" ? body() : body;
            const requestHeaders = {
                "Content-Type": "application/json",
                ...headers
            };

            if (auth) {
                const storedToken = token || localStorage.getItem("token");
                if (storedToken) {
                    requestHeaders.Authorization = `Bearer ${storedToken}`;
                }
            }

            try {
                setLoading(true);
                const response = await fetch(buildApiUrl(path), {
                    method,
                    headers: requestHeaders,
                    body: resolvedBody ? JSON.stringify(resolvedBody) : undefined
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    const message = data?.error || data?.message || "Error en la petición";
                    throw new Error(message);
                }

                if (onSuccess) {
                    onSuccess(data);
                }
            } catch (err) {
                const message = err?.message || "Error en la petición";
                setError(message);
                if (onError) {
                    onError(err);
                }
            } finally {
                setLoading(false);
            }
        }

        if (onClick) {
            onClick(event);
        }
    };

    return (
        <button
            className={className}
            style={buttonStyle}
            onClick={handleClick}
            disabled={loading}
            type={type}
        >
            {loading ? "..." : text}
            {error ? ` (${error})` : ""}
        </button>
    );
}

export default ButtonComponent;
