export default function ActionCard({ title, actions = [], children }) {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h5 className="card-title mb-0">{title}</h5>
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
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
