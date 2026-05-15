// @ts-nocheck — ported from prototype JS as-is. TODO: tighten types.
/* ============ App.tsx — root + state reducer + routing ============ */
import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { loadState, saveState, getLastExport, setLastExport as persistLastExport, periodFor, shiftPeriod, parseISO, STORAGE_KEY } from './data';
import { Sidebar, TopBar } from './components';
import { DashboardPage, OperationsPage, BudgetPage, OperationModal } from './pages';
import { CategoriesPage, AccountsPage, GoalsPage, AnalyticsPage, SettingsPage, ExportPage } from './pages2';

function reducer(state, action) {
  switch (action.type) {
    case 'addOp': {
      const ops = [...state.operations, action.op];
      const accounts = applyOpDelta(state.accounts, action.op, +1);
      return { ...state, operations: ops, accounts };
    }
    case 'updateOp': {
      const old = state.operations.find(o => o.id === action.op.id);
      let accounts = state.accounts;
      if (old) accounts = applyOpDelta(accounts, old, -1);
      accounts = applyOpDelta(accounts, action.op, +1);
      return { ...state, operations: state.operations.map(o => o.id === action.op.id ? action.op : o), accounts };
    }
    case 'deleteOp': {
      const op = state.operations.find(o => o.id === action.id);
      let accounts = state.accounts;
      if (op) accounts = applyOpDelta(accounts, op, -1);
      return { ...state, operations: state.operations.filter(o => o.id !== action.id), accounts };
    }
    case 'addCategory':    return { ...state, categories: [...state.categories, action.category] };
    case 'updateCategory': return { ...state, categories: state.categories.map(c => c.id === action.category.id ? action.category : c) };
    case 'deleteCategory': return { ...state, categories: state.categories.filter(c => c.id !== action.id) };
    case 'addAccount':     return { ...state, accounts: [...state.accounts, action.account] };
    case 'updateAccount':  return { ...state, accounts: state.accounts.map(a => a.id === action.account.id ? action.account : a) };
    case 'addGoal':        return { ...state, goals: [...state.goals, action.goal] };
    case 'updateGoal':     return { ...state, goals: state.goals.map(g => g.id === action.goal.id ? action.goal : g) };
    case 'deleteGoal':     return { ...state, goals: state.goals.filter(g => g.id !== action.id) };
    case 'setPlan': {
      const plan = { ...state.plan, [action.kind]: { ...state.plan[action.kind], [action.catId]: action.value } };
      return { ...state, plan };
    }
    case 'setSettings':    return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'clearOpsAndPlan': return {
      ...state,
      operations: [],
      plan: { expenses: {}, incomes: {}, savings: 0 },
    };
    case 'replace':        return action.state;
    default: return state;
  }
}

