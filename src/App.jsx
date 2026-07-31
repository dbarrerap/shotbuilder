import { useState } from 'react';
import { Toaster } from 'sonner';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DataProvider, useDataContext } from './contexts/DataContext';
import { ApiKeysProvider, useApiKeysContext } from './contexts/ApiKeysContext';
import { CATEGORIES } from './data/categories';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Generate from './views/Generate';
import History from './views/History';
import ListView from './views/ListView';
import Settings from './views/Settings';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { loading } = useDataContext();
  const { loading: keysLoading } = useApiKeysContext();

  const category = CATEGORIES.find(c => location.pathname === `/list/${c.id}`);

  const title = location.pathname === '/'
    ? t('dashboard.title')
    : location.pathname === '/generate'
    ? t('generate.title')
    : location.pathname === '/history'
    ? t('history.title')
    : location.pathname === '/settings'
    ? t('settings.title')
    : category
    ? `${t(`cat.${category.id}`)} \u2014 ${t('nav.ingredients')}`
    : '';

  if (loading || keysLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <div className="view-header">
          <button className="sidebar-toggle d-md-none" onClick={() => setSidebarOpen(true)}>
            <i className="fa-solid fa-bars"></i>
          </button>
          <span className="h1 mb-0">{title}</span>
        </div>
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/history" element={<History />} />
            <Route path="/list/:categoryId" element={<ListView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <ApiKeysProvider>
          <AppContent />
        </ApiKeysProvider>
      </DataProvider>
    </HashRouter>
  );
}
