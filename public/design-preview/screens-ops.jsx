/* global React, I, employees, departments, reports, formatPEN, formatDate, daysUntil */
const { useState: useStateOp } = React;

// === Asistencia ===
function Asistencia({ goto }) {
  const [date, setDate] = useStateOp('2026-05-20');
  const today = employees.slice(0, 9).map((e, i) => {
    const seeds = [
      { in: '08:42', out: '18:05', status: 'A tiempo' },
      { in: '09:12', out: '18:10', status: 'Tarde' },
      { in: '08:30', out: '17:55', status: 'A tiempo' },
      { in: '08:05', out: '17:30', status: 'A tiempo' },
      { in: '09:25', out: '—', status: 'Tarde' },
      { in: '—', out: '—', status: 'Ausente' },
      { in: '08:55', out: '18:00', status: 'A tiempo' },
      { in: '08:48', out: '18:00', status: 'A tiempo' },
      { in: '—', out: '—', status: 'Justificada' },
    ];
    return { ...e, ...seeds[i] };
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asistencia</h1>
          <p className="page-sub">Marcaciones biométricas + check-in por celular</p>
        </div>
        <div className="page-actions">
          <button className="btn">{I.download} Exportar CSV</button>
          <button className="btn btn-primary">{I.fingerprint} Sincronizar terminal</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Marcaciones hoy</div>
          <div className="kpi-value tabular">71<span style={{ fontSize: 16, color: 'var(--text-mute)', fontWeight: 400 }}> / 74</span></div>
          <div className="kpi-meta">96.2% de asistencia</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Tardanzas</div>
          <div className="kpi-value tabular" style={{ color: 'oklch(0.5 0.15 70)' }}>5</div>
          <div className="kpi-meta">Acumulado en mayo: 23</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Ausencias justificadas</div>
          <div className="kpi-value tabular">3</div>
          <div className="kpi-meta">2 médicas · 1 trámite</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Horas extras (semana)</div>
          <div className="kpi-value tabular">38h</div>
          <div className="kpi-meta">8 colaboradores</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="hstack">
            <button className="btn btn-sm">{I.left}</button>
            <input type="date" className="mono" style={{
              border: '1px solid var(--border-strong)', padding: '6px 10px',
              borderRadius: 8, fontSize: 13.5, background: 'var(--surface)'
            }} value={date} onChange={e => setDate(e.target.value)}/>
            <button className="btn btn-sm">{I.right}</button>
            <span className="soft" style={{ marginLeft: 8, fontSize: 13 }}>Miércoles 20 de mayo de 2026</span>
          </div>
          <div className="seg">
            <button className="active">Día</button>
            <button>Semana</button>
            <button>Mes</button>
          </div>
        </div>
        <div className="card-flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Área</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Estado</th>
                <th>Origen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {today.map(e => {
                const tone = e.status === 'A tiempo' ? 'badge-success' :
                            e.status === 'Tarde' ? 'badge-warning' :
                            e.status === 'Ausente' ? 'badge-danger' : 'badge-info';
                const hours = e.in !== '—' && e.out !== '—' ?
                  ((parseInt(e.out.split(':')[0]) + parseInt(e.out.split(':')[1]) / 60) -
                   (parseInt(e.in.split(':')[0]) + parseInt(e.in.split(':')[1]) / 60)).toFixed(1) + ' h'
                  : '—';
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="row-emp">
                        <span className="emp-avatar" style={{ background: e.color }}>{e.initials}</span>
                        <div className="emp-name">{e.name}</div>
                      </div>
                    </td>
                    <td className="soft" style={{ fontSize: 13 }}>{e.dept}</td>
                    <td className="mono" style={{ fontSize: 13 }}>{e.in}</td>
                    <td className="mono" style={{ fontSize: 13 }}>{e.out}</td>
                    <td className="mono" style={{ fontSize: 13 }}>{hours}</td>
                    <td><span className={`badge ${tone}`}>{e.status}</span></td>
                    <td className="soft" style={{ fontSize: 12 }}>
                      {e.status === 'Ausente' || e.status === 'Justificada' ? '—' :
                       Math.random() > 0.5 ? 'Biométrico · Sede Central' : 'App móvil'}
                    </td>
                    <td className="action-cell"><button className="btn btn-ghost btn-icon">{I.dots}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// === Vacaciones ===
function Vacaciones({ goto }) {
  // May 2026: 1 May = Friday
  const days = [];
  // empty before
  for (let i = 0; i < 4; i++) days.push({ off: true, label: 27 + i });
  for (let i = 1; i <= 31; i++) days.push({ d: i });
  // pad after
  while (days.length % 7 !== 0) days.push({ off: true, label: days.length - 34 });

  const eventsByDay = {
    5: [{ t: 'A. Rivera', kind: 'vac' }],
    6: [{ t: 'A. Rivera', kind: 'vac' }],
    7: [{ t: 'A. Rivera', kind: 'vac' }],
    8: [{ t: 'A. Rivera', kind: 'vac' }],
    12: [{ t: 'C. Vargas — médico', kind: 'warn' }],
    18: [{ t: 'V. Bermúdez', kind: 'vac' }, { t: 'D. Soto', kind: 'vac' }],
    19: [{ t: 'V. Bermúdez', kind: 'vac' }, { t: 'D. Soto', kind: 'vac' }],
    20: [{ t: 'V. Bermúdez', kind: 'vac' }, { t: 'D. Soto', kind: 'vac' }],
    25: [{ t: 'L. Tello — médico', kind: 'warn' }],
    28: [{ t: 'R. Cárdenas', kind: 'vac' }],
    29: [{ t: 'R. Cárdenas', kind: 'vac' }],
  };

  const requests = [
    { who: employees[2], days: 15, from: '2026-06-15', to: '2026-06-29', kind: 'Vacaciones', status: 'Pendiente' },
    { who: employees[5], days: 3, from: '2026-05-25', to: '2026-05-27', kind: 'Licencia médica', status: 'Aprobada' },
    { who: employees[6], days: 7, from: '2026-07-01', to: '2026-07-07', kind: 'Vacaciones', status: 'Pendiente' },
    { who: employees[8], days: 2, from: '2026-05-26', to: '2026-05-27', kind: 'Permiso personal', status: 'Rechazada' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vacaciones y ausencias</h1>
          <p className="page-sub">Calendario del equipo · 8 colaboradores con descanso este mes</p>
        </div>
        <div className="page-actions">
          <button className="btn">{I.download} Exportar plan anual</button>
          <button className="btn btn-primary">{I.plus} Registrar ausencia</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="hstack">
              <button className="btn btn-sm btn-icon">{I.left}</button>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Mayo 2026</span>
              <button className="btn btn-sm btn-icon">{I.right}</button>
            </div>
            <div className="hstack" style={{ fontSize: 12, color: 'var(--text-soft)', gap: 14 }}>
              <span className="hstack"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'oklch(0.85 0.06 var(--accent-h))' }}/> Vacaciones</span>
              <span className="hstack"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'oklch(0.85 0.06 70)' }}/> Licencia</span>
              <span className="hstack"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'oklch(0.85 0.06 25)' }}/> Falta</span>
            </div>
          </div>
          <div className="card-body">
            <div className="cal-grid">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => <div key={d} className="cal-cell head">{d}</div>)}
              {days.map((c, i) => (
                <div key={i} className={`cal-cell ${c.off ? 'off' : ''} ${c.d === 20 ? 'today' : ''}`}>
                  <div className="cal-day">{c.off ? c.label : c.d}</div>
                  {!c.off && (eventsByDay[c.d] || []).map((ev, j) => (
                    <div key={j} className={`ev ${ev.kind === 'warn' ? 'warn' : ''}`}>{ev.t}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="vstack" style={{ gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Saldo del equipo</h3>
              <span className="muted" style={{ fontSize: 12 }}>al 20/05/2026</span>
            </div>
            <div className="card-body">
              <div className="vstack" style={{ gap: 14 }}>
                {employees.slice(0, 4).map(e => {
                  const used = Math.floor(Math.random() * 18);
                  const total = 30;
                  return (
                    <div key={e.id}>
                      <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{e.name.split(' ').slice(0, 2).join(' ')}</span>
                        <span className="mono" style={{ fontSize: 12 }}>{total - used} / {total} días</span>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${(used / total) * 100}%`, background: used > 20 ? 'var(--danger)' : 'var(--accent)' }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Solicitudes pendientes</h3>
              <span className="badge badge-warning">2 nuevas</span>
            </div>
            <div className="card-flush">
              {requests.map((r, i) => {
                const tone = r.status === 'Aprobada' ? 'badge-success' :
                            r.status === 'Pendiente' ? 'badge-warning' : 'badge-danger';
                return (
                  <div key={i} style={{ padding: '12px 18px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                    <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="hstack">
                        <span className="emp-avatar" style={{ background: r.who.color }}>{r.who.initials}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.who.name.split(' ').slice(0, 2).join(' ')}</div>
                          <div className="soft" style={{ fontSize: 12 }}>{r.kind} · {r.days} días</div>
                          <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2 }}>
                            {formatDate(r.from)} → {formatDate(r.to)}
                          </div>
                        </div>
                      </div>
                      <div className="vstack" style={{ alignItems: 'flex-end', gap: 6 }}>
                        <span className={`badge ${tone}`}>{r.status}</span>
                        {r.status === 'Pendiente' && (
                          <div className="hstack" style={{ gap: 4 }}>
                            <button className="btn btn-sm">{I.check}</button>
                            <button className="btn btn-sm">{I.x}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// === Reportes ===
function Reportes({ goto }) {
  const cats = [
    { label: 'Planilla', icon: I.briefcase, count: 18, color: 'oklch(0.55 0.14 var(--accent-h))' },
    { label: 'Contratos', icon: I.contract, count: 9, color: 'oklch(0.7 0.13 70)' },
    { label: 'Asistencia', icon: I.clock, count: 24, color: 'oklch(0.6 0.12 145)' },
    { label: 'Vacaciones', icon: I.palmtree, count: 6, color: 'oklch(0.65 0.1 230)' },
    { label: 'Indicadores', icon: I.chart, count: 11, color: 'oklch(0.6 0.13 320)' },
    { label: 'Cumplimiento', icon: I.shield, count: 7, color: 'oklch(0.5 0.16 25)' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">Genera, programa y descarga reportes de RR.HH.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Programados</button>
          <button className="btn btn-primary">{I.plus} Nuevo reporte</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        {cats.map(c => (
          <div key={c.label} className="card" style={{ padding: 16, cursor: 'pointer' }}>
            <span style={{ color: c.color, display: 'block', marginBottom: 10 }}>{c.icon}</span>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
            <div className="soft" style={{ fontSize: 12, marginTop: 2 }}>{c.count} plantillas</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Generados recientemente</h3>
          <div className="hstack">
            <div className="search-input" style={{ width: 220 }}>
              <span>{I.search}</span>
              <input placeholder="Buscar…"/>
            </div>
            <button className="btn btn-sm">{I.filter}</button>
          </div>
        </div>
        <div className="card-flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Código</th>
                <th>Reporte</th>
                <th>Categoría</th>
                <th>Actualizado</th>
                <th>Tamaño</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.code}>
                  <td className="mono" style={{ fontSize: 12.5 }}>{r.code}</td>
                  <td>
                    <span className="hstack">
                      <span style={{ color: 'var(--text-mute)' }}>{I.doc}</span>
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                    </span>
                  </td>
                  <td><span className="badge badge-neutral no-dot">{r.kind}</span></td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{formatDate(r.updated)}</td>
                  <td className="mono" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{r.size}</td>
                  <td className="action-cell">
                    <div className="hstack" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-icon" title="Descargar">{I.download}</button>
                      <button className="btn btn-ghost btn-icon" title="Ver">{I.external}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// === Configuración ===
function Configuracion({ goto }) {
  const [tab, setTab] = useStateOp('empresa');
  const users = [
    { name: 'María F. Quispe', email: 'mquispe@empresa.pe', role: 'Administrador', last: 'Hace 5 min' },
    { name: 'José R. Pérez', email: 'jperez@empresa.pe', role: 'RR.HH.', last: 'Hace 1 h' },
    { name: 'Mariana Cabrera', email: 'mcabrera@empresa.pe', role: 'RR.HH.', last: 'Hace 3 h' },
    { name: 'Carlos A. Vargas', email: 'cvargas@empresa.pe', role: 'Colaborador', last: 'Hoy 09:12' },
    { name: 'Rodrigo Cárdenas', email: 'rcardenas@empresa.pe', role: 'Gerencia', last: 'Ayer 18:40' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-sub">Empresa, usuarios, roles e integraciones</p>
        </div>
      </div>

      <div className="tabs">
        {['empresa', 'usuarios', 'roles', 'integraciones', 'apariencia'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'empresa' && (
        <div className="vstack" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Datos de la empresa</h3></div>
            <div className="card-body">
              <div className="form-row cols-3">
                <div className="field"><label>Razón social</label><input defaultValue="Constructora Norte S.A.C."/></div>
                <div className="field"><label>Nombre comercial</label><input defaultValue="Constructora Norte"/></div>
                <div className="field"><label>RUC</label><input className="mono" defaultValue="20512345678"/></div>
                <div className="field"><label>Régimen tributario</label><select><option>Régimen General</option><option>MYPE Tributario</option><option>Especial</option></select></div>
                <div className="field"><label>Sector económico</label><select><option>Construcción</option><option>Servicios</option><option>Comercio</option></select></div>
                <div className="field"><label>Fecha de constitución</label><input className="mono" defaultValue="18/02/2010"/></div>
                <div className="field" style={{ gridColumn: 'span 2' }}><label>Domicilio fiscal</label><input defaultValue="Av. Javier Prado Este 4990, San Borja, Lima"/></div>
                <div className="field"><label>Teléfono</label><input className="mono" defaultValue="(01) 712 4500"/></div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Sedes</h3><button className="btn btn-sm">{I.plus} Agregar sede</button></div>
            <div className="card-flush">
              <table className="tbl">
                <thead><tr><th>Sede</th><th>Dirección</th><th>UBIGEO</th><th>Colaboradores</th><th></th></tr></thead>
                <tbody>
                  <tr><td><b>Sede Central</b></td><td>Av. Javier Prado Este 4990, San Borja</td><td className="mono">150130</td><td className="num">52</td><td className="action-cell"><button className="btn btn-ghost btn-icon">{I.edit}</button></td></tr>
                  <tr><td><b>Oficina Norte</b></td><td>Av. Brasil 2950, Magdalena</td><td className="mono">150120</td><td className="num">16</td><td className="action-cell"><button className="btn btn-ghost btn-icon">{I.edit}</button></td></tr>
                  <tr><td><b>Almacén Lurín</b></td><td>Km 31.5 Panamericana Sur, Lurín</td><td className="mono">150116</td><td className="num">6</td><td className="action-cell"><button className="btn btn-ghost btn-icon">{I.edit}</button></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Usuarios del sistema</h3>
            <button className="btn btn-primary btn-sm">{I.plus} Invitar usuario</button>
          </div>
          <div className="card-flush">
            <table className="tbl">
              <thead><tr><th>Usuario</th><th>Rol</th><th>Último acceso</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <div className="row-emp">
                        <span className="emp-avatar" style={{ background: `oklch(0.7 0.1 ${i * 60})` }}>
                          {u.name.split(' ').map(x => x[0]).slice(0, 2).join('')}
                        </span>
                        <div>
                          <div className="emp-name">{u.name}</div>
                          <div className="emp-id">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info no-dot">{u.role}</span></td>
                    <td className="soft" style={{ fontSize: 13 }}>{u.last}</td>
                    <td><span className="badge badge-success">Activo</span></td>
                    <td className="action-cell"><button className="btn btn-ghost btn-icon">{I.dots}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Administrador', desc: 'Control total del sistema', users: 1, perms: ['Crear / editar / eliminar', 'Ver auditoría', 'Configurar empresa', 'Gestionar usuarios'] },
            { name: 'RR.HH.', desc: 'Gestión operativa de personal', users: 3, perms: ['Crear contratos', 'Aprobar vacaciones', 'Editar colaboradores', 'Generar planilla'] },
            { name: 'Gerencia', desc: 'Solo lectura + reportes', users: 4, perms: ['Ver dashboards', 'Descargar reportes', 'Ver auditoría'] },
            { name: 'Colaborador', desc: 'Auto-servicio', users: 74, perms: ['Ver su perfil', 'Solicitar vacaciones', 'Descargar boletas', 'Marcar asistencia'] },
          ].map(r => (
            <div key={r.name} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{r.name}</h3>
                  <div className="card-sub">{r.desc}</div>
                </div>
                <span className="badge badge-neutral no-dot">{r.users} {r.users === 1 ? 'usuario' : 'usuarios'}</span>
              </div>
              <div className="card-body">
                <div className="vstack" style={{ gap: 6 }}>
                  {r.perms.map(p => (
                    <div key={p} className="hstack" style={{ fontSize: 13 }}>
                      <span style={{ color: 'var(--success)' }}>{I.check}</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'integraciones' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'RENIEC', desc: 'Verificación de DNI en línea', on: true, kind: 'API gubernamental' },
            { name: 'SUNAT — PLAME', desc: 'Generación automática de planilla electrónica', on: true, kind: 'Declaración' },
            { name: 'BCP', desc: 'Envío de planilla por archivo CRP', on: true, kind: 'Banco' },
            { name: 'BBVA', desc: 'Envío de planilla por archivo TXT', on: false, kind: 'Banco' },
            { name: 'Microsoft 365', desc: 'SSO con cuentas corporativas', on: true, kind: 'Identidad' },
            { name: 'AFP Net', desc: 'Reporte de aportes a las 4 AFP', on: true, kind: 'Pensiones' },
          ].map(integ => (
            <div key={integ.name} className="card">
              <div className="card-body">
                <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{integ.name}</div>
                  <button className={`switch ${integ.on ? 'on' : ''}`}></button>
                </div>
                <div className="soft" style={{ fontSize: 12.5, marginBottom: 10 }}>{integ.desc}</div>
                <span className="badge badge-neutral no-dot">{integ.kind}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'apariencia' && (
        <div className="card">
          <div className="card-body">
            <p className="soft" style={{ margin: 0, fontSize: 13.5 }}>
              Usa el panel de <b>Tweaks</b> (esquina inferior derecha) para cambiar tema, densidad y color de acento.
              Estos ajustes son por dispositivo.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { Asistencia, Vacaciones, Reportes, Configuracion });
