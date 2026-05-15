/* ============ components.jsx — shared UI primitives ============ */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

/* ---------- Sidebar ---------- */
function Sidebar({ current, onNav, lastExport }) {
  const items = [
    { id: 'dashboard',  label: 'Дашборд',   prefix: '01' },
    { id: 'operations', label: 'Операции',  prefix: '02' },
    { id: 'budget',     label: 'Бюджет',    prefix: '03' },
    { id: 'categories', label: 'Категории', prefix: '04' },
    { id: 'accounts',   label: 'Счета',     prefix: '05' },
    { id: 'goals',      label: 'Накопления',prefix: '06' },
    { id: 'analytics',  label: 'Аналитика', prefix: '07' },
  ];
  const meta = [
    { id: 'export',   label: 'Экспорт', prefix: '08' },
    { id: 'settings', label: 'Настройки',prefix: '09' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="dot"></span>
        <span className="brand-name">budget</span>
        <span className="text-dim" style={{marginLeft:2}}>~</span>
      </div>
      <div className="sidebar-section">/ разделы</div>
      {items.map(it => (
        <button key={it.id}
          className={'nav-item ' + (current === it.id ? 'active' : '')}
          onClick={() => onNav(it.id)}>
          <span className="nav-prefix">{it.prefix}</span>
          <span>{it.label}</span>
        </button>
      ))}
      <div className="sidebar-section">/ система</div>
      {meta.map(it => (
        <button key={it.id}
          className={'nav-item ' + (current === it.id ? 'active' : '')}
          onClick={() => onNav(it.id)}>
          <span className="nav-prefix">{it.prefix}</span>
          <span>{it.label}</span>
        </button>
      ))}
      <div className="sidebar-foot">
        <div>локальная база</div>
        <div>посл. экспорт: <span style={{color:'var(--text-soft)'}}>{lastExport || '—'}</span></div>
      </div>
    </aside>
  );
}

/* ---------- Top bar with period switcher ---------- */
function TopBar({ title, period, onPrev, onNext, onToday, rightSlot }) {
  return (
    <header className="topbar">
      <h1><span className="prompt">›</span>{title}</h1>
      <div className="topbar-spacer"></div>
      {rightSlot}
      <div className="period-switcher">
        <button onClick={onPrev} title="Предыдущий период">‹</button>
        <span className="label">{periodLabel(period)}</span>
        <button onClick={onNext} title="Следующий период">›</button>
        <button onClick={onToday} title="К текущему" style={{borderLeft:'1px solid var(--border)'}}>•</button>
      </div>
    </header>
  );
}

/* ---------- Stat card ---------- */
function StatCard({ title, value, sub, accent, hint, currency='₽' }) {
  return (
    <div className="card stat-card">
      <div className="card-h">
        <div className="card-title"><span className="hash">#</span>{title}</div>
        {hint && <span className="card-sub">{hint}</span>}
      </div>
      <div className="stat-value" style={accent ? {color: 'var(--accent)'} : null}>
        <span className="tabular">{typeof value === 'number' ? Math.round(value).toLocaleString('ru-RU') : value}</span>
        {typeof value === 'number' && <span className="cur">{currency}</span>}
      </div>
      {sub && <div className="stat-delta">{sub}</div>}
    </div>
  );
}

/* ---------- Bar row ---------- */
function BarRow({ color, label, value, plan, currency = '₽', clickable, onClick }) {
  const pct = plan > 0 ? Math.min(value / plan, 1.4) : 0;
  const over = value > plan && plan > 0;
  const fillWidth = Math.min(pct, 1) * 100;
  const overWidth = over ? Math.min((value - plan) / plan, 0.5) * 100 : 0;
  return (
    <div className="bar-row" onClick={onClick} style={clickable ? {cursor:'pointer'} : null}>
      <div className="lbl">
        <span className="dot" style={{background: color}}></span>
        <span>{label}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{width: fillWidth + '%', background: color}} />
        {over && <div className="bar-fill over" style={{left: fillWidth + '%', width: overWidth + '%'}} />}
      </div>
      <div className={'val ' + (over ? 'over' : '')}>
        {Math.round(value).toLocaleString('ru-RU')}
        <span className="of"> / {Math.round(plan).toLocaleString('ru-RU')}</span>
      </div>
    </div>
  );
}

