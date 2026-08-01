import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { CATEGORIES } from '../data/categories';

function getStarIngredient(data, usageStats, catId) {
  let best = null;
  let bestCount = -1;
  (data[catId] || []).forEach(item => {
    const count = usageStats[String(item.id)] || 0;
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  });
  return best ? { item: best, count: bestCount } : null;
}

export default function StarIngredient() {
  const { t } = useTranslation();
  const { data, usageStats } = useDataContext();
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);

  const stars = Object.fromEntries(
    CATEGORIES.map(c => [c.id, getStarIngredient(data, usageStats, c.id)])
  );

  const star = stars[activeCat];

  const starParts = CATEGORIES.map(c => stars[c.id] ? String(stars[c.id].item.id) : null);
  const hasAnyStar = starParts.some(Boolean);
  const starPromptId = starParts.map(id => id || '???').join('-');
  const starPromptText = CATEGORIES.map(c =>
    `${t(`cat.${c.id}`)}: ${stars[c.id] ? stars[c.id].item.text : '???'}`
  ).join('\n');
  const [showStarModal, setShowStarModal] = useState(false);

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">
          {t('dashboard.starIngredient')}
        </h5>
        <ul className="nav star-nav justify-content-center mb-2">
          {CATEGORIES.map(cat => (
            <li className="nav-item" key={cat.id}>
              <button
                className={`nav-link ${activeCat === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCat(cat.id)}
              >
                {t(`cat.${cat.id}`)}
                {stars[cat.id]?.count > 0 && (
                  <span className="badge bg-secondary ms-1">{stars[cat.id].count}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {hasAnyStar && (
          <div className="text-center mb-2">
            <button className="btn btn-link btn-sm p-0" onClick={() => setShowStarModal(true)}>
              <code>{starPromptId}</code>
            </button>
          </div>
        )}
        <textarea
          className="form-control star-textarea"
          readOnly
          value={star?.count > 0 ? star.item.text : t('dashboard.starNoUsage')}
          onClick={(e) => e.target.select()}
        />
      </div>

      {showStarModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowStarModal(false)} />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('dashboard.promptLabel', { id: starPromptId })}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowStarModal(false)} />
                </div>
                <div className="modal-body">
                  <pre className="mb-0 text-break" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                    {starPromptText}
                  </pre>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-amber" onClick={() => {
                    navigator.clipboard.writeText(starPromptText);
                    setShowStarModal(false);
                  }}>
                    {t('dashboard.copy')}
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
