/* ============ pages2.jsx — categories, accounts, goals, analytics, settings, export ============ */
const useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo;

/* =====================================================================
   CATEGORIES
===================================================================== */
function CategoriesPage({ state, dispatch }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(null); // 'expense' | 'income' | null

  function startNew(type) {
    setCreating({ name:'', type, color: CAT_COLORS[0], icon:'·' });
  }
  function saveNew() {
    if (!creating.name.trim()) return;
    const cat = {
      id: 'c-' + Math.random().toString(36).slice(2,7),
      name: creating.name.trim(),
      type: creating.type,
      color: creating.color,
      icon: creating.name.trim()[0].toUpperCase(),
    };
    dispatch({ type:'addCategory', category: cat });
    setCreating(null);
  }

  function renderGroup(title, type) {
    const list = state.categories.filter(c => c.type === type);
    return (
      <div className="card">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>{title}</div>
          <button className="btn btn-sm" onClick={() => startNew(type)}>+ добавить</button>
        </div>
        <table className="t">
          <thead>
            <tr>
              <th style={{width:36}}></th>
              <th>название</th>
              <th>цвет</th>
              <th className="num">операций</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(c => {
              const count = state.operations.filter(o => o.categoryId === c.id).length;
              const isEdit = editing === c.id;
              return (
                <tr key={c.id}>
                  <td><IconTile category={c} useEmoji={state.settings.useEmoji} /></td>
                  <td>
                    {isEdit ? (
                      <input className="input" autoFocus defaultValue={c.name}
                        onBlur={e => { dispatch({type:'updateCategory', category:{...c, name:e.target.value}}); setEditing(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(null); }} />
                    ) : (
                      <button className="btn-ghost mono" style={{padding:'2px 4px'}}
                        onClick={() => setEditing(c.id)}>{c.name}</button>
                    )}
                    {c.archived && <span className="pill" style={{marginLeft:8}}>архив</span>}
                  </td>
                  <td>
                    <ColorPicker value={c.color} onChange={v => dispatch({type:'updateCategory', category:{...c, color: v}})} />
                  </td>
                  <td className="num tabular dim">{count}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn btn-sm btn-ghost"
                      onClick={() => dispatch({type:'updateCategory', category:{...c, archived: !c.archived}})}>
                      {c.archived ? 'восстан.' : 'архивир.'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-2">
        {renderGroup('категории расходов', 'expense')}
        {renderGroup('категории доходов', 'income')}
      </div>

      {creating && (
        <Modal title="новая категория" onClose={() => setCreating(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setCreating(null)}>отмена</button>
            <button className="btn btn-primary" onClick={saveNew}>создать</button>
          </>}>
          <div className="seg">
            <button className={creating.type==='expense'?'active':''} onClick={()=>setCreating({...creating, type:'expense'})}>расход</button>
            <button className={creating.type==='income'?'active':''} onClick={()=>setCreating({...creating, type:'income'})}>доход</button>
          </div>
          <div className="field">
            <label>название</label>
            <input className="input" autoFocus value={creating.name}
              onChange={e => setCreating({...creating, name: e.target.value})} />
          </div>
          <div className="field">
            <label>цвет</label>
            <ColorPicker value={creating.color} onChange={v => setCreating({...creating, color: v})} />
          </div>
        </Modal>
      )}
    </>
  );
}

/* =====================================================================
   ACCOUNTS
===================================================================== */
function AccountsPage({ state, dispatch }) {
  const total = state.accounts.filter(a => !a.archived).reduce((s,a)=>s+a.balance, 0);
  return (
    <>
      <div className="grid grid-3">
        <StatCard title="всего на счетах" value={total} accent />
        <StatCard title="активных" value={state.accounts.filter(a=>!a.archived).length} currency="" />
        <StatCard title="кредиты" value={state.accounts.filter(a=>a.type==='credit').reduce((s,a)=>s+a.balance,0)} />
      </div>

      <div className="grid grid-3 mt-16">
        {state.accounts.map(a => (
          <div key={a.id} className="card">
            <div className="card-h">
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <IconTile account={a} size={32} useEmoji={state.settings.useEmoji} />
                <div>
                  <div className="mono" style={{fontSize:13, fontWeight:600}}>{a.name}</div>
                  <div className="card-sub">{TYPE_LABEL[a.type] || a.type}</div>
                </div>
              </div>
              <button className="btn-ghost mono" style={{fontSize:11}}
                onClick={() => dispatch({type:'updateAccount', account:{...a, archived: !a.archived}})}>
                {a.archived ? 'восст.' : 'архив'}
              </button>
            </div>
            <div className="stat-value tabular" style={{color: a.balance < 0 ? 'var(--bad)' : 'var(--text)'}}>
              {a.balance < 0 ? '−' : ''}{Math.abs(a.balance).toLocaleString('ru-RU')}
              <span className="cur">₽</span>
            </div>
            <div className="stat-delta">баланс</div>
          </div>
        ))}
        <div className="card center" style={{minHeight:140, borderStyle:'dashed', cursor:'pointer'}}
          onClick={() => {
            const name = prompt('Название счёта');
            if (!name) return;
            dispatch({type:'addAccount', account:{
              id: 'a-'+Math.random().toString(36).slice(2,7),
              name, type:'card', balance:0,
              color: CAT_COLORS[Math.floor(Math.random()*CAT_COLORS.length)],
              icon: name[0].toUpperCase()
            }});
          }}>
          <div className="text-dim mono">+ добавить счёт</div>
        </div>
      </div>
    </>
  );
}
const TYPE_LABEL = { cash:'наличные', card:'карта', savings:'накопления', credit:'кредитка' };

/* =====================================================================
   GOALS / SAVINGS
===================================================================== */
function GoalsPage({ state, dispatch }) {
  const [editing, setEditing] = useState(null);
  const totalCurrent = state.goals.reduce((s,g)=>s+g.current,0);
  const totalTarget  = state.goals.reduce((s,g)=>s+g.target,0);
  return (
    <>
      <div className="grid grid-3">
        <StatCard title="накоплено" value={totalCurrent} accent />
        <StatCard title="цели · сумма" value={totalTarget} />
        <StatCard title="прогресс" value={Math.round(totalCurrent/totalTarget*100) + '%'} currency="" />
      </div>

      <div className="grid grid-2 mt-16">
        {state.goals.map(g => {
          const pct = Math.min(g.current / g.target, 1);
          return (
            <div key={g.id} className="card goal-card">
              <div className="card-h">
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <IconTile category={g} size={30} useEmoji={state.settings.useEmoji} />
                  <div>
                    <div className="mono" style={{fontSize:13, fontWeight:600}}>{g.name}</div>
                    {g.note && <div className="card-sub">{g.note}</div>}
                  </div>
                </div>
                <button className="btn-ghost mono" style={{fontSize:11}}
                  onClick={() => setEditing(g)}>изменить</button>
              </div>
              <div className="between mono" style={{fontSize:13}}>
                <span className="tabular">{Math.round(g.current).toLocaleString('ru-RU')} ₽</span>
                <span className="text-dim tabular">из {Math.round(g.target).toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{width: pct*100+'%', background: g.color}}></div>
              </div>
              <div className="between mono" style={{fontSize:11, color:'var(--text-dim)'}}>
                <span>{Math.round(pct*100)}%</span>
                <span>осталось {Math.round(g.target-g.current).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          );
        })}
        <div className="card center" style={{minHeight:140, borderStyle:'dashed', cursor:'pointer'}}
          onClick={() => setEditing({ id:null, name:'', target:0, current:0, color: CAT_COLORS[0], icon:'·', note:'' })}>
          <div className="text-dim mono">+ новая цель</div>
        </div>
      </div>

      {editing && (
        <Modal title={editing.id ? 'цель / редактировать' : 'новая цель'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={()=>setEditing(null)}>отмена</button>
            {editing.id && <button className="btn" style={{color:'var(--bad)'}} onClick={()=>{dispatch({type:'deleteGoal', id:editing.id}); setEditing(null);}}>удалить</button>}
            <button className="btn btn-primary" onClick={() => {
              const g = {...editing, id: editing.id || 'g-'+Math.random().toString(36).slice(2,7), icon: (editing.name||'·')[0].toUpperCase()};
              dispatch({type: editing.id ? 'updateGoal' : 'addGoal', goal: g});
              setEditing(null);
            }}>сохранить</button>
          </>}>
          <div className="field">
            <label>название</label>
            <input className="input" autoFocus value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} />
          </div>
          <div className="field-row">
            <div className="field"><label>текущая сумма</label>
              <input className="input" type="number" value={editing.current} onChange={e=>setEditing({...editing, current:+e.target.value||0})} />
            </div>
            <div className="field"><label>цель</label>
              <input className="input" type="number" value={editing.target} onChange={e=>setEditing({...editing, target:+e.target.value||0})} />
            </div>
          </div>
          <div className="field">
            <label>цвет</label>
            <ColorPicker value={editing.color} onChange={v=>setEditing({...editing, color:v})} />
          </div>
          <div className="field">
            <label>комментарий</label>
            <input className="input" value={editing.note||''} onChange={e=>setEditing({...editing, note:e.target.value})} />
          </div>
        </Modal>
      )}
    </>
  );
}

/* =====================================================================
   ANALYTICS
===================================================================== */
function AnalyticsPage({ state, period, today, settings }) {
  const ops = state.operations.filter(o => inPeriod(o.date, period));
  const expenses = ops.filter(o => o.type === 'expense');
  const incomes  = ops.filter(o => o.type === 'income');

  // donut: expenses by category
  const byCat = {};
  expenses.forEach(o => byCat[o.categoryId] = (byCat[o.categoryId]||0) + o.amount);
  const donutData = Object.entries(byCat)
    .map(([cid, v]) => { const c = state.categories.find(x=>x.id===cid); return c && {label:c.name, color:c.color, value:v}; })
    .filter(Boolean)
    .sort((a,b)=>b.value-a.value);
  const donutTotal = donutData.reduce((s,d)=>s+d.value,0) || 1;

  // daily totals + forecast
  const daysTotal = periodLengthDays(period);
  const dailyTotals = new Array(daysTotal).fill(0);
  expenses.forEach(o => { const i = dayIndexInPeriod(o.date, period); if (i>=0 && i<daysTotal) dailyTotals[i] += o.amount; });
  const dayIncome = new Array(daysTotal).fill(0);
  incomes.forEach(o => { const i = dayIndexInPeriod(o.date, period); if (i>=0 && i<daysTotal) dayIncome[i] += o.amount; });

  const dayIdxToday = Math.max(0, Math.min(daysTotal-1, dayIndexInPeriod(fmtISO(today), period)));
  const daysPassed = Math.max(1, dayIdxToday + 1);
  const avgDaily = dailyTotals.slice(0, daysPassed).reduce((s,v)=>s+v,0) / daysPassed;

  // balance + forecast lines
  let acc = 0;
  const balanceActual = dailyTotals.map((d, i) => {
    if (i > dayIdxToday) return null;
    acc += dayIncome[i] - d;
    return acc;
  }).filter(v => v !== null);
  // forecast: extend with avg daily spend, also assume known future incomes from recurring
  const forecast = [...balanceActual];
  let fwd = balanceActual[balanceActual.length - 1] || 0;
  const recurring = settings.recurringIncomes || [];
  for (let i = dayIdxToday + 1; i < daysTotal; i++) {
    const d = new Date(period.start); d.setDate(period.start.getDate() + i);
    let dayInc = 0;
    recurring.forEach(r => {
      if (d.getDate() === r.day) dayInc += r.amount;
    });
    fwd += dayInc - avgDaily;
    forecast.push(fwd);
  }

  // plan/fact bar chart
  const planFactRows = Object.entries(state.plan.expenses)
    .map(([cid, plan]) => { const c = state.categories.find(x=>x.id===cid); return c && {label:c.name, plan, fact: byCat[cid]||0}; })
    .filter(Boolean);

  // ---- Period comparison: build last 6 periods incl current ----
  const periodsList = [];
  let p = period;
  for (let i = 0; i < 6; i++) {
    const pops = state.operations.filter(o => inPeriod(o.date, p));
    const e = pops.filter(o=>o.type==='expense').reduce((s,o)=>s+o.amount,0);
    const inc = pops.filter(o=>o.type==='income').reduce((s,o)=>s+o.amount,0);
    periodsList.unshift({ p, exp: e, inc, label: RU_MONTH_SHORT[p.start.getMonth()] });
    p = shiftPeriod(p, -1, settings);
  }
  const maxPeriodAmt = Math.max(1, ...periodsList.flatMap(x => [x.exp, x.inc]));

  // ---- Day of week ----
  const dow = [0,0,0,0,0,0,0];
  const dowCnt = [0,0,0,0,0,0,0];
  expenses.forEach(o => {
    const d = parseISO(o.date);
    const i = (d.getDay() + 6) % 7; // 0=Mon
    dow[i] += o.amount;
    dowCnt[i] += 1;
  });
  const dowLabels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const dowMax = Math.max(1, ...dow);

  // ---- Top transactions ----
  const topOps = [...expenses].sort((a,b) => b.amount - a.amount).slice(0, 8);

  // ---- Year overview: by calendar month ----
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearMonths = new Array(12).fill(0);
  state.operations.forEach(o => {
    const d = parseISO(o.date);
    if (d.getFullYear() === today.getFullYear() && o.type === 'expense') {
      yearMonths[d.getMonth()] += o.amount;
    }
  });
  const yearMax = Math.max(1, ...yearMonths);

  const curExp = expenses.reduce((s,o)=>s+o.amount,0);
  const curInc = incomes.reduce((s,o)=>s+o.amount,0);
  const prevPeriod = shiftPeriod(period, -1, settings);
  const prevOps = state.operations.filter(o => inPeriod(o.date, prevPeriod));
  const prevExp = prevOps.filter(o=>o.type==='expense').reduce((s,o)=>s+o.amount,0);
  const expectedTotal = forecast[forecast.length - 1] || 0;

  return (
    <>
      <div className="grid grid-4">
        <StatCard title="расходы · период" value={curExp}
          sub={`пред. ${Math.round(prevExp).toLocaleString('ru-RU')} ₽${prevExp ? ' · ' + (curExp>prevExp?'+':'')+(Math.round((curExp/prevExp-1)*100)) + '%' : ''}`} />
        <StatCard title="доходы · период" value={curInc} accent
          sub={`среднее/день: ${Math.round(curExp/daysTotal).toLocaleString('ru-RU')} ₽`} />
        <StatCard title="прогноз к концу" value={Math.round(expectedTotal)}
          sub={`по тренду ${Math.round(avgDaily).toLocaleString('ru-RU')} ₽/день`} />
        <StatCard title="макс. день" value={Math.max(...dailyTotals)} />
      </div>

      <div className="grid grid-2 mt-16">
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>расходы по категориям</div>
          </div>
          <div className="donut-row">
            <Donut data={donutData} />
            <div className="legend" style={{maxHeight:220, overflowY:'auto'}}>
              {donutData.map(d => (
                <div className="row" key={d.label}>
                  <span className="sw" style={{background:d.color}}></span>
                  <span style={{minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.label}</span>
                  <span className="tabular">{Math.round(d.value).toLocaleString('ru-RU')}</span>
                  <span className="pct">{Math.round(d.value/donutTotal*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>расходы по дням периода</div>
            <span className="card-sub">факт · прогноз пунктиром</span>
          </div>
          <DailyBars
            dailyTotals={dailyTotals.map((v, i) => i <= dayIdxToday ? v : 0)}
            forecast={dailyTotals.map((_, i) => i > dayIdxToday ? avgDaily : 0)}
            forecastFrom={dayIdxToday + 1}
            period={period}
            today={today}
            targetPerDay={state.plan ? Object.values(state.plan.expenses).reduce((s,v)=>s+v,0) / daysTotal : 0}
            height={170}
          />
          <div className="help-line mt-12">
            прогноз учитывает средний дневной расход ({Math.round(avgDaily).toLocaleString('ru-RU')} ₽) и регулярные доходы из настроек
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>сравнение последних 6 периодов</div>
          <span className="card-sub">расходы (тёмный) и доходы (светлый)</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:14, alignItems:'stretch'}}>
          {periodsList.map((it, i) => {
            const eh = (it.exp / maxPeriodAmt) * 100;
            const ih = (it.inc / maxPeriodAmt) * 100;
            const isCurrent = i === periodsList.length - 1;
            return (
              <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                <div className="tabular mono" style={{fontSize:10.5, color:'var(--text-dim)', minHeight:14}}>
                  {it.exp > 0 ? fmtMoneyCompact(it.exp) : ''}
                </div>
                <div style={{display:'flex', alignItems:'flex-end', gap:4, height:140, width:'100%', justifyContent:'center'}}>
                  <div style={{width:'40%', height: Math.max(ih, it.inc > 0 ? 2 : 0) + '%', background:'var(--c-sage)', opacity:.6, borderRadius:'3px 3px 0 0'}} title={'доход ' + Math.round(it.inc).toLocaleString('ru-RU')}></div>
                  <div style={{width:'40%', height: Math.max(eh, it.exp > 0 ? 2 : 0) + '%', background: isCurrent ? 'var(--accent)' : 'var(--accent-soft)', borderRadius:'3px 3px 0 0'}} title={'расход ' + Math.round(it.exp).toLocaleString('ru-RU')}></div>
                </div>
                <div className="mono" style={{fontSize:11, color: isCurrent ? 'var(--text)' : 'var(--text-dim)', fontWeight: isCurrent ? 600 : 400}}>
                  {it.label} {String(it.p.start.getFullYear()).slice(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-2 mt-16">
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>по дням недели</div>
          </div>
          <div style={{display:'flex', alignItems:'stretch', gap:10, paddingTop:14}}>
            {dow.map((v, i) => {
              const h = (v / dowMax) * 100;
              const isWeekend = i >= 5;
              return (
                <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                  <div className="tabular mono" style={{fontSize:10.5, color:'var(--text-dim)', minHeight:14}}>{v > 0 ? fmtMoneyCompact(v) : ''}</div>
                  <div style={{height:140, width:'100%', display:'flex', alignItems:'flex-end'}}>
                    <div style={{width:'100%', height: Math.max(h, v > 0 ? 3 : 0) + '%', background: isWeekend ? 'var(--c-lavender)' : 'var(--accent)', borderRadius:'3px 3px 0 0'}}></div>
                  </div>
                  <div className="mono" style={{fontSize:11, color:'var(--text-soft)'}}>{dowLabels[i]}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>топ операций</div>
            <span className="card-sub">самые крупные расходы периода</span>
          </div>
          <table className="t">
            <tbody>
              {topOps.map(o => {
                const c = state.categories.find(cc => cc.id === o.categoryId);
                return (
                  <tr key={o.id}>
                    <td className="dim" style={{width:60}}>{fmtDate(o.date)}</td>
                    <td>{o.description || c?.name}</td>
                    <td><CatChip category={c} useEmoji={state.settings.useEmoji} /></td>
                    <td className="num tabular">{Math.round(o.amount).toLocaleString('ru-RU')}</td>
                  </tr>
                );
              })}
              {topOps.length === 0 && <tr><td colSpan="4" className="text-dim" style={{textAlign:'center', padding:'14px'}}>пока пусто</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>годовой обзор · {today.getFullYear()}</div>
          <span className="card-sub">по календарным месяцам</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:8, alignItems:'flex-end'}}>
          {yearMonths.map((v, i) => {
            const h = (v / yearMax) * 100;
            const isCurrent = i === today.getMonth();
            return (
              <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                <div className="tabular mono" style={{fontSize:10, color:'var(--text-dim)'}}>{v > 0 ? fmtMoneyCompact(v) : '·'}</div>
                <div style={{width:'100%', height:90, display:'flex', alignItems:'flex-end'}}>
                  <div style={{width:'100%', height: h + '%', minHeight: v > 0 ? 3 : 0, background: isCurrent ? 'var(--accent)' : 'var(--accent-soft)', opacity: isCurrent ? 1 : 0.7, borderRadius:'3px 3px 0 0'}}></div>
                </div>
                <div className="mono" style={{fontSize:10.5, color: isCurrent ? 'var(--text)' : 'var(--text-dim)', fontWeight: isCurrent ? 600 : 400}}>
                  {RU_MONTH_SHORT[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>план vs факт по категориям</div>
        </div>
        <PlanFactBars rows={planFactRows} />
        <div className="flex gap-16 mono mt-12" style={{fontSize:11, color:'var(--text-dim)'}}>
          <span><span style={{display:'inline-block',width:10,height:10,background:'var(--c-dustyblue)',opacity:.6,borderRadius:2,marginRight:6,verticalAlign:'middle'}}></span>план</span>
          <span><span style={{display:'inline-block',width:10,height:10,background:'var(--accent)',borderRadius:2,marginRight:6,verticalAlign:'middle'}}></span>факт</span>
        </div>
      </div>
    </>
  );
}

/* ---------- Forecast chart: actual line + dashed forecast ---------- */
function ForecastChart({ actual, forecast, height = 140, labels }) {
  const w = 100;
  const all = [...actual, ...forecast.slice(actual.length)];
  if (!all.length) return null;
  const min = Math.min(0, ...all);
  const max = Math.max(1, ...all);
  const range = max - min || 1;
  const stepX = w / Math.max(1, forecast.length - 1);
  const toY = v => height - 18 - ((v - min) / range) * (height - 30);
  const path = (arr, offset = 0) => arr.map((v, i) => (i === 0 ? 'M' : 'L') + ((i + offset) * stepX).toFixed(2) + ' ' + toY(v).toFixed(2)).join(' ');
  const futurePart = forecast.slice(actual.length - 1); // include junction point
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{width:'100%', height, display:'block'}}>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1="0" x2={w} y1={toY(min + range*f)} y2={toY(min + range*f)} stroke="var(--border)" strokeWidth="0.2" strokeDasharray="0.6,0.6" />
      ))}
      <line x1="0" x2={w} y1={height-18} y2={height-18} stroke="var(--border)" strokeWidth="0.3" />
      {min < 0 && <line x1="0" x2={w} y1={toY(0)} y2={toY(0)} stroke="var(--bad)" strokeWidth="0.3" strokeDasharray="0.6,0.4" opacity="0.5" />}
      <path d={path(actual) + ` L ${((actual.length-1)*stepX).toFixed(2)} ${height-18} L 0 ${height-18} Z`} fill="var(--accent)" opacity="0.1" />
      <path d={path(actual)} stroke="var(--accent)" strokeWidth="0.9" fill="none" />
      <path d={path(futurePart, actual.length - 1)} stroke="var(--accent-soft)" strokeWidth="0.7" fill="none" strokeDasharray="1.2,1" />
      {/* today marker */}
      <line x1={(actual.length-1)*stepX} x2={(actual.length-1)*stepX} y1="6" y2={height-18} stroke="var(--text-dim)" strokeWidth="0.2" strokeDasharray="0.6,0.6" />
      <text x={(actual.length-1)*stepX} y="4" fontSize="3" textAnchor="middle" fill="var(--text-dim)" fontFamily="var(--mono)">сегодня</text>
      {labels && labels.map((l, i) => (
        <text key={i} x={i === 0 ? 0 : i === labels.length-1 ? w : (actual.length-1)*stepX} y={height-5} fontSize="3.4" textAnchor={i === 0 ? 'start' : i === labels.length-1 ? 'end' : 'middle'} fill="var(--text-dim)" fontFamily="var(--mono)">{l}</text>
      ))}
    </svg>
  );
}

/* =====================================================================
   SETTINGS
===================================================================== */
function SettingsPage({ state, dispatch, lastExport, onExport, onImport, onReset, settings }) {
  return (
    <>
      <div className="grid grid-2">
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>бюджетный период</div>
          </div>
          <div className="field">
            <label>день начала бюджетного месяца</label>
            <input className="input" type="number" min="1" max="28" value={settings.periodStartDay}
              onChange={e => dispatch({type:'setSettings', patch:{periodStartDay: Math.max(1, Math.min(28, +e.target.value||1))}})} />
            <div className="help-line text-dim">например, 20 — если зарплата приходит 20-го числа</div>
          </div>
          <div className="field mt-12">
            <label>конец периода</label>
            <div className="seg">
              <button className={settings.periodEndMode==='beforeNext'?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{periodEndMode:'beforeNext'}})}>до предыдущего дня</button>
              <button className={settings.periodEndMode==='sameDayNext'?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{periodEndMode:'sameDayNext'}})}>включая такое же число</button>
            </div>
            <div className="help-line text-dim">
              пример: 20 апреля — {settings.periodEndMode==='beforeNext'?'19':'20'} мая
            </div>
          </div>
          <div className="field mt-12">
            <label>валюта</label>
            <select className="select" value={settings.currency} onChange={e=>dispatch({type:'setSettings', patch:{currency:e.target.value}})}>
              <option value="₽">₽ рубль</option>
              <option value="$">$ доллар</option>
              <option value="€">€ евро</option>
              <option value="₸">₸ тенге</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>тема</div>
          </div>
          <div className="field">
            <label>оформление</label>
            <div className="seg">
              <button className={settings.theme==='light'?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{theme:'light'}})}>светлая</button>
              <button className={settings.theme==='dark'?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{theme:'dark'}})}>тёмная</button>
              <button className={settings.theme==='system'?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{theme:'system'}})}>система</button>
            </div>
          </div>
          <div className="field mt-12">
            <label>акцентный цвет</label>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {ACCENT_PALETTES.map(p => {
                const active = (settings.accent || 'clay') === p.id;
                return (
                  <button key={p.id} onClick={()=>dispatch({type:'setSettings', patch:{accent: p.id}})}
                    title={p.label}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'6px 10px 6px 6px',
                      borderRadius:5,
                      border: active ? '1px solid var(--text)' : '1px solid var(--border)',
                      background: active ? 'var(--surface-2)' : 'var(--surface)',
                      fontFamily:'var(--mono)', fontSize:12,
                      color: 'var(--text)',
                    }}>
                    <span style={{width:18, height:18, borderRadius:3, background:p.swatch, border:'1px solid rgba(0,0,0,.08)'}}></span>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="help-line text-dim">все палитры — мягкие пастельные тона, читаются и на светлой, и на тёмной теме</div>
          </div>
          <div className="field mt-12">
            <label>иконки и emoji</label>
            <div className="seg">
              <button className={!settings.useEmoji?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{useEmoji:false}})}>минимально (цветной квадрат)</button>
              <button className={settings.useEmoji?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{useEmoji:true}})}>emoji в интерфейсе</button>
            </div>
            <div className="help-line text-dim">с emoji включаются иконки на категориях, счетах, целях и ключевых кнопках</div>
          </div>
          <div className="field mt-12">
            <label>напоминание о бэкапе</label>
            <div className="seg">
              <button className={settings.remindExport?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{remindExport:true}})}>раз в месяц</button>
              <button className={!settings.remindExport?'active':''} onClick={()=>dispatch({type:'setSettings', patch:{remindExport:false}})}>отключить</button>
            </div>
            <div className="help-line text-dim">появится мягким баннером на дашборде</div>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>регулярные доходы</div>
          <span className="card-sub">используются для блока «ближайший доход» на дашборде</span>
        </div>
        <RecurringIncomes settings={settings} dispatch={dispatch} />
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>данные</div>
          <span className="card-sub">локальная база · last export: {lastExport || '—'}</span>
        </div>
        <div className="flex gap-12" style={{flexWrap:'wrap'}}>
          <button className="btn" onClick={onExport}>{settings.useEmoji && '📥 '}экспорт JSON</button>
          <button className="btn" onClick={onImport}>{settings.useEmoji && '📤 '}импорт JSON</button>
          <button className="btn" onClick={() => {
            if (!confirm('Удалить все операции и обнулить план? Категории, счета, цели сохранятся.')) return;
            dispatch({type:'clearOpsAndPlan'});
          }}>{settings.useEmoji && '🧹 '}начать с чистого листа</button>
          <button className="btn" style={{color:'var(--bad)', borderColor:'var(--bad)'}} onClick={onReset}>{settings.useEmoji && '🗑️ '}сбросить всё</button>
        </div>
        <div className="help-line mt-12 text-dim">
          приложение хранит данные локально. ничего не уходит наружу. рекомендуем делать резервную копию раз в месяц.
        </div>
      </div>
    </>
  );
}

/* ---------- Recurring incomes editor ---------- */
function RecurringIncomes({ settings, dispatch }) {
  const list = settings.recurringIncomes || [];
  function update(idx, patch) {
    const next = list.map((it, i) => i === idx ? { ...it, ...patch } : it);
    dispatch({ type:'setSettings', patch:{ recurringIncomes: next } });
  }
  function remove(idx) {
    const next = list.filter((_, i) => i !== idx);
    dispatch({ type:'setSettings', patch:{ recurringIncomes: next } });
  }
  function add() {
    const next = [...list, { id:'r-'+Math.random().toString(36).slice(2,7), day:1, amount:0, label:'Доход' }];
    dispatch({ type:'setSettings', patch:{ recurringIncomes: next } });
  }
  return (
    <>
      <table className="t">
        <thead>
          <tr>
            <th>название</th>
            <th style={{width:80}}>день</th>
            <th className="num" style={{width:140}}>сумма</th>
            <th style={{width:60}}></th>
          </tr>
        </thead>
        <tbody>
          {list.map((it, i) => (
            <tr key={it.id}>
              <td>
                <input className="input" value={it.label} onChange={e=>update(i, {label:e.target.value})} />
              </td>
              <td>
                <input className="input" type="number" min="1" max="31" value={it.day}
                  onChange={e=>update(i, {day: Math.max(1, Math.min(31, +e.target.value||1))})} />
              </td>
              <td className="num">
                <input className="input tabular" type="number" value={it.amount}
                  onChange={e=>update(i, {amount: +e.target.value || 0})} style={{textAlign:'right'}} />
              </td>
              <td>
                <button className="btn btn-sm btn-ghost" onClick={()=>remove(i)}>удалить</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan="4" className="text-dim" style={{textAlign:'center', padding:'14px'}}>нет регулярных доходов</td></tr>}
        </tbody>
      </table>
      <button className="btn btn-sm mt-12" onClick={add}>+ добавить</button>
    </>
  );
}

/* =====================================================================
   EXPORT / IMPORT page
===================================================================== */
function ExportPage({ state, lastExport, onExport, onImport, onReset }) {
  const ops = state.operations.length;
  const cats = state.categories.length;
  const accs = state.accounts.length;
  const goals = state.goals.length;
  return (
    <>
      <div className="grid grid-4">
        <StatCard title="операций" value={ops} currency="" />
        <StatCard title="категорий" value={cats} currency="" />
        <StatCard title="счетов" value={accs} currency="" />
        <StatCard title="целей" value={goals} currency="" />
      </div>

      <div className="grid grid-2 mt-16">
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>экспорт</div>
          </div>
          <p className="mono" style={{fontSize:12.5, color:'var(--text-soft)', lineHeight:1.55}}>
            Полная резервная копия базы: операции, категории, счета, цели, план и настройки. Файл сохранится локально в формате JSON.
          </p>
          <button className="btn btn-primary mt-8" onClick={onExport}>скачать backup-{new Date().toISOString().slice(0,10)}.json</button>
          <div className="help-line mt-12 text-dim">
            последний экспорт: <b style={{color:'var(--text-soft)'}}>{lastExport || 'никогда'}</b>
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <div className="card-title"><span className="hash">#</span>импорт</div>
          </div>
          <p className="mono" style={{fontSize:12.5, color:'var(--text-soft)', lineHeight:1.55}}>
            Загрузить ранее сохранённую базу. Структура файла будет проверена перед перезаписью.
          </p>
          <button className="btn mt-8" onClick={onImport}>выбрать JSON</button>
          <div className="help-line mt-12 text-dim">
            текущие данные будут заменены — система запросит подтверждение.
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title" style={{color:'var(--bad)'}}><span className="hash">#</span>сброс</div>
        </div>
        <p className="mono" style={{fontSize:12.5, color:'var(--text-soft)'}}>
          Удалить все локальные данные и вернуть приложение в состояние демо. Действие необратимо — сначала экспортируйте копию.
        </p>
        <button className="btn mt-8" style={{color:'var(--bad)', borderColor:'var(--bad)'}} onClick={onReset}>сбросить базу</button>
      </div>
    </>
  );
}

Object.assign(window, { CategoriesPage, AccountsPage, GoalsPage, AnalyticsPage, SettingsPage, ExportPage });