function applyOpDelta(accounts, op, sign) {
  return accounts.map(a => {
    let b = a.balance;
    if (op.type === 'expense' && op.accountId === a.id) b -= sign * op.amount;
    else if (op.type === 'income' && op.accountId === a.id) b += sign * op.amount;
    else if (op.type === 'transfer') {
      if (op.accountId === a.id) b -= sign * op.amount;
      if (op.toAccountId === a.id) b += sign * op.amount;
    }
    return b === a.balance ? a : { ...a, balance: b };
  });
}

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [route, setRoute] = useState('dashboard');
  const [modal, setModal] = useState(null); // {type:'expense'|'income'} | null
  const [periodOffset, setPeriodOffset] = useState(0); // offset from anchor period
  const [lastExport, setLastExport] = useState(getLastExport());

  // persist
  useEffect(() => { saveState(state); }, [state]);

  // theme + accent
  useEffect(() => {
    const apply = () => {
      let t = state.settings.theme;
      if (t === 'system') {
        t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', t);
      document.documentElement.setAttribute('data-accent', state.settings.accent || 'clay');
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [state.settings.theme, state.settings.accent]);

  const today = parseISO(state.anchorISO);
  const basePeriod = periodFor(today, state.settings);
  const period = useMemo(() => {
    if (!periodOffset) return basePeriod;
    let p = basePeriod;
    const dir = periodOffset > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(periodOffset); i++) p = shiftPeriod(p, dir, state.settings);
    return p;
  }, [periodOffset, state.anchorISO, state.settings]);

  function exportData() {
    const dump = { version: 1, exportedAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    const iso = new Date().toISOString().slice(0,10);
    setLastExport(iso);
    persistLastExport(iso);
  }

  function importData() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const dump = JSON.parse(r.result);
          if (!dump.state || !Array.isArray(dump.state.operations) || !Array.isArray(dump.state.categories)) {
            alert('Файл не похож на резервную копию budget.');
            return;
          }
          if (!confirm('Заменить текущие данные импортируемыми? Текущие будут удалены.')) return;
          dispatch({ type:'replace', state: dump.state });
          alert('База импортирована.');
        } catch (err) {
          alert('Не удалось прочитать файл: ' + err.message);
        }
      };
      r.readAsText(file);
    };
    inp.click();
  }

  function resetData() {
    if (!confirm('Удалить все данные и вернуть демо? Действие необратимо.')) return;
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type:'replace', state: loadState() });
  }

  // banner: show if last export > 30 days ago
  const showBanner = useMemo(() => {
    if (!state.settings.remindExport) return false;
    if (!lastExport) return true;
    const last = new Date(lastExport);
    return (Date.now() - last.getTime()) > 30 * 86400000;
  }, [lastExport, state.settings.remindExport]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'r') { e.preventDefault(); setModal({type:'expense'}); }
      else if (e.key === 'i') { e.preventDefault(); setModal({type:'income'}); }
      else if (e.key === '/') { e.preventDefault(); setRoute('operations'); }
      else if (e.key === '[') setPeriodOffset(o => o - 1);
      else if (e.key === ']') setPeriodOffset(o => o + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const titles = {
    dashboard:  'дашборд',
    operations: 'операции',
    budget:     'бюджет / план + факт',
    categories: 'категории',
    accounts:   'счета',
    goals:      'накопления',
    analytics:  'аналитика',
    settings:   'настройки',
    export:     'экспорт / резервная копия',
  };

  function renderPage() {
    const common = { state, dispatch, period, today, settings: state.settings };
    switch (route) {
      case 'dashboard':
        return <DashboardPage {...common}
          onOpenModal={t => setModal({type:t})}
          onNav={setRoute}
          lastExport={lastExport}
          onExport={exportData}
          onNewCategory={() => setRoute('categories')}
          onDismissBanner={() => { const iso = new Date().toISOString().slice(0,10); setLastExport(iso); persistLastExport(iso); }}
          showBanner={showBanner}
        />;
      case 'operations':
        return <OperationsPage {...common} onOpenModal={t => setModal({type:t})} />;
      case 'budget':     return <BudgetPage {...common} />;
      case 'categories': return <CategoriesPage {...common} />;
      case 'accounts':   return <AccountsPage {...common} />;
      case 'goals':      return <GoalsPage {...common} />;
      case 'analytics':  return <AnalyticsPage {...common} />;
      case 'settings':   return <SettingsPage state={state} dispatch={dispatch} settings={state.settings}
                                  lastExport={lastExport} onExport={exportData} onImport={importData} onReset={resetData} />;
      case 'export':     return <ExportPage state={state} lastExport={lastExport} onExport={exportData} onImport={importData} onReset={resetData} />;
      default: return null;
    }
  }

  return (
    <div className="app">
      <Sidebar current={route} onNav={setRoute} lastExport={lastExport} />
      <main className="main">
        <TopBar
          title={titles[route] || route}
          period={period}
          onPrev={() => setPeriodOffset(o => o - 1)}
          onNext={() => setPeriodOffset(o => o + 1)}
          onToday={() => setPeriodOffset(0)}
          rightSlot={
            <button className="btn btn-primary btn-sm" onClick={() => setModal({type:'expense'})}>
              + операция <span className="kbd" style={{marginLeft:6, background:'transparent', borderColor:'rgba(255,255,255,.3)', color:'inherit'}}>r</span>
            </button>
          }
        />
        <div className="content">{renderPage()}</div>
      </main>
      {modal && (
        <OperationModal state={state} dispatch={dispatch}
          defaultType={modal.type} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