/* ---------- Donut (svg) ---------- */
function Donut({ data, size = 130, thickness = 18 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--surface-sunken)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        if (frac < 0.001) return null;
        const start = acc;
        acc += frac;
        const a0 = -Math.PI / 2 + start * 2 * Math.PI;
        const a1 = -Math.PI / 2 + acc * 2 * Math.PI;
        const x0 = cx + radius * Math.cos(a0), y0 = cy + radius * Math.sin(a0);
        const x1 = cx + radius * Math.cos(a1), y1 = cy + radius * Math.sin(a1);
        const large = frac > 0.5 ? 1 : 0;
        const path = `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
        return <path key={i} d={path} stroke={d.color} strokeWidth={thickness} fill="none" />;
      })}
      <text x={cx} y={cy - 3} textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)">всего</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" fontWeight="600" fill="var(--text)">{fmtMoneyCompact(total)}</text>
    </svg>
  );
}

/* ---------- CLI line chart (sparkline-like) ---------- */
function LineChart({ data, height = 110, color = 'var(--accent)', secondary, secondaryColor = 'var(--text-dim)', showAxis = true, labels }) {
  const w = 100; // viewBox width units
  if (!data.length) return null;
  const all = [...data, ...(secondary || [])];
  const max = Math.max(1, ...all);
  const stepX = w / Math.max(1, data.length - 1);
  const toY = v => height - 18 - (v / max) * (height - 30);
  const path = (arr) => arr.map((v, i) => (i === 0 ? 'M' : 'L') + (i * stepX).toFixed(2) + ' ' + toY(v).toFixed(2)).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{width:'100%', height, display:'block'}}>
      {/* grid */}
      {showAxis && [0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1="0" x2={w} y1={toY(max*f)} y2={toY(max*f)} stroke="var(--border)" strokeWidth="0.2" strokeDasharray="0.6,0.6" />
      ))}
      <line x1="0" x2={w} y1={height-18} y2={height-18} stroke="var(--border)" strokeWidth="0.3" />
      {/* secondary (plan) */}
      {secondary && (
        <path d={path(secondary)} stroke={secondaryColor} strokeWidth="0.6" fill="none" strokeDasharray="1,1" />
      )}
      {/* fill area */}
      <path d={path(data) + ` L ${((data.length-1)*stepX).toFixed(2)} ${height-18} L 0 ${height-18} Z`} fill={color} opacity="0.12" />
      <path d={path(data)} stroke={color} strokeWidth="0.8" fill="none" />
      {/* points */}
      {data.map((v, i) => (
        <circle key={i} cx={i*stepX} cy={toY(v)} r="0.7" fill={color} />
      ))}
      {/* x labels */}
      {labels && labels.map((l, i) => (
        <text key={i} x={i*stepX} y={height-5} fontSize="3.4" textAnchor={i === 0 ? 'start' : i === labels.length-1 ? 'end' : 'middle'} fill="var(--text-dim)" fontFamily="var(--mono)">{l}</text>
      ))}
    </svg>
  );
}

/* ---------- CLI grouped bars (plan vs fact) ---------- */
function PlanFactBars({ rows, currency = '₽' }) {
  const max = Math.max(1, ...rows.map(r => Math.max(r.plan, r.fact)));
  return (
    <div className="cli-chart" style={{display:'grid', gridTemplateColumns:'120px 1fr 120px', gap:'8px 12px', alignItems:'center'}}>
      {rows.map(r => {
        const fp = (r.fact / max) * 100;
        const pp = (r.plan / max) * 100;
        return (
          <React.Fragment key={r.label}>
            <div style={{fontSize:12}}>{r.label}</div>
            <div style={{display:'flex', flexDirection:'column', gap:3}}>
              <div style={{height:10, background:'var(--surface-sunken)', borderRadius:2, position:'relative'}}>
                <div style={{position:'absolute',inset:0,width:pp+'%',background:'var(--c-dustyblue)',opacity:.55,borderRadius:2}}></div>
              </div>
              <div style={{height:10, background:'var(--surface-sunken)', borderRadius:2, position:'relative'}}>
                <div style={{position:'absolute',inset:0,width:fp+'%',background:'var(--accent)',borderRadius:2}}></div>
              </div>
            </div>
            <div style={{fontSize:11, textAlign:'right', color:'var(--text-soft)'}}>
              <div>план {Math.round(r.plan).toLocaleString('ru-RU')}</div>
              <div style={{color:'var(--text)'}}>факт {Math.round(r.fact).toLocaleString('ru-RU')}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------- Heatmap of daily spend within period ---------- */
function SpendHeatmap({ period, dailyTotals, today }) {
  const days = periodLengthDays(period);
  const max = Math.max(1, ...dailyTotals);
  const cells = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(period.start);
    d.setDate(period.start.getDate() + i);
    const val = dailyTotals[i] || 0;
    const intensity = val / max;
    const bg = val === 0
      ? 'var(--surface-sunken)'
      : `color-mix(in oklab, var(--accent) ${Math.round(20 + intensity * 70)}%, var(--surface-sunken))`;
    const isToday = today && fmtISO(d) === fmtISO(today);
    cells.push(
      <div key={i} className={'cell' + (isToday ? ' today' : '')} style={{background: bg}} title={d.getDate() + ' ' + RU_MONTH_SHORT[d.getMonth()] + ' — ' + Math.round(val).toLocaleString('ru-RU') + ' ₽'}>
        <span>{d.getDate()}</span>
      </div>
    );
  }
  return (
    <div>
      <div className="heatmap" style={{gridTemplateColumns: `repeat(${Math.min(days, 31)}, 1fr)`}}>
        {cells}
      </div>
      <div className="legend">
        <span>меньше</span>
        <div className="sw" style={{background:'var(--surface-sunken)'}}></div>
        <div className="sw" style={{background:'color-mix(in oklab, var(--accent) 30%, var(--surface-sunken))'}}></div>
        <div className="sw" style={{background:'color-mix(in oklab, var(--accent) 55%, var(--surface-sunken))'}}></div>
        <div className="sw" style={{background:'color-mix(in oklab, var(--accent) 80%, var(--surface-sunken))'}}></div>
        <span>больше</span>
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({ title, onClose, children, footer, width }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={width ? {maxWidth: width} : null} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div><span className="prompt">›</span>{title}</div>
          <button className="btn-ghost mono" onClick={onClose} style={{fontSize:11}}>esc</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Category chip / icon tile ---------- */
function CatChip({ category, useEmoji }) {
  if (!category) return <span className="cat-chip"><span className="dot" style={{background:'var(--text-dim)'}}></span>—</span>;
  if (useEmoji && category.emoji) {
    return (
      <span className="cat-chip">
        <span style={{fontSize:13, lineHeight:1}}>{category.emoji}</span>
        {category.name}
      </span>
    );
  }
  return (
    <span className="cat-chip">
      <span className="dot" style={{background: category.color}}></span>
      {category.name}
    </span>
  );
}
function IconTile({ category, account, size = 26, useEmoji }) {
  const c = category || account;
  if (!c) return null;
  if (useEmoji && c.emoji) {
    return (
      <span className="icon-tile" style={{
        width:size, height:size,
        background: 'color-mix(in oklab, ' + c.color + ' 22%, var(--surface-sunken))',
        fontSize: Math.round(size * 0.55),
      }}>{c.emoji}</span>
    );
  }
  // no emoji — just a small colored swatch
  return (
    <span className="icon-swatch" style={{
      width: Math.max(10, Math.round(size * 0.42)),
      height: Math.max(10, Math.round(size * 0.42)),
      background: c.color,
    }} />
  );
}

/* ---------- Color picker (curated swatches) ---------- */
const CAT_COLORS = [
  'var(--c-clay)','var(--c-sage)','var(--c-dustyblue)','var(--c-slate)',
  'var(--c-orange)','var(--c-lavender)','var(--c-pink)','var(--c-yellow)','var(--c-moss)'
];
function ColorPicker({ value, onChange }) {
  return (
    <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
      {CAT_COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)}
          style={{
            width:24, height:24, borderRadius:4,
            background: c,
            border: value === c ? '2px solid var(--text)' : '2px solid transparent',
            cursor:'pointer'
          }} />
      ))}
    </div>
  );
}

/* ---------- Banner ---------- */
function Banner({ icon = '!', children, onDismiss, actions }) {
  return (
    <div className="banner">
      <span className="icon">{icon}</span>
      <div style={{flex:1}}>{children}</div>
      {actions}
      {onDismiss && <button className="btn-ghost mono" onClick={onDismiss} style={{fontSize:11}}>×</button>}
    </div>
  );
}

/* ---------- Daily bars chart (replaces LineChart) ---------- */
function DailyBars({ dailyTotals, period, today, targetPerDay, forecastFrom, forecast, height = 130 }) {
  const max = Math.max(1, targetPerDay || 0, ...dailyTotals, ...(forecast || []));
  const todayIdx = today ? dayIndexInPeriod(fmtISO(today), period) : dailyTotals.length;
  const tlineY = targetPerDay ? (1 - targetPerDay / max) * 100 : null;
  return (
    <div style={{position:'relative', height, paddingTop: 10}}>
      {tlineY !== null && (
        <>
          <div style={{
            position:'absolute', left:0, right:0,
            top: 10 + tlineY * (height - 30) / 100,
            borderTop:'1px dashed var(--text-dim)',
            opacity: 0.5,
          }}></div>
          <div className="mono tabular" style={{
            position:'absolute', right:0,
            top: 10 + tlineY * (height - 30) / 100 - 16,
            fontSize:10, color:'var(--text-dim)',
          }}>план {Math.round(targetPerDay).toLocaleString('ru-RU')}/день</div>
        </>
      )}
      <div style={{display:'flex', alignItems:'flex-end', gap: dailyTotals.length > 24 ? 1 : 2, height: height - 30}}>
        {dailyTotals.map((v, i) => {
          const future = forecast && i >= forecastFrom;
          const val = future ? forecast[i] : v;
          const h = (val / max) * 100;
          const isToday = i === todayIdx;
          return (
            <div key={i} style={{
              flex:1,
              height: Math.max(h, val > 0 ? 1.5 : 0) + '%',
              minHeight: val > 0 ? 2 : 0,
              background: future
                ? 'transparent'
                : (isToday ? 'var(--accent)' : 'var(--accent-soft)'),
              border: future ? '1px dashed var(--accent-soft)' : 'none',
              borderRadius:'2px 2px 0 0',
              opacity: future ? 0.6 : 1,
            }} title={Math.round(val).toLocaleString('ru-RU')}></div>
          );
        })}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', marginTop:4, fontFamily:'var(--mono)', fontSize:10, color:'var(--text-dim)'}}>
        <span>{fmtDate(period.startISO)}</span>
        <span>{today ? fmtDate(fmtISO(today)) : ''}</span>
        <span>{fmtDate(period.endISO)}</span>
      </div>
    </div>
  );
}

/* expose */
Object.assign(window, {
  Sidebar, TopBar, StatCard, BarRow, Donut, LineChart, PlanFactBars, SpendHeatmap, DailyBars,
  Modal, CatChip, IconTile, ColorPicker, CAT_COLORS, Banner,
});
