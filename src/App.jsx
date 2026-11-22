import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Download, Ellipsis,
  LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Sparkles, Users, X,
} from 'lucide-react';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeLabel = (value) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const toLocalDateTimeInput = (date) => { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); };
const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const colors = ['lavender', 'peach', 'mint', 'blue', 'pink', 'yellow'];

function App() {
  const [section, setSection] = useState('Overview');
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modal, setModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [studio, setStudio] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryRes, appointmentsRes, customersRes] = await Promise.all([
        fetch('/api/summary'), fetch('/api/appointments'), fetch('/api/customers'),
      ]);
      if (![summaryRes, appointmentsRes, customersRes].every((r) => r.ok)) throw new Error('API unavailable');
      setSummary(await summaryRes.json());
      setAppointments(await appointmentsRes.json());
      setCustomers(await customersRes.json());
    } catch {
      setToast('Could not connect to StudioFlow. Start the app with npm run dev.');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        if (data) { setAuthUser(data.user); setStudio(data.studio); }
      })
      .catch(() => {})
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (authUser) loadData(); }, [authUser]);
  async function handleAuthenticated(data) {
    setAuthUser(data.user);
    setStudio(data.studio);
  }
  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      setStudio(null);
      setSummary(null);
      setAppointments([]);
      setCustomers([]);
    } catch { setToast('Could not sign out. Please try again.'); }
  }
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3600); return () => clearTimeout(timer); }, [toast]);

  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    const matchesSearch = `${item.customer} ${item.service} ${item.email}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'all' || item.status === status);
  }), [appointments, search, status]);

  async function updateStatus(id, nextStatus) {
    try {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error();
      await loadData(); setToast(`Appointment marked ${nextStatus}.`);
    } catch { setToast('Could not update this appointment. Please try again.'); }
  }

  async function createAppointment(payload) {
    const response = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not create appointment.');
    setModal(false); await loadData(); setToast('New booking added successfully.');
  }

  const nav = [
    { name: 'Overview', icon: LayoutDashboard }, { name: 'Appointments', icon: CalendarDays, count: summary?.upcomingBookings },
    { name: 'Clients', icon: Users },
  ];

  if (authLoading) return <div className="auth-loading">Preparing your studio workspace…</div>;
  if (!authUser) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Sparkles size={19} strokeWidth={2.3} /></span><span>studio<span className="brand-light">flow</span></span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button></div>
      <div className="workspace-select"><div className="salon-logo">S</div><div className="workspace-copy"><strong>{studio?.name || "Your studio"}</strong><span>{studio?.slug || "Studio workspace"}</span></div><ChevronDown size={15} className="muted" /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-list">{nav.map(({ name, icon: Icon, count }) => <button key={name} className={`nav-item ${section === name ? 'active' : ''}`} onClick={() => { setSection(name); setMobileNav(false); }}><Icon size={18} /><span>{name}</span>{count > 0 && <small>{count}</small>}</button>)}</nav>
      <div className="nav-label tools-label">MANAGE</div>
      <button className="nav-item" onClick={() => setToast('Reports are coming soon.')}><Activity size={18} /><span>Reports</span></button>
      <button className="nav-item" onClick={() => setToast('Settings are coming soon.')}><Settings size={18} /><span>Settings</span></button>
      <div className="sidebar-spacer" />
      <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17} /></div><strong>Your studio, in sync.</strong><p>Everything you need to give every client a great day.</p><button onClick={() => setToast('You’re already on the StudioFlow preview plan.')}>Explore features <ArrowRight size={14} /></button><span className="upgrade-orb orb-one" /><span className="upgrade-orb orb-two" /></div>
      <button className="nav-item help-link" onClick={() => setToast('Need a hand? Write to hello@studioflow.app.')}><CircleHelp size={18} /><span>Help & support</span></button>
      <div className="profile"><div className="profile-avatar">{initials(authUser.name)}</div><div className="profile-copy"><strong>{authUser.name}</strong><span>{authUser.role === "owner" ? "Studio owner" : "Studio staff"}</span></div><button className="logout-button" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="icon-button menu-toggle" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21} /></button><div className="breadcrumb">{studio?.name || "Your studio"} <ChevronRight size={14} /> <span>{section}</span></div><div className="topbar-actions"><button className="today-button" onClick={() => setToast(dateLabel.format(new Date()))}><CalendarDays size={16} /> Today <ChevronDown size={13} /></button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast('You’re all caught up!')}><Bell size={19} /><i /></button><div className="top-avatar">AC</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">{dateLabel.format(new Date())}</div><h1>{section === 'Overview' ? `Good morning, ${authUser.name.split(' ')[0]}` : section}</h1><p>{section === 'Overview' ? 'Here’s what’s happening at your studio today.' : section === 'Clients' ? 'Get to know the people who make your studio special.' : 'Keep your day running right on schedule.'}</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={17} /> New booking</button></div>

        {section === 'Overview' && <>
          <section className="stats-grid">
            <StatCard label="Today’s bookings" value={summary?.todayBookings ?? '—'} icon={CalendarDays} tint="violet" change="Looking good" direction="up" helper={`${summary?.upcomingBookings ?? 0} upcoming bookings`} />
            <StatCard label="Today’s revenue" value={money(summary?.todayRevenue)} icon={Activity} tint="mint" change="On the books" direction="up" helper="From today’s appointments" />
            <StatCard label="Total clients" value={summary?.totalCustomers ?? '—'} icon={Users} tint="peach" change="Growing steadily" direction="up" helper="A lovely community" />
          </section>
          <section className="content-grid">
            <div className="panel appointments-panel"><div className="panel-header"><div><div className="panel-title-row"><h2>Today’s appointments</h2><span className="live-dot" /></div><p>A little look at your day</p></div><button className="text-button" onClick={() => setSection('Appointments')}>View schedule <ArrowRight size={15} /></button></div>
              <AppointmentList items={appointments.filter((item) => new Date(item.startsAt).toDateString() === new Date().toDateString()).slice(0, 5)} loading={loading} onStatus={updateStatus} compact />
            </div>
            <div className="panel clients-panel"><div className="panel-header"><div><h2>Lovely regulars</h2><p>Your growing client community</p></div><button className="icon-button" onClick={() => setSection('Clients')} aria-label="View clients"><ArrowRight size={16} /></button></div>
              <div className="client-list">{customers.slice(0, 5).map((client, i) => <div className="client-row" key={client.id}><Avatar name={client.name} index={i} /><div className="client-details"><strong>{client.name}</strong><span>{client.bookings} appointments</span></div><span className="client-spend">{money(client.lifetimeValue)}</span></div>)}</div>
              <button className="all-clients-button" onClick={() => setSection('Clients')}>See all clients <ArrowRight size={15} /></button>
            </div>
          </section>
          <section className="bottom-grid"><div className="panel rhythm-panel"><div className="panel-header"><div><h2>Your studio rhythm</h2><p>Completed appointments this month</p></div><span className="month-chip">This month <ChevronDown size={13} /></span></div><div className="rhythm-content"><div><div className="rhythm-number">{summary?.completedThisMonth ?? 0}<span> visits</span></div><div className="rhythm-caption"><span className="positive-mark"><ArrowUpRight size={14} /></span>Your clients love coming back</div></div><div className="mini-chart" aria-label="Weekly completed appointment trend">{[35, 56, 46, 72, 53, 88, 65, 44, 76, 58, 100, 70, 84, 61, 92, 48, 71, 86, 57, 100, 74, 53, 91, 64].map((height, i) => <span key={i} style={{ height: `${height}%` }} className={i > 18 ? 'bar-highlight' : ''} />)}</div></div></div>
            <div className="tip-card"><div className="tip-spark"><Sparkles size={19} /></div><span className="tip-label">A LITTLE REMINDER</span><p>Small moments of care make the biggest difference.</p><div className="tip-footer"><span>StudioFlow note</span><span className="tip-dot" /></div><span className="tip-orb" /></div></section>
        </>}

        {section === 'Appointments' && <section className="panel table-panel"><div className="panel-header"><div><h2>All appointments</h2><p>Your bookings, all in one place</p></div><button className="secondary-button" onClick={() => exportCsv(filteredAppointments)}><Download size={15} /> Export</button></div><div className="table-tools"><div className="search-box"><Search size={16} /><input placeholder="Search clients or services…" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></div><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div><AppointmentList items={filteredAppointments} loading={loading} onStatus={updateStatus} /></section>}

        {section === 'Clients' && <section className="panel table-panel"><div className="panel-header"><div><h2>All clients</h2><p>{customers.length} wonderful people in your community</p></div><div className="search-box"><Search size={16} /><input placeholder="Search clients…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="client-table-head"><span>CLIENT</span><span>CONTACT</span><span>APPOINTMENTS</span><span>LIFETIME VALUE</span></div><div className="full-client-list">{customers.filter((client) => `${client.name} ${client.email}`.toLowerCase().includes(search.toLowerCase())).map((client, i) => <div className="full-client-row" key={client.id}><div className="full-client-name"><Avatar name={client.name} index={i} /><strong>{client.name}</strong></div><div className="contact-cell"><span>{client.email}</span><small>{client.phone}</small></div><span className="client-count">{client.bookings} visits</span><strong>{money(client.lifetimeValue)}</strong></div>)}</div></section>}
        <footer className="page-footer"><span>Made with care for your studio <span className="footer-heart">♥</span></span><span>StudioFlow · 2026</span></footer>
      </div>
    </main>
    {mobileNav && <button className="backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
    {modal && <BookingModal onClose={() => setModal(false)} onSubmit={createAppointment} />}
    {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={15} /></button></div>}
  </div>;
}


function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = response.status === 204 ? {} : await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not sign in. Please try again.');
      onAuthenticated(data);
    } catch (err) {
      setError(err.message || 'Could not connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><span className="brand-mark"><Sparkles size={19} strokeWidth={2.3} /></span><span>studio<span className="brand-light">flow</span></span></div>
      <span className="auth-eyebrow">{mode === 'register' ? 'A BETTER DAY STARTS HERE' : 'WELCOME BACK'}</span>
      <h1>{mode === 'register' ? 'Create your studio account' : 'Sign in to your studio'}</h1>
      <p className="auth-intro">{mode === 'register' ? 'Set up your workspace to manage appointments and clients.' : 'Enter your studio details to continue to your workspace.'}</p>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' ? <>
          <label>Studio name<input name="studioName" autoComplete="organization" placeholder="e.g. Studio Serein" minLength="2" maxLength="120" required /></label>
          <label>Your name<input name="ownerName" autoComplete="name" placeholder="e.g. Priya Sharma" minLength="2" maxLength="120" required /></label>
        </> : <label>Studio address<input name="studioSlug" autoComplete="organization" placeholder="e.g. studio-serein-a1b2c3d4" required /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : 1} maxLength="128" placeholder={mode === 'register' ? 'At least 12 characters' : 'Your password'} required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button type="submit" className="primary-button auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create studio account' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">{mode === 'register' ? 'Already have an account?' : 'New to StudioFlow?'} <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>{mode === 'register' ? 'Sign in' : 'Create an account'}</button></p>
      <p className="auth-security">Your studio data is private to your workspace.</p>
    </section>
  </main>;
}

function StatCard({ label, value, icon: Icon, tint, change, direction, helper }) {
  const Trend = direction === 'down' ? ArrowDownRight : ArrowUpRight;
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tint}`}><Icon size={18} /></span></div><div className="stat-value">{value}</div><div className="stat-bottom"><span className="trend-chip"><Trend size={14} /> {change}</span><span>{helper}</span></div></div>;
}

