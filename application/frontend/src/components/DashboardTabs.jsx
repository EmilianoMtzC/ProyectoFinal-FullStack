function DashboardTabs({ tabs, active, onChange }) {
    return (
        <nav className="dashboard-tabs">
            <ul>
                {tabs.map((tab) => (
                    <li key={tab.id}>
                        <button
                            type="button"
                            className={`dashboard-tab ${active === tab.id ? "active" : ""}`}
                            onClick={() => onChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default DashboardTabs;
