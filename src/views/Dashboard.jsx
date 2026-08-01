import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useDataContext } from '../contexts/DataContext';
import { CATEGORIES } from '../data/categories';
import StatCard from '../components/StatCard';
import StarIngredient from '../components/StarIngredient';
import LastPrompts from '../components/LastPrompts';

const CATEGORY_BORDER_COLORS = {
  personaje: 'hsl(210, 70%, 40%)',
  vestimenta: 'hsl(140, 70%, 40%)',
  pose: 'hsl(45, 70%, 40%)',
  escena: 'hsl(25, 70%, 40%)',
  camara: 'hsl(260, 70%, 40%)',
  tecnica: 'hsl(320, 70%, 40%)',
};

const CATEGORY_HUES = {
  personaje: 210,
  vestimenta: 140,
  pose: 45,
  escena: 25,
  camara: 260,
  tecnica: 320,
};

function getIngredientColor(id) {
  const cat = CATEGORIES.find(c => id >= c.baseId && id < c.baseId + 100);
  if (!cat) return '#90A4AE';
  const offset = id - cat.baseId;
  const t = Math.min(offset / 30, 1);
  const lightness = 30 + t * 45;
  return `hsl(${CATEGORY_HUES[cat.id]}, 70%, ${lightness}%)`;
}

function CustomTooltip({ active, payload, label, ingredientMap }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border rounded p-2 shadow-sm" style={{ fontSize: '0.85rem', maxWidth: 260 }}>
      <div className="fw-semibold mb-1">{label}</div>
      {payload.filter(entry => entry.value > 0).reverse().map(entry => {
        const info = ingredientMap[entry.dataKey];
        if (!info) return null;
        return (
          <div key={entry.dataKey} className="d-flex justify-content-between gap-3">
            <span className="text-body-secondary">#{entry.dataKey}</span>
            <span>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data, usageStats } = useDataContext();
  const usedIds = Object.keys(usageStats).map(Number).sort((a, b) => a - b);

  const ingredientMap = {};
  CATEGORIES.forEach(cat => {
    data[cat.id].forEach(item => {
      ingredientMap[String(item.id)] = { text: item.text, catId: cat.id };
    });
  });

  const chartData = CATEGORIES.map(cat => {
    const point = { name: t(`cat.${cat.id}`) };
    const catIds = new Set(data[cat.id].map(i => i.id));
    usedIds.forEach(id => {
      point[String(id)] = catIds.has(id) ? (usageStats[String(id)] || 0) : 0;
    });
    return point;
  });

  return (
    <div>
      <div className="row g-3 mb-4">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="col-6 col-xl">
            <StatCard label={t(`cat.${cat.id}`)} value={data[cat.id].length} headerColor={CATEGORY_BORDER_COLORS[cat.id]} />
          </div>
        ))}
      </div>

      {usedIds.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">{t('dashboard.usageFrequency')}</h5>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip ingredientMap={ingredientMap} />} />
                {usedIds.map(id => (
                  <Bar
                    key={id}
                    dataKey={String(id)}
                    stackId="a"
                    fill={getIngredientColor(id)}
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="row g-3 mt-4">
        <div className="col-12 col-lg-5">
          <LastPrompts />
        </div>
        <div className="col-12 col-lg-7">
          <StarIngredient />
        </div>
      </div>
    </div>
  );
}
