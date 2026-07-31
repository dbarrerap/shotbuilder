import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation, Trans } from 'react-i18next';
import i18n from '../i18n';
import localforage from 'localforage';
import { useDataContext } from '../contexts/DataContext';
import { useApiKeysContext } from '../contexts/ApiKeysContext';
import { CATEGORIES } from '../data/categories';

const SERVICES = [
  { id: 'huggingface', label: 'Hugging Face', icon: 'fa-solid fa-h', link: 'https://huggingface.co/settings/tokens' },
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Espa\u00f1ol' },
];

function validateImported(raw) {
  if (!raw || typeof raw !== 'object') return 'Invalid file format';
  const { data } = raw;
  if (!data || typeof data !== 'object') return 'Missing "data" object';
  for (const cat of CATEGORIES) {
    const items = data[cat.id];
    if (!Array.isArray(items)) return `Missing or invalid category: ${cat.label}`;
    for (const item of items) {
      if (!item || typeof item.id !== 'number' || typeof item.text !== 'string') {
        return `Invalid item in "${cat.label}": each item needs "id" (number) and "text" (string)`;
      }
    }
  }
  return null;
}

export default function Settings() {
  const { t } = useTranslation();
  const { data, importIngredients } = useDataContext();
  const { apiKeys, saveApiKey, deleteApiKey } = useApiKeysContext();
  const fileRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [lang, setLang] = useState('en');
  const [newKeys, setNewKeys] = useState({});

  useEffect(() => {
    localforage.getItem('promptgen_lang').then(saved => {
      if (saved) {
        setLang(saved);
      }
    });
  }, []);

  useEffect(() => {
    i18n.changeLanguage(lang);
    localforage.setItem('promptgen_lang', lang);
  }, [lang]);

  const handleExport = () => {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('settings.exported'));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const error = validateImported(parsed);
        if (error) {
          toast.error(error);
          return;
        }
        setImportData(parsed.data);
        setShowImportModal(true);
      } catch {
        toast.error(t('settings.invalidJson'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importData) return;
    const promise = importIngredients(importData).then(() => {
      setShowImportModal(false);
      setImportData(null);
    });
    toast.promise(promise, {
      loading: t('settings.importing'),
      success: t('settings.imported'),
      error: t('settings.error'),
    });
  };

  const handleSaveKey = (serviceId) => {
    const key = (newKeys[serviceId] || '').trim();
    if (!key) {
      toast.error(t('settings.enterApiKey'));
      return;
    }
    toast.promise(saveApiKey(serviceId, key), {
      loading: t('settings.saving'),
      success: t('settings.keySaved', { label: SERVICES.find(s => s.id === serviceId).label }),
      error: t('settings.error'),
    });
    setNewKeys(prev => ({ ...prev, [serviceId]: '' }));
  };

  const handleDeleteKey = (serviceId) => {
    toast.promise(deleteApiKey(serviceId), {
      loading: t('settings.deleting'),
      success: t('settings.keyDeleted', { label: SERVICES.find(s => s.id === serviceId).label }),
      error: t('settings.error'),
    });
  };

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">
            <i className="fa-solid fa-language me-2"></i>
            {t('settings.language')}
          </h5>
          <div className="d-flex gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l.id}
                className={`btn btn-sm ${lang === l.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">
            <i className="fa-solid fa-key me-2"></i>
            {t('settings.apiKeys')}
          </h5>
          {SERVICES.map(service => {
            const hasKey = !!apiKeys[service.id];
            return (
              <div key={service.id} className="d-flex align-items-center gap-2 mt-3 pt-3 border-top">
                <i className={`${service.icon} fs-5`}></i>
                <div className="flex-fill">
                  <div className="fw-medium">{service.label}</div>
                  <a href={service.link} target="_blank" rel="noopener noreferrer" className="text-body-secondary" style={{ fontSize: '0.8rem' }}>
                    {t('settings.getApiKey')} <i className="fa-solid fa-arrow-up-right-from-squares"></i>
                  </a>
                </div>
                {hasKey ? (
                  <div className="d-flex align-items-center gap-2">
                    <code className="text-body-secondary" style={{ fontSize: '0.8rem' }}>
                      {apiKeys[service.id].substring(0, 8)}...
                    </code>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteKey(service.id)}>
                      {t('settings.delete')}
                    </button>
                  </div>
                ) : (
                  <div className="d-flex gap-2">
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      style={{ width: 200 }}
                      placeholder="hf_..."
                      value={newKeys[service.id] || ''}
                      onChange={(e) => setNewKeys(prev => ({ ...prev, [service.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveKey(service.id)}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveKey(service.id)} disabled={!newKeys[service.id]?.trim()}>
                      {t('settings.save')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <i className="fa-solid fa-screwdriver-wrench me-2"></i>
            {t('settings.maintenance')}
          </h5>

          <h6 className="fw-medium">{t('settings.export')}</h6>
          <p className="text-body-secondary">
            {t('settings.exportDesc')}
          </p>
          <button className="btn btn-primary mb-3" onClick={handleExport}>
            {t('settings.download')}
          </button>

          <hr />

          <h6 className="fw-medium">{t('settings.import')}</h6>
          <p className="text-body-secondary">
            <Trans i18nKey="settings.importDesc">
              Upload a previously exported JSON file to restore ingredient data.
              This will <strong>replace</strong> all existing ingredients.
            </Trans>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="d-block"
          />
        </div>
      </div>

      {showImportModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('settings.confirmImport')}</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowImportModal(false); setImportData(null); }} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {t('settings.confirmImportBody')}
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportData(null); }}>
                    {t('settings.cancel')}
                  </button>
                  <button className="btn btn-danger" onClick={confirmImport}>
                    {t('settings.import')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
