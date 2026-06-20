/* global React, I, employees, formatPEN, formatDate, daysUntil, bankAccounts */
const { useState: useStateCol, useMemo: useMemoCol } = React;

function ColaboradoresList({ goto }) {
  const [q, setQ] = useStateCol('');
  const [dept, setDept] = useStateCol('Todos');
  const [status, setStatus] = useStateCol('Todos');
  const [view, setView] = useStateCol('table');

  const filtered = useMemoCol(() => {
    return employees.filter(e => {
      if (q && !(e.name.toLowerCase().includes(q.toLowerCase()) || e.id.includes(q) || e.role.toLowerCase().includes(q.toLowerCase()))) return false;
      if (dept !== 'Todos' && e.dept !== dept) return false;
      if (status !== 'Todos' && e.contractStatus !== status) return false;
      return true;
    });
  }, [q, dept, status]);

  const depts = ['Todos', ...new Set(employees.map(e => e.dept))];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Colaboradores</h1>
          <p className="page-sub">{filtered.length} de {employees.length} · Constructora Norte S.A.C.</p>
        </div>
        <div className="page-actions">
          <button className="btn">{I.upload} Importar</button>
          <button className="btn">{I.download} Exportar</button>
          <button className="btn btn-primary" onClick={() => goto('contratos-nuevo')}>{I.plus} Nuevo colaborador</button>
        </div>
      </div>

      <div className="filters">
        <div className="search-input">
          <span>{I.search}</span>
          <input placeholder="Buscar por nombre, DNI o cargo…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <select className="chip" value={dept} onChange={e => setDept(e.target.value)}>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="chip" value={status} onChange={e => setStatus(e.target.value)}>
          <option>Todos</option>
          <option>Vigente</option>
          <option>Por vencer</option>
          <option>Vencido</option>
        </select>
        <button className="chip">{I.filter} Más filtros</button>
        <div className="spacer"/>
        <div className="seg">
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Tabla</button>
          <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}>Tarjetas</button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="card card-flush">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}><input type="checkbox"/></th>
                <th>Colaborador</th>
                <th>Cargo</th>
                <th>Área</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th className="num">Remuneración</th>
                <th>Vence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const days = daysUntil(e.end);
                const tone = e.contractStatus === 'Vigente' ? 'badge-success' :
                            e.contractStatus === 'Por vencer' ? 'badge-warning' : 'badge-danger';
                return (
                  <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => goto('colaborador', e.id)}>
                    <td onClick={ev => ev.stopPropagation()}><input type="checkbox"/></td>
                    <td>
                      <div className="row-emp">
                        <span className="emp-avatar" style={{ background: e.color }}>{e.initials}</span>
                        <div>
                          <div className="emp-name">{e.name}</div>
                          <div className="emp-id">DNI {e.id} · {e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{e.role}</td>
                    <td><span className="badge badge-neutral no-dot">{e.dept}</span></td>
                    <td>
                      <div style={{ fontSize: 13 }}>{e.contractKind}</div>
                      {e.contractSub && <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{e.contractSub}</div>}
                    </td>
                    <td><span className={`badge ${tone}`}>{e.contractStatus}</span></td>
                    <td className="num">{formatPEN(e.salary)}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>
                      {e.end ? formatDate(e.end) : <span className="muted">—</span>}
                      {days !== null && days <= 60 && days >= 0 &&
                        <div style={{ fontSize: 10.5, color: 'var(--warning)' }}>en {days} días</div>}
                    </td>
                    <td className="action-cell" onClick={ev => ev.stopPropagation()}>
                      <button className="btn btn-ghost btn-icon">{I.dots}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(e => {
            const tone = e.contractStatus === 'Vigente' ? 'badge-success' :
                        e.contractStatus === 'Por vencer' ? 'badge-warning' : 'badge-danger';
            return (
              <div key={e.id} className="card" style={{ cursor: 'pointer' }} onClick={() => goto('colaborador', e.id)}>
                <div className="card-body">
                  <div className="hstack" style={{ marginBottom: 12 }}>
                    <span className="emp-avatar" style={{ background: e.color, width: 44, height: 44, fontSize: 14 }}>{e.initials}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{e.role}</div>
                    </div>
                  </div>
                  <div className="hstack" style={{ justifyContent: 'space-between', fontSize: 12 }}>
                    <span className="muted">DNI</span>
                    <span className="mono">{e.id}</span>
                  </div>
                  <div className="hstack" style={{ justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
                    <span className="muted">Área</span>
                    <span>{e.dept}</span>
                  </div>
                  <div className="hstack" style={{ justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
                    <span className="muted">Remun.</span>
                    <span className="mono">{formatPEN(e.salary)}</span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <span className={`badge ${tone}`}>{e.contractStatus}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="hstack" style={{ marginTop: 16, justifyContent: 'space-between', fontSize: 13, color: 'var(--text-soft)' }}>
        <div>Mostrando 1–{filtered.length} de {filtered.length}</div>
        <div className="hstack">
          <button className="btn btn-sm" disabled>{I.left}</button>
          <span className="mono">1 / 1</span>
          <button className="btn btn-sm" disabled>{I.right}</button>
        </div>
      </div>
    </>
  );
}

// === Detail ===
function ColaboradorDetail({ id, goto }) {
  const e = employees.find(x => x.id === id) || employees[0];
  const [tab, setTab] = useStateCol('resumen');
  const bank = bankAccounts[e.id] || { bank: 'BCP', cci: '0021' + e.id + '0009912', type: 'Cuenta Sueldo PEN' };

  const tone = e.contractStatus === 'Vigente' ? 'badge-success' :
              e.contractStatus === 'Por vencer' ? 'badge-warning' : 'badge-danger';

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="crumb" style={{ marginBottom: 8 }}>
            <a onClick={() => goto('colaboradores')} style={{ cursor: 'pointer', color: 'var(--accent)' }}>← Colaboradores</a>
          </div>
          <div className="hstack" style={{ gap: 16 }}>
            <span className="emp-avatar" style={{ background: e.color, width: 60, height: 60, fontSize: 18 }}>{e.initials}</span>
            <div>
              <h1 className="page-title">{e.name}</h1>
              <div className="hstack" style={{ marginTop: 6 }}>
                <span className="soft" style={{ fontSize: 13.5 }}>{e.role} · {e.dept}</span>
                <span className="muted">·</span>
                <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>DNI {e.id}</span>
                <span className={`badge ${tone}`} style={{ marginLeft: 4 }}>{e.contractStatus}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn">{I.mail} Enviar mensaje</button>
          <button className="btn">{I.doc} Generar PDF</button>
          <button className="btn btn-primary">{I.edit} Editar</button>
        </div>
      </div>

      <div className="tabs">
        {['resumen', 'datos', 'contrato', 'banco', 'documentos', 'emergencia'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'resumen' ? 'Resumen' :
             t === 'datos' ? 'Datos personales' :
             t === 'contrato' ? 'Contrato' :
             t === 'banco' ? 'Banco y pensión' :
             t === 'documentos' ? 'Documentos' : 'Contacto de emergencia'}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="detail-grid">
          <div className="vstack" style={{ gap: 16 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Contacto</h3></div>
              <div className="card-body vstack">
                <div className="hstack"><span style={{ color: 'var(--text-mute)' }}>{I.mail}</span><span style={{ fontSize: 13 }}>{e.email}</span></div>
                <div className="hstack"><span style={{ color: 'var(--text-mute)' }}>{I.phone}</span><span style={{ fontSize: 13 }}>{e.phone}</span></div>
                <div className="hstack"><span style={{ color: 'var(--text-mute)' }}>{I.map}</span><span style={{ fontSize: 13 }}>{e.district}, Lima</span></div>
                <div className="hstack"><span style={{ color: 'var(--text-mute)' }}>{I.briefcase}</span><span style={{ fontSize: 13 }}>{e.dept}</span></div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="card-title">Datos rápidos</h3></div>
              <div className="card-body">
                <dl className="kv">
                  <dt>Sexo</dt><dd>{e.sex === 'F' ? 'Femenino' : 'Masculino'}</dd>
                  <dt>Estado civil</dt><dd>{e.civil}</dd>
                  <dt>N° de hijos</dt><dd>{e.children}</dd>
                  <dt>Tipo de sangre</dt><dd className="mono">{e.blood}</dd>
                  <dt>Asig. familiar</dt><dd>{e.familyAlloc ? <span className="badge badge-success">Sí aplica</span> : <span className="badge badge-neutral">No</span>}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="vstack" style={{ gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Contrato vigente</h3>
                  <div className="card-sub">{e.contractKind}{e.contractSub ? ` · ${e.contractSub}` : ''}</div>
                </div>
                {e.contractStatus === 'Por vencer' && <button className="btn btn-primary btn-sm">Renovar contrato</button>}
              </div>
              <div className="card-body">
                <div className="form-row cols-3" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="soft" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inicio</div>
                    <div className="tabular" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{formatDate(e.start)}</div>
                  </div>
                  <div>
                    <div className="soft" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Término</div>
                    <div className="tabular" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{e.end ? formatDate(e.end) : 'Sin fecha fin'}</div>
                  </div>
                  <div>
                    <div className="soft" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remuneración</div>
                    <div className="tabular" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{formatPEN(e.salary)}</div>
                  </div>
                </div>
                {e.contractStatus === 'Por vencer' && (
                  <div style={{ padding: 12, background: 'var(--warning-soft)', color: 'oklch(0.45 0.15 70)', borderRadius: 8, fontSize: 13, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0 }}>{I.warn}</span>
                    <div>
                      <b>Atención:</b> el contrato vence en {daysUntil(e.end)} días. Por el TUO 728, debes renovar o convertir a indeterminado antes del vencimiento; caso contrario se entiende celebrado por tiempo indeterminado.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="card-title">Tallas</h3></div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <div className="soft" style={{ fontSize: 11.5 }}>Zapato</div>
                  <div className="tabular" style={{ fontSize: 20, fontWeight: 600 }}>{e.sex === 'F' ? '37' : '42'}</div>
                </div>
                <div>
                  <div className="soft" style={{ fontSize: 11.5 }}>Pantalón</div>
                  <div className="tabular" style={{ fontSize: 20, fontWeight: 600 }}>{e.sex === 'F' ? '28' : '34'}</div>
                </div>
                <div>
                  <div className="soft" style={{ fontSize: 11.5 }}>Camisa</div>
                  <div className="tabular" style={{ fontSize: 20, fontWeight: 600 }}>{e.sex === 'F' ? 'M' : 'L'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'datos' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Datos personales</h3></div>
          <div className="card-body">
            <div className="form-row cols-3">
              <div className="field">
                <label>DNI</label>
                <input className="mono" defaultValue={e.id.replace(/(\d{2})(\d{6})(\d{0,1})/, '$1.$2-$3').replace(/-$/, '')} readOnly/>
              </div>
              <div className="field"><label>Apellidos y nombres</label><input defaultValue={e.name}/></div>
              <div className="field"><label>Cargo</label><input defaultValue={e.role}/></div>
              <div className="field"><label>Celular</label><input className="mono" defaultValue={e.phone}/></div>
              <div className="field"><label>Correo electrónico</label><input defaultValue={e.email}/></div>
              <div className="field"><label>Fecha de nacimiento</label><input className="mono" defaultValue="14/08/1991"/></div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Dirección</label><input defaultValue={`Av. Javier Prado Oeste 1485, dpto. 502, ${e.district}`}/></div>
              <div className="field"><label>UBIGEO</label><input className="mono" defaultValue={e.district === 'San Isidro' ? '150131' : '150122'}/></div>
              <div className="field"><label>Distrito</label><input defaultValue={e.district}/></div>
              <div className="field"><label>Provincia</label><input defaultValue="Lima"/></div>
              <div className="field"><label>Departamento</label><input defaultValue="Lima"/></div>
              <div className="field"><label>Sexo</label><select defaultValue={e.sex}><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
              <div className="field"><label>Estado civil</label><input defaultValue={e.civil}/></div>
              <div className="field"><label>Tipo de sangre</label><select defaultValue={e.blood}><option>{e.blood}</option><option>A+</option><option>O-</option></select></div>
              <div className="field"><label>N° de hijos</label><input className="mono" defaultValue={e.children}/></div>
              <div className="field"><label>Grado de estudio</label><input defaultValue="Universitario completo"/></div>
              <div className="field"><label>Carrera profesional</label><input defaultValue={e.dept === 'Tecnología' ? 'Ingeniería de Sistemas' : 'Administración de Empresas'}/></div>
              <div className="field"><label>Años de experiencia</label><input className="mono" defaultValue="6"/></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'contrato' && (
        <div className="vstack" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Contrato actual</h3></div>
            <div className="card-body">
              <div className="form-row cols-3">
                <div className="field"><label>Modalidad</label><input defaultValue={e.contractKind}/></div>
                <div className="field"><label>Sub-modalidad</label><input defaultValue={e.contractSub || '—'}/></div>
                <div className="field"><label>Centro de costos</label><input defaultValue={`CC-${e.dept.slice(0, 3).toUpperCase()}`}/></div>
                <div className="field"><label>Fecha de inicio</label><input className="mono" defaultValue={formatDate(e.start)}/></div>
                <div className="field"><label>Fecha de término</label><input className="mono" defaultValue={e.end ? formatDate(e.end) : '—'} disabled={!e.end}/></div>
                <div className="field"><label>Remuneración mensual (PEN)</label><input className="mono" defaultValue={e.salary.toFixed(2)}/></div>
              </div>
              <div className="divider"/>
              <div className="hstack">
                <span style={{ color: 'var(--accent)' }}>{I.shield}</span>
                <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>Validación TUO 728: <b style={{ color: 'var(--success)' }}>cumple</b> · plazo dentro del máximo legal.</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Historial de contratos</h3>
              <span className="muted" style={{ fontSize: 12 }}>3 registros</span>
            </div>
            <div className="card-flush">
              <table className="tbl">
                <thead><tr><th>Inicio</th><th>Término</th><th>Modalidad</th><th className="num">Remun.</th><th>Estado</th></tr></thead>
                <tbody>
                  <tr><td className="mono">{formatDate(e.start)}</td><td className="mono">{e.end ? formatDate(e.end) : 'Vigente'}</td><td>{e.contractKind}</td><td className="num">{formatPEN(e.salary)}</td><td><span className="badge badge-success">Vigente</span></td></tr>
                  <tr><td className="mono">01/03/2023</td><td className="mono">13/03/2024</td><td>Sujeto a modalidad</td><td className="num">{formatPEN(e.salary - 700)}</td><td><span className="badge badge-neutral">Renovado</span></td></tr>
                  <tr><td className="mono">01/03/2022</td><td className="mono">28/02/2023</td><td>Sujeto a modalidad</td><td className="num">{formatPEN(e.salary - 1200)}</td><td><span className="badge badge-neutral">Cerrado</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'banco' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Banco y sistema de pensión</h3></div>
          <div className="card-body">
            <div className="form-row cols-3">
              <div className="field"><label>Entidad bancaria</label>
                <select defaultValue={bank.bank}>
                  <option>BCP</option><option>BBVA</option><option>Interbank</option><option>Scotiabank</option><option>Banco de la Nación</option>
                </select>
              </div>
              <div className="field"><label>Tipo de cuenta</label><input defaultValue={bank.type}/></div>
              <div className="field"><label>CCI (20 dígitos)</label><input className="mono" defaultValue={bank.cci}/></div>
              <div className="field"><label>Sistema de pensión</label>
                <select defaultValue={e.afp}>
                  <option>ONP</option><option>Integra</option><option>Prima</option><option>Profuturo</option><option>Habitat</option>
                </select>
              </div>
              <div className="field"><label>CUSPP</label><input className="mono" defaultValue="123456ABCDE12"/></div>
              <div className="field"><label>Asignación familiar</label>
                <select defaultValue={e.familyAlloc ? 'Aplica' : 'No aplica'}>
                  <option>Aplica</option><option>No aplica</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'documentos' && (
        <div className="card card-flush">
          <table className="tbl">
            <thead><tr><th>Documento</th><th>Subido por</th><th>Fecha</th><th>Tamaño</th><th></th></tr></thead>
            <tbody>
              {[
                ['Contrato firmado.pdf', 'María Q.', '14/03/2022', '482 KB'],
                ['Copia DNI (frontal + reverso).pdf', e.name.split(' ')[0], '13/03/2022', '1.2 MB'],
                ['Certificado AFP.pdf', e.name.split(' ')[0], '13/03/2022', '210 KB'],
                ['Certificados de estudios.pdf', e.name.split(' ')[0], '13/03/2022', '3.4 MB'],
                ['Examen médico ocupacional 2025.pdf', 'Clínica San Felipe', '12/01/2025', '890 KB'],
              ].map((d, i) => (
                <tr key={i}>
                  <td><span className="hstack"><span style={{ color: 'var(--text-mute)' }}>{I.doc}</span>{d[0]}</span></td>
                  <td>{d[1]}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{d[2]}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{d[3]}</td>
                  <td className="action-cell"><button className="btn btn-ghost btn-sm">{I.download}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'emergencia' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Contacto de emergencia</h3></div>
          <div className="card-body">
            <div className="form-row cols-3">
              <div className="field"><label>Nombre completo</label><input defaultValue="Patricia Huamán Linares"/></div>
              <div className="field"><label>Parentesco</label><input defaultValue="Madre"/></div>
              <div className="field"><label>Celular de emergencia</label><input className="mono" defaultValue="987 654 321"/></div>
              <div className="field"><label>Dirección</label><input defaultValue="Calle Las Magnolias 245, San Borja"/></div>
              <div className="field"><label>Distrito</label><input defaultValue="San Borja"/></div>
              <div className="field"><label>Notas</label><input defaultValue="Disponible 24 h"/></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { ColaboradoresList, ColaboradorDetail });
