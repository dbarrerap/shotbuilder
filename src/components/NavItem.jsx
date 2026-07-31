export default function NavItem({ icon, label, path, currentPath, onClick }) {
  return (
    <div
      className={`nav-link${currentPath === path ? ' active' : ''}`}
      onClick={() => onClick(path)}
    >
      <span className="nav-icon"><i className={`fa-solid ${icon}`}></i></span>
      {label}
    </div>
  );
}
