import MediaTable from "./MediaTable.jsx";

function MediaSection({ id, title, addLabel, tables, onAddClick, onDelete, onMarkSeen, readOnly }) {
    return (
        <section className="media-section" id={id}>
            <div className="media-section-header">
                <h2>{title}</h2>
                {!readOnly && onAddClick ? (
                    <button
                        type="button"
                        className="media-add-btn"
                        onClick={() => onAddClick(id)}
                    >
                        {addLabel}
                    </button>
                ) : null}
            </div>
            <div className="media-section-body">
                {tables.map((table, index) => (
                    <MediaTable
                        key={`${id}-${index}`}
                        {...table}
                        onDelete={onDelete}
                        onMarkSeen={onMarkSeen}
                        readOnly={readOnly}
                    />
                ))}
            </div>
        </section>
    );
}

export default MediaSection;
