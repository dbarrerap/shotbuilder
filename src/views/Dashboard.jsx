import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { useState } from 'react';
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
  const { t, i18n } = useTranslation();
  const { data, usageStats, promptHistory } = useDataContext();
  const usedIds = Object.keys(usageStats).map(Number).sort((a, b) => a - b);

  const [viewMonth, setViewMonth] = useState(() => dayjs().startOf('month'));
  const currentMonth = dayjs().startOf('month');
  const atCurrentMonth = viewMonth.isSame(currentMonth, 'month');
  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(viewMonth.toDate());

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

  const countsByDay = {};
  promptHistory.forEach(entry => {
    const d = dayjs(entry.timestamp);
    if (d.isSame(viewMonth, 'month')) {
      const day = d.date();
      countsByDay[day] = (countsByDay[day] || 0) + 1;
    }
  });
  const daysInMonth = viewMonth.daysInMonth();
  const lineData = [
    { day: 0, count: 0 },
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      count: countsByDay[i + 1] || 0,
    })),
  ];

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

      <div className="card mt-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <h5 className="card-title mb-0">{t('dashboard.promptsThisMonth')}</h5>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                aria-label={t('dashboard.prevMonth')}
                onClick={() => setViewMonth(m => m.subtract(1, 'month'))}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <span className="fw-medium text-center text-nowrap" style={{ minWidth: '8rem' }}>{monthLabel}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                aria-label={t('dashboard.nextMonth')}
                onClick={() => setViewMonth(m => m.add(1, 'month'))}
                disabled={atCurrentMonth}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" tickFormatter={v => (v === 0 ? '' : v)} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={value => [value, t('dashboard.prompts')]} />
              <Line type="monotone" dataKey="count" stroke="var(--md-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

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
