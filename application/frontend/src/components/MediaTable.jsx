function MediaTable({ title, columns, rows, isWatchlist, onDelete, onMarkSeen, readOnly }) {
    return (
        <div className="media-table-card">
            {title ? <h3>{title}</h3> : null}
            <table className="media-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr className="media-empty-row">
                            <td colSpan={columns.length}>Sin registros todavía.</td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id}>
                                <td>{row.title}</td>
                                {isWatchlist ? <td>{row.reason || "-"}</td> : null}
                                <td className="media-actions-cell">
                                    {!readOnly ? (
                                        <>
                                            {isWatchlist ? (
                                                <button
                                                    type="button"
                                                    className="media-action-btn"
                                                    onClick={() => onMarkSeen(row)}
                                                >
                                                    Visto
                                                </button>
                                            ) : null}
                                            <button
                                                type="button"
                                                className="media-delete-btn"
                                                onClick={() => onDelete(row)}
                                            >
                                                Eliminar
                                            </button>
                                        </>
                                    ) : (
                                        <span className="media-readonly">Solo lectura</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default MediaTable;