function Avatar({ name, index = 0 }) { return <div className={`client-avatar ${colors[index % colors.length]}`}>{initials(name)}</div>; }

function AppointmentList({ items, loading, onStatus, compact = false }) {
  if (loading) return <div className="empty-state">Getting your day ready…</div>;
  if (!items.length) return <div className="empty-state"><span className="empty-icon"><CalendarDays size={20} /></span><strong>Nothing on the schedule yet</strong><span>Your bookings will show up here.</span></div>;
  return <div className={`appointment-list ${compact ? 'compact-list' : ''}`}>{items.map((item, i) => <div className="appointment-row" key={item.id}><div className="appointment-time">{timeLabel(item.startsAt)}<span>{item.durationMinutes} min</span></div><div className="appointment-connector"><span className="appointment-node" />{i !== items.length - 1 && <span className="connector-line" />}</div><Avatar name={item.customer} index={i} /><div className="appointment-info"><strong>{item.customer}</strong><span>{item.service}</span></div><div className="appointment-meta"><strong>{money(item.amount)}</strong><span className={`status-pill ${item.status}`}>{item.status === 'confirmed' ? 'Confirmed' : item.status === 'completed' ? 'Completed' : 'Cancelled'}</span></div>{!compact && item.status === 'confirmed' && <button className="row-action" onClick={() => onStatus(item.id, 'completed')} title="Mark complete"><Check size={16} /></button>}</div>)}</div>;
}

