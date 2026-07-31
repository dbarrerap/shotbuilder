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
        <textarea
          className="form-control star-textarea"
          readOnly
          value={star?.count > 0 ? star.item.text : t('dashboard.starNoUsage')}
        />
      </div>
    </div>
  );
}
