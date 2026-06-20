/* global React, I */
const { useState } = React;

// === Login screen ===
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('rrhh@constructora-norte.pe');
  const [pwd, setPwd] = useState('••••••••••');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 600);
  };

  return (
    <div className="login-shell">
      <aside className="login-aside">
        <div className="login-brand">
          <div className="logo">RH</div>
          <span>Sistema HR</span>
        </div>
        <h1>Gestión laboral conforme al <em>TUO D. Leg. N° 728</em>.</h1>
        <p>Contratos, planillas, asistencia y vacaciones para empresas peruanas, en una sola plataforma multi-empresa.</p>
        <div className="login-pill-row">
          <span className="login-pill">Contratos · 7 modalidades</span>
          <span className="login-pill">UBIGEO INEI</span>
          <span className="login-pill">AFP / ONP</span>
          <span className="login-pill">Multi-tenant</span>
        </div>
        <div className="login-foot">
          <span>v0.4.0 · entorno producción</span>
          <span>Lima, Perú · GMT-5</span>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-card">
          <h2>Inicia sesión</h2>
          <p className="login-sub">Acceso al portal administrativo de Recursos Humanos.</p>

          <form className="login-form" onSubmit={submit}>
            <div>
              <label>Correo corporativo</label>
              <div className="field-input">
                <span className="icon">{I.mail}</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/>
              </div>
            </div>
            <div>
              <label>Contraseña</label>
              <div className="field-input">
                <span className="icon">{I.lock}</span>
                <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} autoComplete="current-password"/>
                <span className="icon" style={{ cursor: 'pointer' }}>{I.eye}</span>
              </div>
            </div>
            <div className="options">
              <label className="check">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>
                <span>Mantener sesión</span>
              </label>
              <a href="#forgot">Olvidé mi contraseña</a>
            </div>
            <button type="submit" className="submit" disabled={loading}>
              {loading ? 'Verificando…' : <>Ingresar {I.right}</>}
            </button>
          </form>

          <div className="login-divider">o</div>
          <button className="login-sso">
            {I.shield} Continuar con Microsoft 365
          </button>

          <p className="legal">
            Al continuar aceptas la <a href="#tyc" style={{ color: 'var(--accent)' }}>Política de Privacidad</a>.<br/>
            Tu sesión es protegida con JWT + refresh.
          </p>
        </div>
      </main>
    </div>
  );
}

// === Sidebar ===
function Sidebar({ route, setRoute, alerts }) {
  const main = [
    { id: 'dashboard', label: 'Inicio', icon: I.home },
    { id: 'colaboradores', label: 'Colaboradores', icon: I.users, badge: '74' },
    { id: 'contratos', label: 'Contratos', icon: I.contract, badge: alerts.expiring > 0 ? alerts.expiring : null },
    { id: 'asistencia', label: 'Asistencia', icon: I.clock },
    { id: 'vacaciones', label: 'Vacaciones y ausencias', icon: I.palmtree },
  ];
  const adm = [
    { id: 'reportes', label: 'Reportes', icon: I.chart },
    { id: 'configuracion', label: 'Configuración', icon: I.settings },
  ];

  const Item = ({ it }) => (
    <div className={`nav-item ${route === it.id ? 'active' : ''}`} onClick={() => setRoute(it.id)}>
      <span className="icon">{it.icon}</span>
      <span>{it.label}</span>
      {it.badge && <span className="badge">{it.badge}</span>}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">RH</div>
        <div>
          <div className="title">Sistema HR</div>
          <div className="sub">Recursos Humanos</div>
        </div>
      </div>

      <div className="sidebar-tenant">
        <div className="avatar">CN</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name">Constructora Norte S.A.C.</div>
          <div className="ruc">RUC 20512345678</div>
        </div>
        <span style={{ color: 'var(--text-mute)' }}>{I.down}</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">Operación</div>
        {main.map(it => <Item key={it.id} it={it}/>)}
        <div className="nav-group-label">Administración</div>
        {adm.map(it => <Item key={it.id} it={it}/>)}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">MQ</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name">María F. Quispe</div>
          <div className="role">Administrador RR.HH.</div>
        </div>
        <button className="icon-btn" title="Cerrar sesión">{I.logout}</button>
      </div>
    </aside>
  );
}

// === Topbar ===
function Topbar({ crumbs }) {
  return (
    <header className="topbar">
      <div className="crumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
            {i < crumbs.length - 1 && <span className="sep">/</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-search">
        <span>{I.search}</span>
        <input placeholder="Buscar colaborador, DNI o contrato…"/>
        <span className="kbd">⌘ K</span>
      </div>
      <button className="icon-btn" title="Ayuda">{I.help}</button>
      <button className="icon-btn" title="Notificaciones">
        {I.bell}
        <span className="dot"/>
      </button>
    </header>
  );
}

Object.assign(window, { LoginScreen, Sidebar, Topbar });
