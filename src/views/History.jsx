import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { CATEGORIES } from '../data/categories';
import StatCard from '../components/StatCard';
import { formatTimestamp } from '../lib/dayjs';

const PAGE_SIZE = 10;

export default function History() {
  const { data, promptHistory } = useDataContext();
  const { t } = useTranslation();

  const reconstructPrompt = (usedIds) => {
    return CATEGORIES.map(cat => {
      const itemId = usedIds[cat.id];
      const item = data[cat.id]?.find(i => i.id === itemId);
      return `${t(`cat.${cat.id}`)}: ${item ? item.text : '???'}`;
    }).join('\n');
  };
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const sorted = [...promptHistory].reverse();
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, sorted.length);
  const pageItems = sorted.slice(start, end);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - ((now.getDay() + 6) % 7));
  const total = promptHistory.length;
  const today = promptHistory.filter(e => e.timestamp >= startOfDay.getTime()).length;
  const week = promptHistory.filter(e => e.timestamp >= startOfWeek.getTime()).length;

  const stats = [
    { label: t('history.total'), value: total },
    { label: t('history.today'), value: today },
    { label: t('history.thisWeek'), value: week },
  ];

  return (
    <div>
      <div className="row g-3 mb-4">
        {stats.map(s => (
          <div key={s.label} className="col-sm-6 col-xl-4">
            <StatCard label={s.label} value={s.value} headerColor="var(--md-primary)" />
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted">{t('history.noPrompts')}</p>
      ) : (
        <div className="card">
          <div className="card-body">
            <table className="table table-hover align-middle mb-2">
              <thead>
                <tr>
                  <th>{t('history.promptId')}</th>
                  <th style={{ width: '12.5rem' }}>{t('history.date')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((entry, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedEntry(entry)}>
                    <td><code>{entry.id}</code></td>
                    <td className="text-body-secondary">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d-flex justify-content-between align-items-center mb-0">
              <small className="text-body-secondary">
                {t('history.showing', { start: start + 1, end, total: sorted.length })}
              </small>
              {totalPages > 1 && (
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                        {t('history.prev')}
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <li key={n} className={`page-item ${n === currentPage ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(n)}>{n}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                        {t('history.next')}
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedEntry && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setSelectedEntry(null)} />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('history.promptLabel', { id: selectedEntry.id })}</h5>
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
                    {t('history.copy')}
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    navigate('/generate', { state: { pin: selectedEntry.usedIds } });
                  }}>
                    {t('history.reGenerate')}
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
