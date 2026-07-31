import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../data/categories';
import NavItem from './NavItem';

const CATEGORY_ICONS = {
  personaje: 'fa-user',
  vestimenta: 'fa-shirt',
  pose: 'fa-person-walking',
  escena: 'fa-location-dot',
  camara: 'fa-camera',
};

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <h5 className="mb-0 fw-semibold">ShotBuilder</h5>
        </div>
        <nav className="sidebar-nav">
          <NavItem icon="fa-chart-pie" label={t('nav.dashboard')} path="/" currentPath={location.pathname} onClick={handleNav} />

          <div className="nav-title">{t('nav.generation')}</div>
          <NavItem icon="fa-wand-magic-sparkles" label={t('nav.prompt')} path="/generate" currentPath={location.pathname} onClick={handleNav} />
          <NavItem icon="fa-clock-rotate-left" label={t('nav.history')} path="/history" currentPath={location.pathname} onClick={handleNav} />

          <div className="nav-title">{t('nav.categories')}</div>
          {CATEGORIES.map(cat => (
            <NavItem key={cat.id} icon={CATEGORY_ICONS[cat.id]} label={t(`cat.${cat.id}`)} path={`/list/${cat.id}`} currentPath={location.pathname} onClick={handleNav} />
          ))}

          <div className="nav-title">{t('nav.configuration')}</div>
          <NavItem icon="fa-gear" label={t('nav.settings')} path="/settings" currentPath={location.pathname} onClick={handleNav} />
        </nav>
        <footer className="sidebar-footer">
          <a
            href="https://ko-fi.com/dbarrera"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            onClick={onClose}
          >
            <span className="nav-icon"><i className="fa-solid fa-mug-hot"></i></span>
            {t('nav.support')}
          </a>
        </footer>
      </aside>
    </>
  );
}
