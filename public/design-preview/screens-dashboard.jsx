/* global React, I, employees, departments, activity, formatPEN, formatDate, daysUntil */
const { useMemo: useMemoDash } = React;

function Dashboard({ goto }) {
  const expiring = employees.filter(e => e.end && daysUntil(e.end) !== null && daysUntil(e.end) <= 60 && daysUntil(e.end) >= 0);

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const headcountSeries = [62, 64, 65, 65, 68, 69, 71, 72, 73, 73, 74, 74];
  const max = Math.max(...headcountSeries);

  // Donut: contract types
  const types = [
    { label: 'Indeterminado', value: 38, color: 'oklch(0.55 0.14 var(--accent-h))' },
    { label: 'Plazo fijo', value: 26, color: 'oklch(0.7 0.13 70)' },
    { label: 'Tiempo parcial', value: 7, color: 'oklch(0.6 0.12 145)' },
    { label: 'Modalidad formativa', value: 3, color: 'oklch(0.65 0.1 230)' },
  ];
  const total = types.reduce((s, t) => s + t.value, 0);
  let cum = 0;
  const segs = types.map(t => {
    const start = cum;
    cum += t.value / total * 100;
    return { ...t, start, end: cum };
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buen día, María. Esto es lo que pasa hoy.</h1>
          <p className="page-sub">Miércoles 20 de mayo de 2026 · Constructora Norte S.A.C. · 74 colaboradores activos.</p>
        </div>
        <div className="page-actions">
          <button className="btn">{I.download} Exportar resumen</button>
          <button className="btn btn-primary" onClick={() => goto('contratos-nuevo')}>{I.plus} Nuevo contrato</button>
        </div>
      </div>

      {/* === KPI cards === */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Colaboradores activos</div>
          <div className="kpi-value tabular">74</div>
          <div className="kpi-meta"><span className="delta-up hstack" style={{ gap: 2 }}>{I.arrowUp} 4</span> vs. abril</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Planilla mensual</div>
          <div className="kpi-value tabular">S/ 412,580</div>
          <div className="kpi-meta"><span className="delta-up hstack" style={{ gap: 2 }}>{I.arrowUp} 2.1%</span> vs. abril</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Contratos por vencer</div>
          <div className="kpi-value tabular" style={{ color: 'oklch(0.5 0.15 70)' }}>{expiring.length || 5}</div>
          <div className="kpi-meta">En los próximos 60 días</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Asistencia hoy</div>
          <div className="kpi-value tabular">96.2%</div>
          <div className="kpi-meta">71 marcaron · 3 ausentes justificados</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Headcount over time */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Headcount · últimos 12 meses</h3>
              <div className="card-sub">Total contratado, no incluye prácticas</div>
            </div>
            <div className="seg">
              <button className="active">Mes</button>
              <button>Trimestre</button>
              <button>Año</button>
            </div>
          </div>
          <div className="card-body" style={{ paddingBottom: 36 }}>
            <div className="bar-chart">
              {headcountSeries.map((v, i) => (
                <div key={i} className={`bar ${i === headcountSeries.length - 1 ? 'this' : ''}`}
                     style={{ height: `${(v / max) * 100}%` }} title={`${months[i]}: ${v}`}>
                  <span className="bar-label">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contract distribution donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Distribución por modalidad</h3>
              <div className="card-sub">TUO D. Leg. N° 728</div>
            </div>
          </div>
          <div className="card-body">
            <div className="donut-wrap">
              <svg viewBox="0 0 36 36" width="140" height="140">
                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface-2)" strokeWidth="4"/>
                {segs.map((s, i) => {
                  const C = 2 * Math.PI * 14;
                  const dash = ((s.end - s.start) / 100) * C;
                  const gap = C - dash;
                  const rotate = (s.start / 100) * 360 - 90;
                  return (
                    <circle key={i} cx="18" cy="18" r="14" fill="none"
                            stroke={s.color} strokeWidth="4"
                            strokeDasharray={`${dash} ${gap}`}
                            transform={`rotate(${rotate} 18 18)`}/>
                  );
                })}
              </svg>
              <div className="donut-center">
                <div>
                  <div className="v tabular">74</div>
                  <div className="l">colaboradores</div>
                </div>
              </div>
            </div>
            <div className="vstack" style={{ gap: 8, marginTop: 8 }}>
              {types.map((t, i) => (
                <div key={i} className="hstack" style={{ justifyContent: 'space-between' }}>
                  <div className="hstack">
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color, display: 'inline-block' }}/>
                    <span style={{ fontSize: 13 }}>{t.label}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 20 }}/>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Expiring contracts alert */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Contratos que requieren atención</h3>
              <div className="card-sub">Renovar, convertir a indeterminado o cerrar antes del vencimiento</div>
            </div>
            <button className="btn btn-sm" onClick={() => goto('contratos')}>Ver todos {I.right}</button>
          </div>
          <div className="card-flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Modalidad</th>
                  <th>Vence</th>
                  <th>Días</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expiring.slice(0, 5).map(e => {
                  const days = daysUntil(e.end);
                  const tone = days <= 30 ? 'badge-danger' : days <= 60 ? 'badge-warning' : 'badge-info';
                  return (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => goto('colaborador', e.id)}>
                      <td>
                        <div className="row-emp">
                          <span className="emp-avatar" style={{ background: e.color }}>{e.initials}</span>
                          <div>
                            <div className="emp-name">{e.name}</div>
                            <div className="emp-id">DNI {e.id}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="soft">{e.contractSub || e.contractKind}</span></td>
                      <td className="mono" style={{ fontSize: 13 }}>{formatDate(e.end)}</td>
                      <td><span className={`badge ${tone}`}>{days} días</span></td>
                      <td className="action-cell">
                        <button className="btn btn-sm">Renovar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Actividad reciente</h3>
            <button className="btn btn-ghost btn-sm">{I.refresh}</button>
          </div>
          <div className="activity">
            {activity.map((a, i) => (
              <div key={i} className="activity-item">
                <span className="activity-dot" style={{
                  background: a.kind === 'alert' ? 'var(--warning)' :
                              a.kind === 'doc' ? 'var(--info)' :
                              a.kind === 'contract' ? 'var(--accent)' :
                              a.kind === 'report' ? 'var(--success)' : 'var(--text-mute)'
                }}/>
                <div className="activity-body">
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-meta">{a.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 20 }}/>

      {/* Departments */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Headcount por área</h3>
            <div className="card-sub">7 áreas activas</div>
          </div>
          <button className="btn btn-sm btn-ghost">Ver detalle {I.right}</button>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {departments.map(d => (
            <div key={d.name} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 4 }}>{d.name}</div>
              <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="tabular" style={{ fontSize: 22, fontWeight: 600 }}>{d.headcount}</div>
                <div className={d.growth.startsWith('+') ? 'delta-up' : d.growth.startsWith('−') ? 'delta-down' : 'soft'}
                     style={{ fontSize: 12 }}>{d.growth}</div>
              </div>
              <div className="progress" style={{ marginTop: 10 }}>
                <span style={{ width: `${Math.min(100, d.headcount / 25 * 100)}%` }}/>
              </div>
              <div className="hstack" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>Líder: <span className="soft">{d.leadName}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Dashboard });
