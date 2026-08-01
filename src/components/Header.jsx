export default function Header({ title, onToggleSidebar }) {
  return (
    <div className="view-header">
      <button className="sidebar-toggle d-md-none" onClick={onToggleSidebar}>
        <i className="fa-solid fa-bars"></i>
      </button>
      <span className="h1 mb-0">{title}</span>
    </div>
  );
}
