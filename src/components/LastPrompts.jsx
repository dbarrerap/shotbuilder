import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { CATEGORIES } from '../data/categories';
import { formatDate } from '../lib/dayjs';

export default function LastPrompts() {
  const { t } = useTranslation();
  const { data, promptHistory } = useDataContext();
  const lastPrompts = promptHistory.slice(-5).reverse();
  const [selectedEntry, setSelectedEntry] = useState(null);

  const reconstructPrompt = (usedIds) => {
    return CATEGORIES.map(cat => {
      const itemId = usedIds[cat.id];
      const item = data[cat.id]?.find(i => i.id === itemId);
      return `${t(`cat.${cat.id}`)}: ${item ? item.text : '???'}`;
    }).join('\n');
  };

  return (
    <>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{t('dashboard.lastPrompts')}</h5>
          {lastPrompts.length === 0 ? (
            <p className="text-muted mb-0">{t('dashboard.noPrompts')}</p>
          ) : (
            <div className="list-group list-group-flush">
              {lastPrompts.map((entry, i) => (
                <button
                  key={i}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <code>{entry.id}</code>
                  <small className="text-body-secondary">
                    {formatDate(entry.timestamp)}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEntry && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setSelectedEntry(null)} />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('dashboard.promptLabel', { id: selectedEntry.id })}</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedEntry(null)} />
                </div>
                <div className="modal-body">
                  <pre className="mb-0 text-break" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                    {reconstructPrompt(selectedEntry.usedIds)}
                  </pre>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-amber" onClick={() => {
                    navigator.clipboard.writeText(reconstructPrompt(selectedEntry.usedIds));
                    setSelectedEntry(null);
                  }}>
                    {t('dashboard.copy')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
