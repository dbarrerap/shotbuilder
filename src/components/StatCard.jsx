export default function StatCard({ label, value, headerColor }) {
  return (
    <div className="card">
      <div className="card-header fw-medium" style={{ backgroundColor: headerColor, color: '#fff' }}>
        {label}
      </div>
      <div className="card-body py-3">
        <div className="fs-4 fw-semibold">{value}</div>
      </div>
    </div>
  );
}
