// @ts-nocheck — ported from prototype JS as-is. TODO: tighten types.
/* ============ pages.tsx — all main views ============ */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DEFAULT_DASHBOARD_LAYOUT, RU_MONTH_SHORT, dayIndexInPeriod, fmtDate, fmtISO, fmtMoneyCompact, inPeriod, parseISO, periodLengthDays } from './data';
import { Banner, BarRow, CAT_COLORS, CatChip, ColorPicker, DailyBars, IconTile, Modal, SpendHeatmap, StatCard } from './components';

/* ---------- Add / Edit Operation Modal (with inline category creation) ---------- */
export function OperationModal({ state, dispatch, op, onClose, defaultType = 'expense' }) {
  const editing = !!op;
  const [type, setType] = useState(op?.type || defaultType);
  const [date, setDate] = useState(op?.date || state.anchorISO);
  const [amount, setAmount] = useState(op?.amount || '');
  const [categoryId, setCategoryId] = useState(op?.categoryId || '');
  const [accountId, setAccountId] = useState(op?.accountId || state.accounts[0].id);
  const [toAccountId, setToAccountId] = useState(op?.toAccountId || state.accounts[1]?.id);
  const [description, setDescription] = useState(op?.description || '');
  const [memberId, setMemberId] = useState(op?.memberId || '');
  const [creatingCat, setCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CAT_COLORS[0]);
  const [split, setSplit] = useState(false);
  const [splitLines, setSplitLines] = useState([{ id:'s1', amount:'', categoryId:'' }, { id:'s2', amount:'', categoryId:'' }]);

  const cats = state.categories.filter(c => !c.archived && (c.type === type || c.type === 'any'));
  const splitTotal = splitLines.reduce((s,l) => s + (+l.amount||0), 0);
  const totalAmount = +amount || 0;
  const splitDiff = totalAmount - splitTotal;

  function save() {
    if (!amount || isNaN(+amount)) return;
    if (split && type !== 'transfer') {
      // create N operations, one per line
      const valid = splitLines.filter(l => +l.amount > 0 && l.categoryId);
      if (valid.length === 0) return;
      valid.forEach(l => {
        dispatch({ type:'addOp', op: {
          id: 'op-' + Math.random().toString(36).slice(2,9),
          date, amount: +l.amount, type,
          categoryId: l.categoryId, accountId,
          description: description.trim(),
          memberId: null, toAccountId: null,
          createdAt: Date.now(), updatedAt: Date.now(),
        }});
      });
      onClose();
      return;
    }
    if (type !== 'transfer' && !categoryId) return;
    const payload = {
      id: op?.id || ('op-' + Math.random().toString(36).slice(2, 9)),
      date,
      amount: +amount,
      type,
      categoryId: type === 'transfer' ? null : categoryId,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : null,
      description: description.trim(),
      memberId: memberId || null,
      createdAt: op?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: editing ? 'updateOp' : 'addOp', op: payload });
    onClose();
  }

  function updateSplit(idx, patch) {
    setSplitLines(lines => lines.map((l,i) => i === idx ? {...l, ...patch} : l));
  }
  function addSplitLine() {
    setSplitLines(lines => [...lines, { id:'s'+Date.now(), amount:'', categoryId:'' }]);
  }
  function removeSplitLine(idx) {
    setSplitLines(lines => lines.filter((_,i) => i !== idx));
  }
  function autofillSplit() {
    // distribute remaining diff to the first empty-amount row
    const idx = splitLines.findIndex(l => !l.amount);
    if (idx >= 0 && splitDiff > 0) updateSplit(idx, { amount: splitDiff });
  }

  function createCategory() {
    if (!newCatName.trim()) return;
    const id = 'c-' + Math.random().toString(36).slice(2, 7);
    const newCat = {
      id, name: newCatName.trim(),
      type: type === 'transfer' ? 'expense' : type,
      color: newCatColor,
      icon: newCatName.trim()[0].toUpperCase(),
    };
    dispatch({ type: 'addCategory', category: newCat });
    setCategoryId(id);
    setCreatingCat(false);
    setNewCatName('');
  }

  return (
    <Modal
      title={editing ? 'операция / редактировать' : 'новая операция'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>отмена</button>
          {editing && (
            <button className="btn" style={{color:'var(--bad)'}}
              onClick={() => { dispatch({ type:'deleteOp', id: op.id }); onClose(); }}>
              удалить
            </button>
          )}
          <button className="btn btn-primary" onClick={save}>
            {editing ? 'сохранить' : 'записать'} <span className="kbd" style={{marginLeft:6}}>↵</span>
          </button>
        </>
      }>
      <div className="seg">
        <button className={type==='expense'?'active':''} onClick={() => setType('expense')}>расход</button>
        <button className={type==='income'?'active':''}  onClick={() => setType('income')}>доход</button>
        <button className={type==='transfer'?'active':''} onClick={() => setType('transfer')}>перевод</button>
      </div>

      <div className="field-row">
        <div className="field">
          <label>сумма</label>
          <input className="input" type="number" value={amount} placeholder="0"
            autoFocus onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label>дата</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {type !== 'transfer' ? (
        <div className="field">
          <div className="between" style={{marginBottom:4}}>
            <label>{split ? 'разделить чек на категории' : 'категория'}</label>
            {!editing && (
              <button className="btn-ghost mono" style={{fontSize:11, color:'var(--text-soft)'}}
                onClick={() => setSplit(s => !s)}>
                {split ? '← одна категория' : '⎘ разделить чек'}
              </button>
            )}
          </div>
          {!split && !creatingCat ? (
            <div style={{display:'flex', gap:8}}>
              <select className="select" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{flex:1}}>
                <option value="">— выберите —</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn btn-sm" onClick={() => setCreatingCat(true)} title="новая категория">+ новая</button>
            </div>
          ) : !split && creatingCat ? (
            <div style={{display:'flex', flexDirection:'column', gap:8,
              padding:10, background:'var(--surface-2)', border:'1px dashed var(--border-strong)', borderRadius:5}}>
              <div style={{fontSize:11, color:'var(--text-dim)', fontFamily:'var(--mono)'}}>
                ⤿ создать категорию «{type === 'income' ? 'доход' : 'расход'}»
              </div>
              <input className="input" placeholder="название" value={newCatName}
                autoFocus onChange={e => setNewCatName(e.target.value)} />
              <ColorPicker value={newCatColor} onChange={setNewCatColor} />
              <div style={{display:'flex', gap:8}}>
                <button className="btn btn-sm" onClick={() => setCreatingCat(false)}>отмена</button>
                <button className="btn btn-sm btn-primary" onClick={createCategory}>создать и выбрать</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:6, padding:10, background:'var(--surface-2)', borderRadius:5, border:'1px solid var(--border)'}}>
              {splitLines.map((l, i) => (
                <div key={l.id} style={{display:'grid', gridTemplateColumns:'1fr 130px 30px', gap:6}}>
                  <select className="select" value={l.categoryId} onChange={e => updateSplit(i, {categoryId: e.target.value})}>
                    <option value="">— категория —</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input className="input tabular" type="number" placeholder="сумма" value={l.amount}
                    onChange={e => updateSplit(i, {amount: e.target.value})} style={{textAlign:'right'}} />
                  <button className="btn btn-ghost mono" style={{fontSize:14, color:'var(--text-dim)'}} onClick={() => removeSplitLine(i)} title="убрать">×</button>
                </div>
              ))}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4, fontFamily:'var(--mono)', fontSize:11.5}}>
                <button className="btn btn-sm" onClick={addSplitLine}>+ ещё категория</button>
                <span style={{color: totalAmount > 0 && splitDiff === 0 ? 'var(--good)' : 'var(--text-soft)'}}>
                  итого <span className="tabular">{splitTotal.toLocaleString('ru-RU')}</span>
                  {totalAmount > 0 && <span className="text-dim"> / {totalAmount.toLocaleString('ru-RU')}</span>}
                  {totalAmount > 0 && splitDiff > 0 && (
                    <button className="btn-ghost mono" style={{marginLeft:8, fontSize:11, color:'var(--accent)'}}
                      onClick={autofillSplit}>+ остаток {splitDiff.toLocaleString('ru-RU')}</button>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="field-row">
          <div className="field">
            <label>с счёта</label>
            <select className="select" value={accountId} onChange={e => setAccountId(e.target.value)}>
              {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>на счёт</label>
            <select className="select" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
              {state.accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {type !== 'transfer' && (
        <div className="field">
          <label>счёт</label>
          <select className="select" value={accountId} onChange={e => setAccountId(e.target.value)}>
            {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      <div className="field">
        <label>описание</label>
        <input className="input" value={description} placeholder="например: продукты"
          onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="help-line">
        <span className="k">↵</span> сохранить · <span className="k">esc</span> отмена · можно создать категорию прямо здесь
      </div>
    </Modal>
  );
}

/* =====================================================================
   DASHBOARD
===================================================================== */
export const DASH_WIDGET_LABELS = {
  'stat-exp':    'расходы',
  'stat-inc':    'доходы',
  'stat-bal':    'остаток',
  'stat-days':   'дней до конца',
  'dynamics':    'динамика периода',
  'side-panel':  'ближайший доход',
  'top-cats':    'крупнейшие категории',
  'over-budget': 'превышение бюджета',
  'heatmap':     'heatmap по дням',
  'recent-ops':  'последние операции',
};

export function DashboardPage({ state, dispatch, period, today, onOpenModal, onNav, lastExport, onExport, onNewCategory, onDismissBanner, showBanner }) {
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState(null);
  const layout = state.settings.dashboardLayout || DEFAULT_DASHBOARD_LAYOUT;

  function setLayout(next) {
    dispatch({ type:'setSettings', patch:{ dashboardLayout: next } });
  }
  function moveTo(srcId, dstId) {
    if (srcId === dstId) return;
    const next = [...layout];
    const srcIdx = next.findIndex(w => w.id === srcId);
    const dstIdx = next.findIndex(w => w.id === dstId);
    if (srcIdx < 0 || dstIdx < 0) return;
    const [item] = next.splice(srcIdx, 1);
    next.splice(dstIdx, 0, item);
    setLayout(next);
  }
  function toggle(id) {
    setLayout(layout.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  }
  function setSpan(id, span) {
    setLayout(layout.map(w => w.id === id ? { ...w, span } : w));
  }
  function resetLayout() {
    setLayout(DEFAULT_DASHBOARD_LAYOUT);
  }

  // ---- compute widgets data ----
  const ops = state.operations.filter(o => inPeriod(o.date, period));
  const expenses = ops.filter(o => o.type === 'expense');
  const incomes = ops.filter(o => o.type === 'income');
  const totalExp = expenses.reduce((s,o) => s + o.amount, 0);
  const totalInc = incomes.reduce((s,o) => s + o.amount, 0);
  const planExp = Object.values(state.plan.expenses).reduce((s,v)=>s+v,0);
  const planInc = Object.values(state.plan.incomes).reduce((s,v)=>s+v,0);
  const remaining = planExp - totalExp;
  const balance = totalInc - totalExp;

  const daysTotal = periodLengthDays(period);
  const daysPassed = Math.max(1, Math.min(daysTotal, Math.round((today - period.start)/86400000) + 1));
  const daysLeft = daysTotal - daysPassed;

  const todayISO = fmtISO(today);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6);
  const weekSum = expenses.filter(o => parseISO(o.date) >= weekStart && parseISO(o.date) <= today).reduce((s,o)=>s+o.amount,0);
  const todaySum = expenses.filter(o => o.date === todayISO).reduce((s,o)=>s+o.amount,0);

  const byCat = {};
  expenses.forEach(o => { byCat[o.categoryId] = (byCat[o.categoryId] || 0) + o.amount; });
  const topCats = Object.entries(byCat)
    .map(([cid, v]) => ({ cat: state.categories.find(c=>c.id===cid), value: v }))
    .filter(x => x.cat)
    .sort((a,b) => b.value - a.value)
    .slice(0, 5);
  const overCats = Object.entries(state.plan.expenses)
    .map(([cid, plan]) => ({ cat: state.categories.find(c=>c.id===cid), plan, fact: byCat[cid] || 0 }))
    .filter(x => x.cat && x.fact > x.plan)
    .sort((a,b) => (b.fact - b.plan) - (a.fact - a.plan));

  const dailyTotals = new Array(daysTotal).fill(0);
  expenses.forEach(o => {
    const i = dayIndexInPeriod(o.date, period);
    if (i >= 0 && i < daysTotal) dailyTotals[i] += o.amount;
  });
  const cumul = [];
  let acc = 0;
  for (let i = 0; i < daysTotal; i++) { acc += dailyTotals[i]; cumul.push(acc); }
  const planLine = dailyTotals.map((_, i) => Math.round(planExp * (i+1) / daysTotal));
  const lastOps = [...ops].sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt - a.createdAt)).slice(0, 7);

  // ---- widget renderers ----
  const widgets = {
    'stat-exp':  <StatCard title="расходы" value={totalExp} sub={`план ${Math.round(planExp).toLocaleString('ru-RU')} ₽ · осталось ${Math.round(remaining).toLocaleString('ru-RU')}`} />,
    'stat-inc':  <StatCard title="доходы" value={totalInc} sub={`план ${Math.round(planInc).toLocaleString('ru-RU')} ₽`} accent />,
    'stat-bal':  <StatCard title="остаток" value={balance} sub={balance >= 0 ? 'в плюс' : 'в минус'} />,
    'stat-days': <StatCard title="дней до конца" value={daysLeft} sub={`из ${daysTotal} · день ${daysPassed}`} currency="" />,
    'dynamics': (
      <div className="card">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>динамика периода</div>
          <span className="card-sub">расходы по дням</span>
        </div>
        <DailyBars
          dailyTotals={dailyTotals}
          period={period}
          today={today}
          targetPerDay={planExp / daysTotal}
          height={130}
        />
        <div className="divider"></div>
        <div className="flex gap-16 mono" style={{fontSize:12, color:'var(--text-soft)'}}>
          <span>за неделю: <b style={{color:'var(--text)'}}>{Math.round(weekSum).toLocaleString('ru-RU')} ₽</b></span>
          <span>сегодня: <b style={{color:'var(--text)'}}>{Math.round(todaySum).toLocaleString('ru-RU')} ₽</b></span>
          <span style={{marginLeft:'auto'}}>среднее/день: <b style={{color:'var(--text)'}}>{Math.round(totalExp/daysPassed).toLocaleString('ru-RU')} ₽</b></span>
        </div>
      </div>
    ),
    'side-panel': (
      <div className="card">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>ближайший доход</div>
        </div>
        <UpcomingIncome settings={state.settings} today={today} />
        <div className="divider"></div>
        <div className="card-title" style={{marginBottom:10}}><span className="hash">#</span>быстрые действия</div>
        <div className="flex flex-col gap-8">
          <button className="btn btn-primary btn-block" onClick={() => onOpenModal('expense')}>{state.settings.useEmoji && '💸 '}+ расход <span className="kbd" style={{marginLeft:'auto', background:'transparent', borderColor:'rgba(255,255,255,.3)', color:'inherit'}}>r</span></button>
          <button className="btn btn-block" onClick={() => onOpenModal('income')}>{state.settings.useEmoji && '💰 '}+ доход <span className="kbd" style={{marginLeft:'auto'}}>i</span></button>
          <button className="btn btn-block" onClick={onNewCategory}>{state.settings.useEmoji && '🏷️ '}+ категория</button>
          <button className="btn btn-block" onClick={onExport}>{state.settings.useEmoji && '📥 '}экспортировать базу</button>
        </div>
      </div>
    ),
    'top-cats': (
      <div className="card">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>крупнейшие категории</div>
          <button className="btn-ghost mono" style={{fontSize:11}} onClick={() => onNav('budget')}>все →</button>
        </div>
        <div>
          {topCats.map(({cat, value}) => (
            <BarRow key={cat.id} color={cat.color} label={cat.name}
              value={value} plan={state.plan.expenses[cat.id] || value}
              clickable onClick={() => onNav('budget')} />
          ))}
          {topCats.length === 0 && <div className="text-dim mono" style={{fontSize:12}}>пока пусто</div>}
        </div>
      </div>
    ),
    'over-budget': (
      <div className="card">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>превышение бюджета</div>
          <span className="card-sub">{overCats.length} категори{overCats.length === 1 ? 'я' : 'й'}</span>
        </div>
        {overCats.length === 0 ? (
          <div className="text-dim mono" style={{fontSize:12, padding:'18px 0'}}>всё в пределах плана</div>
        ) : overCats.map(({cat, plan, fact}) => (
          <div key={cat.id} className="bar-row" style={{gridTemplateColumns:'130px 1fr 110px'}}>
            <div className="lbl"><span className="dot" style={{background: cat.color}}></span>{cat.name}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{width:'100%', background:cat.color, opacity:.5}}></div>
              <div className="bar-fill over" style={{left:'100%', width: Math.min((fact-plan)/plan*100, 50) + '%'}}></div>
            </div>
            <div className="val over">−{Math.round(fact-plan).toLocaleString('ru-RU')} ₽</div>
          </div>
        ))}
      </div>
    ),
    'heatmap': (
      <div className="card">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>heatmap расходов · {daysTotal} дней</div>
          <span className="card-sub">сегодня — {today.getDate()} {RU_MONTH_SHORT[today.getMonth()]}</span>
        </div>
        <SpendHeatmap period={period} dailyTotals={dailyTotals} today={today} />
      </div>
    ),
    'recent-ops': (
      <div className="card">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>последние операции</div>
          <button className="btn-ghost mono" style={{fontSize:11}} onClick={() => onNav('operations')}>все →</button>
        </div>
        <OpTable state={state} ops={lastOps} compact />
      </div>
    ),
  };

  const hidden = layout.filter(w => !w.enabled);

  return (
    <>
      {showBanner && (
        <Banner icon="!" onDismiss={onDismissBanner}
          actions={<button className="btn btn-sm" onClick={onExport}>экспортировать сейчас</button>}>
          С последнего экспорта прошло больше месяца. Рекомендуем сохранить резервную копию базы — это локальное приложение.
        </Banner>
      )}

      <div className="dash-toolbar between" style={{marginBottom:14}}>
        <div className="mono text-dim" style={{fontSize:11}}>
          {editing ? 'перетащите карточки за заголовок · нажмите × чтобы скрыть' : `${layout.filter(w=>w.enabled).length} из ${layout.length} виджетов`}
        </div>
        <div className="flex gap-8">
          {editing && <button className="btn btn-sm btn-ghost" onClick={resetLayout}>по умолчанию</button>}
          <button className={'btn btn-sm ' + (editing ? 'btn-primary' : '')} onClick={() => setEditing(e => !e)}>
            {editing ? 'готово' : 'переставить'}
          </button>
        </div>
      </div>

      <div className={'dash-grid ' + (editing ? 'editing' : '')}>
        {layout.filter(w => w.enabled).map(w => (
          <DashSlot
            key={w.id}
            widget={w}
            label={DASH_WIDGET_LABELS[w.id]}
            editing={editing}
            dragId={dragId}
            onDragStart={() => setDragId(w.id)}
            onDragEnd={() => setDragId(null)}
            onDropOn={() => { if (dragId) moveTo(dragId, w.id); setDragId(null); }}
            onHide={() => toggle(w.id)}
            onSpanChange={span => setSpan(w.id, span)}
          >
            {widgets[w.id]}
          </DashSlot>
        ))}
      </div>

      {editing && hidden.length > 0 && (
        <div className="card mt-16" style={{borderStyle:'dashed'}}>
          <div className="card-title mb-8" style={{marginBottom:10}}><span className="hash">#</span>скрытые виджеты</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {hidden.map(w => (
              <button key={w.id} className="btn btn-sm" onClick={() => toggle(w.id)}>
                + {DASH_WIDGET_LABELS[w.id] || w.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Draggable dashboard slot wrapper ---------- */
export function DashSlot({ widget, label, editing, children, onDragStart, onDragEnd, onDropOn, dragId, onHide, onSpanChange }) {
  const [over, setOver] = useState(false);
  const isDragging = dragId === widget.id;
  return (
    <div
      className={'dash-slot ' + (editing ? 'editing ' : '') + (isDragging ? 'dragging ' : '') + (over && dragId && dragId !== widget.id ? 'drop-over' : '')}
      style={{gridColumn: `span ${widget.span}`}}
      draggable={editing}
      onDragStart={e => { onDragStart(); e.dataTransfer.effectAllowed = 'move'; }}
      onDragEnd={onDragEnd}
      onDragOver={e => { if (editing && dragId) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDropOn(); }}
    >
      {editing && (
        <div className="dash-slot-bar mono">
          <span className="dash-handle">⋮⋮ {label}</span>
          <span className="dash-slot-actions">
            <button onClick={() => onSpanChange((widget.span % 4) + 1)} title="ширина 1–4 колонки">
              {widget.span}/4
            </button>
            <button onClick={onHide} title="скрыть">×</button>
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

/* =====================================================================
   OPERATIONS TABLE (shared)
===================================================================== */
export function OpTable({ state, ops, onEdit, compact }) {
  const catMap = Object.fromEntries(state.categories.map(c => [c.id, c]));
  const accMap = Object.fromEntries(state.accounts.map(a => [a.id, a]));
  return (
    <table className="t">
      <thead>
        <tr>
          <th style={{width:80}}>дата</th>
          <th>описание</th>
          <th>категория</th>
          {!compact && <th>счёт</th>}
          <th className="num" style={{width:120}}>сумма</th>
        </tr>
      </thead>
      <tbody>
        {ops.map(o => {
          const cat = catMap[o.categoryId];
          const acc = accMap[o.accountId];
          const to = accMap[o.toAccountId];
          const sign = o.type === 'income' ? '+' : o.type === 'expense' ? '−' : '↔';
          const cls = o.type === 'income' ? 'text-good' : o.type === 'expense' ? '' : 'text-dim';
          return (
            <tr key={o.id} onClick={() => onEdit && onEdit(o)} style={onEdit ? {cursor:'pointer'} : null}>
              <td className="dim">{fmtDate(o.date)}</td>
              <td>
                <div>{o.description || (o.type === 'transfer' ? `${acc?.name} → ${to?.name}` : cat?.name)}</div>
              </td>
              <td>
                {o.type === 'transfer' ? <span className="pill transfer">перевод</span> : <CatChip category={cat} useEmoji={state.settings.useEmoji} />}
              </td>
              {!compact && <td className="dim">{acc?.name}</td>}
              <td className={'num ' + cls}>{sign} {Math.abs(o.amount).toLocaleString('ru-RU')}</td>
            </tr>
          );
        })}
        {ops.length === 0 && (
          <tr><td colSpan={compact ? 4 : 5} style={{textAlign:'center', color:'var(--text-dim)', padding:'24px'}}>нет операций</td></tr>
        )}
      </tbody>
    </table>
  );
}

/* =====================================================================
   QUICK ENTRY — пачковый ввод операций
===================================================================== */

/* ---------- Upcoming income mini-block ---------- */
export function UpcomingIncome({ settings, today }) {
  const list = settings.recurringIncomes || [];
  if (list.length === 0) {
    return <div className="text-dim mono" style={{fontSize:12}}>регулярные доходы не настроены</div>;
  }
  const occ = list.map(it => {
    const day = Math.max(1, Math.min(28, it.day));
    let d = new Date(today.getFullYear(), today.getMonth(), day);
    if (d < today) d = new Date(today.getFullYear(), today.getMonth() + 1, day);
    const daysLeft = Math.round((d - today) / 86400000);
    return { ...it, date: d, daysLeft };
  }).sort((a,b) => a.daysLeft - b.daysLeft);
  const next = occ[0];
  const rest = occ.slice(1, 3);
  return (
    <>
      <div className="mono tabular" style={{fontSize:22, fontWeight:600, color:'var(--accent)', lineHeight:1.1}}>
        {next.daysLeft === 0 ? 'сегодня' : '+' + next.daysLeft + ' дн.'}
      </div>
      <div className="mono mt-8" style={{fontSize:12, color:'var(--text-soft)'}}>
        {next.label} · {next.date.getDate()} {RU_MONTH_SHORT[next.date.getMonth()]}
      </div>
      <div className="mono tabular" style={{fontSize:14, color:'var(--text)', marginTop:2}}>{next.amount.toLocaleString('ru-RU')} ₽</div>
      {rest.length > 0 && (
        <div className="mt-8" style={{display:'flex', flexDirection:'column', gap:3, paddingTop:8, borderTop:'1px dashed var(--border)'}}>
          {rest.map(r => (
            <div key={r.id} className="mono text-dim" style={{fontSize:11, display:'flex', justifyContent:'space-between', gap:6}}>
              <span>{r.label} · +{r.daysLeft}д</span>
              <span className="tabular">{fmtMoneyCompact(r.amount)} ₽</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function QuickEntry({ state, dispatch }) {
  const expCats = state.categories.filter(c => c.type === 'expense' && !c.archived);
  const incCats = state.categories.filter(c => c.type === 'income' && !c.archived);
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(state.anchorISO);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(expCats[0]?.id || '');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');
  const [description, setDescription] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [recent, setRecent] = useState([]); // last 3 added in this session
  const amountRef = useRef(null);

  function add() {
    if (!amount || !categoryId) return;
    const op = {
      id: 'op-' + Math.random().toString(36).slice(2,9),
      date, amount: +amount, type,
      categoryId, accountId,
      description: description.trim(),
      memberId: null,
      toAccountId: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    dispatch({ type:'addOp', op });
    setRecent(r => [{...op}, ...r].slice(0, 4));
    setAmount('');
    setDescription('');
    setTimeout(() => amountRef.current?.focus(), 0);
  }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  }

  const cats = type === 'expense' ? expCats : incCats;
  useEffect(() => {
    if (!cats.find(c => c.id === categoryId)) setCategoryId(cats[0]?.id || '');
  }, [type]);

  return (
    <div>
      <div className="between" style={{marginBottom:10, flexWrap:'wrap', gap:8}}>
        <div className="card-title"><span className="hash">#</span>быстрый ввод
          <span className="text-dim" style={{marginLeft:8, fontSize:10.5, letterSpacing:0, textTransform:'none'}}>tab между полями · ↵ записать и продолжить</span>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button className="btn btn-sm" onClick={() => setShowDate(s => !s)} style={{minWidth:130, justifyContent:'space-between'}}>
            <span>{date === state.anchorISO ? 'сегодня · ' + fmtDate(date) : fmtDate(date)}</span>
            <span className="text-dim">⌄</span>
          </button>
          <div className="seg">
            <button className={type==='expense'?'active':''} onClick={()=>setType('expense')}>расход</button>
            <button className={type==='income'?'active':''} onClick={()=>setType('income')}>доход</button>
          </div>
        </div>
      </div>

      {showDate && (
        <div style={{marginBottom:10, display:'flex', gap:8, alignItems:'center'}}>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} style={{maxWidth:200}} />
          <button className="btn btn-sm btn-ghost" onClick={() => { setDate(state.anchorISO); setShowDate(false); }}>сегодня</button>
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'110px minmax(140px, 1.2fr) 130px minmax(160px, 1.8fr) 60px', gap:8, alignItems:'center'}}>
        <input ref={amountRef} className="input tabular" type="number" placeholder="сумма" value={amount}
          autoFocus onChange={e=>setAmount(e.target.value)} onKeyDown={onKey} style={{textAlign:'right'}} />
        <select className="select" value={categoryId} onChange={e=>setCategoryId(e.target.value)} onKeyDown={onKey}>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select" value={accountId} onChange={e=>setAccountId(e.target.value)} onKeyDown={onKey}>
          {state.accounts.filter(a=>!a.archived).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input" placeholder="описание (опц.)" value={description}
          onChange={e=>setDescription(e.target.value)} onKeyDown={onKey} />
        <button className="btn btn-primary" onClick={add} style={{padding:'8px 4px', justifyContent:'center'}}>
          ↵
        </button>
      </div>

      {recent.length > 0 && (
        <div className="mt-12" style={{display:'flex', flexWrap:'wrap', gap:6, alignItems:'center'}}>
          <span className="mono text-dim" style={{fontSize:11}}>добавлено в эту сессию:</span>
          {recent.map((o, i) => {
            const c = state.categories.find(cc=>cc.id===o.categoryId);
            return (
              <span key={o.id} className="cat-chip" style={{borderColor:'var(--accent-soft)'}}>
                <span className="dot" style={{background: c?.color || 'var(--text-dim)'}}></span>
                {o.description || c?.name} · <span className="tabular text-soft">{Math.round(o.amount).toLocaleString('ru-RU')} ₽</span>
                <button className="btn-ghost mono" style={{fontSize:11, marginLeft:4, color:'var(--text-dim)'}}
                  onClick={()=>{ dispatch({type:'deleteOp', id:o.id}); setRecent(r=>r.filter(x=>x.id!==o.id)); }}
                  title="отменить">×</button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   OPERATIONS page
===================================================================== */
export function OperationsPage({ state, dispatch, period, onOpenModal }) {
  const [filterType, setFilterType] = useState('all');
  const [filterCat, setFilterCat] = useState('');
  const [filterAcc, setFilterAcc] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [editing, setEditing] = useState(null);

  let ops = state.operations.filter(o => inPeriod(o.date, period));
  if (filterType !== 'all') ops = ops.filter(o => o.type === filterType);
  if (filterCat) ops = ops.filter(o => o.categoryId === filterCat);
  if (filterAcc) ops = ops.filter(o => o.accountId === filterAcc || o.toAccountId === filterAcc);
  if (q.trim()) {
    const ql = q.toLowerCase();
    ops = ops.filter(o => (o.description || '').toLowerCase().includes(ql));
  }
  ops.sort((a,b) => {
    if (sort === 'date-desc') return b.date.localeCompare(a.date);
    if (sort === 'date-asc')  return a.date.localeCompare(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc')  return a.amount - b.amount;
    return 0;
  });

  const totalExp = ops.filter(o=>o.type==='expense').reduce((s,o)=>s+o.amount,0);
  const totalInc = ops.filter(o=>o.type==='income').reduce((s,o)=>s+o.amount,0);

  return (
    <>
      <div className="grid grid-3">
        <StatCard title="операций" value={ops.length} currency="" />
        <StatCard title="расходы (отфильтр.)" value={totalExp} />
        <StatCard title="доходы (отфильтр.)" value={totalInc} accent />
      </div>

      <div className="card mt-16">
        <QuickEntry state={state} dispatch={dispatch} />
        <div className="divider"></div>
        <div className="toolbar">
          <div className="seg">
            <button className={filterType==='all'?'active':''} onClick={()=>setFilterType('all')}>все</button>
            <button className={filterType==='expense'?'active':''} onClick={()=>setFilterType('expense')}>расходы</button>
            <button className={filterType==='income'?'active':''} onClick={()=>setFilterType('income')}>доходы</button>
            <button className={filterType==='transfer'?'active':''} onClick={()=>setFilterType('transfer')}>переводы</button>
          </div>
          <div className="search">
            <span>/</span>
            <input value={q} placeholder="поиск по описанию" onChange={e=>setQ(e.target.value)} />
          </div>
          <select className="select" value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{maxWidth:180}}>
            <option value="">все категории</option>
            {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select" value={filterAcc} onChange={e=>setFilterAcc(e.target.value)} style={{maxWidth:160}}>
            <option value="">все счета</option>
            {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="select" value={sort} onChange={e=>setSort(e.target.value)} style={{maxWidth:170}}>
            <option value="date-desc">дата ↓</option>
            <option value="date-asc">дата ↑</option>
            <option value="amount-desc">сумма ↓</option>
            <option value="amount-asc">сумма ↑</option>
          </select>
          <div style={{flex:1}}></div>
          <button className="btn btn-primary" onClick={()=>onOpenModal('expense')}>+ операция</button>
        </div>

        <OpTable state={state} ops={ops} onEdit={setEditing} />
      </div>

      {editing && (
        <OperationModal state={state} dispatch={dispatch} op={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

/* =====================================================================
   BUDGET (plan/fact)
===================================================================== */
export function BudgetPage({ state, dispatch, period }) {
  const [editing, setEditing] = useState(null);
  const ops = state.operations.filter(o => inPeriod(o.date, period));
  const byCatExp = {};
  ops.filter(o=>o.type==='expense').forEach(o => byCatExp[o.categoryId] = (byCatExp[o.categoryId]||0) + o.amount);
  const byCatInc = {};
  ops.filter(o=>o.type==='income').forEach(o => byCatInc[o.categoryId] = (byCatInc[o.categoryId]||0) + o.amount);

  const expCats = state.categories.filter(c => c.type === 'expense' && !c.archived);
  const incCats = state.categories.filter(c => c.type === 'income' && !c.archived);

  function setPlan(catId, kind, value) {
    dispatch({ type:'setPlan', catId, kind, value: +value || 0 });
  }

  function renderRows(cats, planMap, factMap, kind) {
    return cats.map(c => {
      const plan = planMap[c.id] || 0;
      const fact = factMap[c.id] || 0;
      const diff = plan - fact;
      const isEditing = editing === kind + ':' + c.id;
      return (
        <tr key={c.id}>
          <td>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <IconTile category={c} useEmoji={state.settings.useEmoji} />
              <div>
                <div>{c.name}</div>
                <div className="dim" style={{fontSize:10.5}}>{plan > 0 ? Math.round((fact/plan)*100) + '%' : '—'}</div>
              </div>
            </div>
          </td>
          <td className="num">
            {isEditing ? (
              <input className="input" autoFocus type="number" defaultValue={plan}
                onBlur={e => { setPlan(c.id, kind, e.target.value); setEditing(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { setPlan(c.id, kind, e.target.value); setEditing(null); } if (e.key === 'Escape') setEditing(null); }}
                style={{textAlign:'right', maxWidth:120, marginLeft:'auto'}} />
            ) : (
              <button className="btn-ghost mono tabular" style={{padding:'2px 6px', borderRadius:3}}
                onClick={()=>setEditing(kind+':'+c.id)} title="изменить план">
                {plan ? plan.toLocaleString('ru-RU') : '—'}
              </button>
            )}
          </td>
          <td className="num tabular">{fact.toLocaleString('ru-RU')}</td>
          <td className="num tabular" style={{color: diff < 0 ? 'var(--bad)' : 'var(--text-soft)'}}>
            {diff < 0 ? '−' : ''}{Math.abs(diff).toLocaleString('ru-RU')}
          </td>
          <td style={{width:'30%', minWidth:160}}>
            <div className="bar-track">
              <div className="bar-fill" style={{width: Math.min(plan ? fact/plan*100 : 0, 100) + '%', background: c.color}} />
              {fact > plan && plan > 0 && (
                <div className="bar-fill over" style={{left:'100%', width: Math.min((fact-plan)/plan*100, 40) + '%'}} />
              )}
            </div>
          </td>
        </tr>
      );
    });
  }

  const totalPlanExp = Object.values(state.plan.expenses).reduce((s,v)=>s+v,0);
  const totalFactExp = Object.values(byCatExp).reduce((s,v)=>s+v,0);
  const totalPlanInc = Object.values(state.plan.incomes).reduce((s,v)=>s+v,0);
  const totalFactInc = Object.values(byCatInc).reduce((s,v)=>s+v,0);

  return (
    <>
      <div className="grid grid-4">
        <StatCard title="план расходов" value={totalPlanExp} />
        <StatCard title="факт расходов" value={totalFactExp} sub={`${Math.round(totalFactExp/totalPlanExp*100)}% от плана`} />
        <StatCard title="план доходов" value={totalPlanInc} accent />
        <StatCard title="план накоплений" value={state.plan.savings} />
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>расходы · план / факт</div>
          <span className="card-sub">кликните по сумме плана чтобы изменить</span>
        </div>
        <table className="t">
          <thead>
            <tr>
              <th>категория</th>
              <th className="num">план</th>
              <th className="num">факт</th>
              <th className="num">остаток</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {renderRows(expCats, state.plan.expenses, byCatExp, 'expenses')}
            <tr style={{background:'var(--surface-2)'}}>
              <td style={{fontWeight:600}}>итого</td>
              <td className="num tabular" style={{fontWeight:600}}>{totalPlanExp.toLocaleString('ru-RU')}</td>
              <td className="num tabular" style={{fontWeight:600}}>{totalFactExp.toLocaleString('ru-RU')}</td>
              <td className="num tabular" style={{fontWeight:600, color: (totalPlanExp-totalFactExp)<0?'var(--bad)':'var(--text)'}}>
                {(totalPlanExp-totalFactExp)<0?'−':''}{Math.abs(totalPlanExp-totalFactExp).toLocaleString('ru-RU')}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card mt-16">
        <div className="card-h">
          <div className="card-title"><span className="hash">#</span>доходы · план / факт</div>
        </div>
        <table className="t">
          <thead>
            <tr>
              <th>категория</th>
              <th className="num">план</th>
              <th className="num">факт</th>
              <th className="num">остаток</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {renderRows(incCats, state.plan.incomes, byCatInc, 'incomes')}
            <tr style={{background:'var(--surface-2)'}}>
              <td style={{fontWeight:600}}>итого</td>
              <td className="num tabular" style={{fontWeight:600}}>{totalPlanInc.toLocaleString('ru-RU')}</td>
              <td className="num tabular" style={{fontWeight:600}}>{totalFactInc.toLocaleString('ru-RU')}</td>
              <td className="num tabular" style={{fontWeight:600, color: (totalPlanInc-totalFactInc)<0?'var(--good)':'var(--text)'}}>
                {(totalPlanInc-totalFactInc)<0?'+':''}{Math.abs(totalPlanInc-totalFactInc).toLocaleString('ru-RU')}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

Object.assign(window, { OperationModal, OpTable, DashboardPage, OperationsPage, BudgetPage });
