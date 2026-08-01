export default function ActionCard({ title, actions = [], children }) {
  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span className="fw-medium">{title}</span>
        {actions.length > 0 && (
          <div className="d-flex gap-2 flex-wrap">
            {actions.map(a => (
              <button
                key={a.key}
                className={`btn btn-sm ${a.variant || 'btn-primary'}`}
                onClick={a.onClick}
                disabled={a.disabled}
              >
                {a.icon && <i className={`fa-solid ${a.icon} me-1`} />}
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children && <div className="card-body">{children}</div>}
    </div>
  );
}