function BookingModal({ onClose, onSubmit }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [service, setService] = useState('Signature haircut');
  const priceMap = { 'Signature haircut': 1800, 'Color & gloss': 4200, 'Blowout': 1200, 'Deep conditioning': 2200 };
  async function handleSubmit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { await onSubmit(Object.fromEntries(form.entries())); }
    catch (e) { setError(e.message); setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="booking-modal"><div className="modal-header"><div><span className="modal-kicker">MAKE SOMEONE’S DAY</span><h2>New booking</h2><p>Add a new appointment to your schedule.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div><form onSubmit={handleSubmit}><div className="form-grid"><label>Client name<input name="name" placeholder="e.g. Priya Sharma" required /></label><label>Email address<input name="email" type="email" placeholder="client@example.com" required /></label><label>Phone number<input name="phone" type="tel" placeholder="+91 98765 43210" /></label><label>Service<select name="service" value={service} onChange={(e) => setService(e.target.value)}>{Object.keys(priceMap).map((item) => <option key={item}>{item}</option>)}</select></label><label>Appointment date & time<input name="startsAt" type="datetime-local" required defaultValue={toLocalDateTimeInput(new Date(Date.now() + 3600000))} /></label><label>Price (₹)<input name="amount" type="number" min="0" step="100" defaultValue={priceMap[service]} key={service} required /></label><label className="full-width">A note for the team <textarea name="notes" rows="2" placeholder="Anything we should know?" /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving…' : <><Plus size={16} /> Create booking</>}</button></div></form></div></div>;
}

function exportCsv(items) {
  const columns = ['Client', 'Service', 'Date', 'Time', 'Price', 'Status'];
  const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = items.map((item) => [item.customer, item.service, new Date(item.startsAt).toLocaleDateString('en-IN'), timeLabel(item.startsAt), item.amount, item.status]);
  const blob = new Blob([[columns, ...rows].map((row) => row.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'studioflow-appointments.csv'; anchor.click(); URL.revokeObjectURL(url);
}

export default App;
