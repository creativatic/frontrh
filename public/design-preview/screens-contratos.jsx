/* global React, I, employees, formatPEN, formatDate, daysUntil */
const { useState: useStateCnt, useMemo: useMemoCnt } = React;

function ContratosList({ goto }) {
  const [filter, setFilter] = useStateCnt('Todos');
  const [q, setQ] = useStateCnt('');

  const counts = {
    Todos: employees.length,
    Vigentes: employees.filter(e => e.contractStatus === 'Vigente').length,
    'Por vencer': employees.filter(e => e.contractStatus === 'Por vencer').length,
    Vencidos: employees.filter(e => e.contractStatus === 'Vencido').length,
  };

  const filtered = employees.filter(e => {
    if (filter === 'Vigentes' && e.contractStatus !== 'Vigente') return false;
    if (filter === 'Por vencer' && e.contractStatus !== 'Por vencer') return false;
    if (filter === 'Vencidos' && e.contractStatus !== 'Vencido') return false;
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-sub">Conforme al TUO del D. Leg. N° 728 · {employees.length} contratos en el sistema</p>
        </div>
        <div className="page-actions">
          <button className="btn">{I.download} Exportar PDF</button>
          <button className="btn btn-primary" onClick={() => goto('contratos-nuevo')}>{I.plus} Nuevo contrato</button>
        </div>
      </div>

      <div className="filters">
        {Object.entries(counts).map(([k, v]) => (
          <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {k} <span style={{ opacity: 0.6, marginLeft: 4 }}>{v}</span>
          </button>
        ))}
        <div className="spacer"/>
        <div className="search-input">
          <span>{I.search}</span>
          <input placeholder="Buscar contrato…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
      </div>

      <div className="card card-flush">
        <table className="tbl">
          <thead>
            <tr>
              <th>Código</th>
              <th>Colaborador</th>
              <th>Modalidad</th>
              <th>Inicio</th>
              <th>Término</th>
              <th>Duración</th>
              <th>Estado</th>
              <th className="num">Remun.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const tone = e.contractStatus === 'Vigente' ? 'badge-success' :
                          e.contractStatus === 'Por vencer' ? 'badge-warning' : 'badge-danger';
              const dur = e.end
                ? `${Math.round((new Date(e.end) - new Date(e.start)) / 86400000 / 30)} meses`
                : 'Indef.';
              return (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => goto('colaborador', e.id)}>
                  <td className="mono" style={{ fontSize: 12.5 }}>CTR-{2026}-{String(i + 1).padStart(4, '0')}</td>
                  <td>
                    <div className="row-emp">
                      <span className="emp-avatar" style={{ background: e.color }}>{e.initials}</span>
                      <div>
                        <div className="emp-name">{e.name}</div>
                        <div className="emp-id">{e.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{e.contractKind}</div>
                    {e.contractSub && <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{e.contractSub}</div>}
                  </td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{formatDate(e.start)}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{e.end ? formatDate(e.end) : '—'}</td>
                  <td className="soft" style={{ fontSize: 13 }}>{dur}</td>
                  <td><span className={`badge ${tone}`}>{e.contractStatus}</span></td>
                  <td className="num">{formatPEN(e.salary)}</td>
                  <td className="action-cell"><button className="btn btn-ghost btn-icon">{I.dots}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// === Wizard de nuevo contrato ===
const STEPS = [
  { id: 0, n: '01', label: 'Tipo de contrato' },
  { id: 1, n: '02', label: 'Datos personales' },
  { id: 2, n: '03', label: 'Dirección' },
  { id: 3, n: '04', label: 'Condiciones laborales' },
  { id: 4, n: '05', label: 'Banco y pensión' },
  { id: 5, n: '06', label: 'Revisión y firma' },
];

const MODALIDADES = [
  {
    title: 'Indeterminado',
    desc: 'Sin fecha de fin. Verbal o escrito.',
    max: 'Sin plazo',
    naturaleza: '—',
  },
  {
    title: 'Tiempo parcial',
    desc: 'Jornada menor a 4 horas diarias en promedio. Sin asignación familiar.',
    max: 'Sin plazo',
    naturaleza: '—',
  },
  {
    title: 'Sujeto a modalidad — Inicio o incremento de actividad',
    desc: 'Lanzamiento de nueva actividad productiva o incremento sostenido.',
    max: '3 años',
    naturaleza: 'Temporal',
  },
  {
    title: 'Sujeto a modalidad — Necesidades de mercado',
    desc: 'Atender incrementos coyunturales originados por variaciones del mercado.',
    max: '5 años',
    naturaleza: 'Temporal',
  },
  {
    title: 'Sujeto a modalidad — Reconversión empresarial',
    desc: 'Sustitución, ampliación o modificación de actividades.',
    max: '2 años',
    naturaleza: 'Temporal',
  },
  {
    title: 'Sujeto a modalidad — Ocasional',
    desc: 'Necesidades transitorias distintas de la actividad habitual.',
    max: '6 meses al año',
    naturaleza: 'Accidental',
  },
  {
    title: 'Sujeto a modalidad — Suplencia',
    desc: 'Sustituir a un trabajador estable con vínculo suspendido.',
    max: 'Lo necesario',
    naturaleza: 'Accidental',
  },
  {
    title: 'Sujeto a modalidad — Emergencia',
    desc: 'Cubrir necesidades por caso fortuito o fuerza mayor.',
    max: 'Duración de la emergencia',
    naturaleza: 'Accidental',
  },
  {
    title: 'Obra o servicio específico',
    desc: 'Objeto previamente establecido y duración determinada.',
    max: 'Fin de obra (máx. 8 años)',
    naturaleza: 'Obra o servicio',
  },
  {
    title: 'Modalidad formativa (prácticas)',
    desc: 'Prácticas pre o profesionales bajo D. Leg. 1401.',
    max: 'Según convenio',
    naturaleza: 'Formativa',
  },
];

function ContratoWizard({ goto }) {
  const [step, setStep] = useStateCnt(0);
  const [modIdx, setModIdx] = useStateCnt(2);
  const [start, setStart] = useStateCnt('2026-06-01');
  const [end, setEnd] = useStateCnt('2027-05-31');
  const [salary, setSalary] = useStateCnt('4800');

  const goNext = () => setStep(Math.min(STEPS.length - 1, step + 1));
  const goPrev = () => setStep(Math.max(0, step - 1));

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="crumb" style={{ marginBottom: 8 }}>
            <a onClick={() => goto('contratos')} style={{ cursor: 'pointer', color: 'var(--accent)' }}>← Contratos</a>
          </div>
          <h1 className="page-title">Nuevo contrato</h1>
          <p className="page-sub">Completa el wizard. Los plazos se validan contra el TUO D. Leg. N° 728.</p>
        </div>
        <div className="page-actions">
          <button className="btn">Guardar borrador</button>
          <button className="btn btn-ghost" onClick={() => goto('contratos')}>{I.x} Cancelar</button>
        </div>
      </div>

      <div className="stepper">
        {STEPS.map(s => (
          <div key={s.id}
               className={`step ${s.id === step ? 'active' : ''} ${s.id < step ? 'done' : ''}`}
               onClick={() => setStep(s.id)}>
            <span className="n">{s.id < step ? '✓' : s.n}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">

          {step === 0 && (
            <>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>¿Qué tipo de contrato vas a celebrar?</h3>
              <p className="soft" style={{ margin: '0 0 18px', fontSize: 13 }}>El sistema validará automáticamente los plazos máximos legales.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {MODALIDADES.map((m, i) => (
                  <label key={i}
                         className="hstack"
                         style={{
                           gap: 14, padding: 14,
                           border: '1.5px solid ' + (i === modIdx ? 'var(--accent)' : 'var(--border-strong)'),
                           background: i === modIdx ? 'var(--accent-soft)' : 'var(--surface)',
                           borderRadius: 12, cursor: 'pointer', alignItems: 'flex-start'
                         }}>
                    <input type="radio" checked={i === modIdx} onChange={() => setModIdx(i)} style={{ accentColor: 'var(--accent)', marginTop: 3 }}/>
                    <div style={{ flex: 1 }}>
                      <div className="hstack" style={{ justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.title}</div>
                        <span className="badge badge-neutral no-dot" style={{ fontSize: 10.5 }}>{m.naturaleza}</span>
                      </div>
                      <div className="soft" style={{ fontSize: 12.5, marginTop: 4 }}>{m.desc}</div>
                      <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 6 }}>Plazo máximo: {m.max}</div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Datos del colaborador</h3>
              <p className="soft" style={{ margin: '0 0 18px', fontSize: 13 }}>Información personal que aparecerá en el contrato firmable.</p>
              <div className="form-row cols-3">
                <div className="field"><label>DNI <span className="req">*</span></label><input className="mono" placeholder="00 000 000"/><div className="hint">Verificamos contra RENIEC al guardar.</div></div>
                <div className="field"><label>Apellidos y nombres <span className="req">*</span></label><input placeholder="Apellido paterno Apellido materno Nombres"/></div>
                <div className="field"><label>Fecha de nacimiento <span className="req">*</span></label><input type="date" className="mono"/></div>
                <div className="field"><label>Sexo</label><select><option>Masculino</option><option>Femenino</option></select></div>
                <div className="field"><label>Estado civil</label><select><option>Soltero(a)</option><option>Casado(a)</option><option>Conviviente</option><option>Viudo(a)</option><option>Divorciado(a)</option></select></div>
                <div className="field"><label>Tipo de sangre</label><select><option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option></select></div>
                <div className="field"><label>Celular <span className="req">*</span></label><input className="mono" placeholder="9XX XXX XXX"/></div>
                <div className="field"><label>Correo electrónico <span className="req">*</span></label><input placeholder="nombre@empresa.pe"/></div>
                <div className="field"><label>N° de hijos</label><input className="mono" defaultValue="0"/></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Dirección</h3>
              <p className="soft" style={{ margin: '0 0 18px', fontSize: 13 }}>El UBIGEO INEI se autocompleta al elegir departamento → provincia → distrito.</p>
              <div className="form-row cols-3">
                <div className="field" style={{ gridColumn: 'span 3' }}><label>Dirección completa <span className="req">*</span></label><input placeholder="Av. / Jr. / Calle, número, dpto."/></div>
                <div className="field"><label>Departamento <span className="req">*</span></label><select defaultValue="Lima"><option>Lima</option><option>Arequipa</option><option>La Libertad</option><option>Cusco</option></select></div>
                <div className="field"><label>Provincia <span className="req">*</span></label><select defaultValue="Lima"><option>Lima</option></select></div>
                <div className="field"><label>Distrito <span className="req">*</span></label><select defaultValue="San Isidro"><option>San Isidro</option><option>Miraflores</option><option>Surco</option><option>La Molina</option></select></div>
                <div className="field"><label>UBIGEO</label><input className="mono" defaultValue="150131" readOnly/><div className="hint">Auto-asignado por INEI</div></div>
                <div className="field"><label>Referencia</label><input placeholder="Cerca a…"/></div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Condiciones laborales</h3>
              <p className="soft" style={{ margin: '0 0 18px', fontSize: 13 }}>Reglas legales vivas en el dominio. Plazo máximo: <b>{MODALIDADES[modIdx].max}</b>.</p>
              <div className="form-row cols-3">
                <div className="field"><label>Cargo <span className="req">*</span></label><input placeholder="Analista, Asistente, etc."/></div>
                <div className="field"><label>Área / Centro de costos <span className="req">*</span></label><select><option>Tecnología</option><option>Operaciones</option><option>Recursos Humanos</option><option>Finanzas</option><option>Marketing</option></select></div>
                <div className="field"><label>Jefe directo</label><input placeholder="Buscar…"/></div>
                <div className="field"><label>Fecha de inicio <span className="req">*</span></label><input type="date" className="mono" value={start} onChange={e => setStart(e.target.value)}/></div>
                <div className="field"><label>Fecha de término</label><input type="date" className="mono" value={end} onChange={e => setEnd(e.target.value)} disabled={modIdx === 0 || modIdx === 1}/></div>
                <div className="field"><label>Remuneración mensual PEN <span className="req">*</span></label><input className="mono" value={salary} onChange={e => setSalary(e.target.value)}/></div>
                <div className="field"><label>Jornada</label><select><option>Tiempo completo (8 h)</option><option>Tiempo parcial (&lt; 4 h)</option><option>Atípica</option></select></div>
                <div className="field"><label>Periodo de prueba</label><select><option>3 meses (ordinario)</option><option>6 meses (calificado)</option><option>12 meses (de confianza)</option></select></div>
                <div className="field"><label>Asignación familiar</label><select><option>No aplica</option><option>Aplica (S/ 113.00)</option></select></div>
              </div>
              <div className="divider"/>
              <div style={{ padding: 14, background: 'var(--success-soft)', borderRadius: 10, fontSize: 13, color: 'var(--success)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0 }}>{I.shield}</span>
                <div>
                  <b>Validación TUO 728:</b> La diferencia entre inicio ({start}) y término ({end}) es de 12 meses; dentro del plazo máximo de <b>{MODALIDADES[modIdx].max}</b>.
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Banco y pensión</h3>
              <p className="soft" style={{ margin: '0 0 18px', fontSize: 13 }}>Datos requeridos para el pago de planilla y aportes a SUNAT.</p>
              <div className="form-row cols-3">
                <div className="field"><label>Entidad bancaria <span className="req">*</span></label><select><option>BCP</option><option>BBVA</option><option>Interbank</option><option>Scotiabank</option><option>Banco de la Nación</option><option>Pichincha</option></select></div>
                <div className="field"><label>Tipo de cuenta</label><select><option>Cuenta Sueldo PEN</option><option>Cuenta de Ahorros PEN</option><option>Cuenta Corriente</option></select></div>
                <div className="field"><label>CCI (20 dígitos) <span className="req">*</span></label><input className="mono" placeholder="000-000-00000000000-00"/></div>
                <div className="field"><label>Sistema de pensión <span className="req">*</span></label><select><option>ONP</option><option>AFP Integra</option><option>AFP Prima</option><option>AFP Profuturo</option><option>AFP Habitat</option></select></div>
                <div className="field"><label>CUSPP (si es AFP)</label><input className="mono" placeholder="123456ABCDE12"/></div>
                <div className="field"><label>Modalidad de aporte</label><select><option>Comisión sobre flujo</option><option>Comisión mixta</option></select></div>
              </div>
              <div className="divider"/>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tallas (uniforme / EPP)</h4>
              <div className="form-row cols-3">
                <div className="field"><label>Talla de zapato</label><input className="mono" placeholder="42"/></div>
                <div className="field"><label>Talla de pantalón</label><input className="mono" placeholder="32"/></div>
                <div className="field"><label>Talla de camisa</label><select><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option></select></div>
              </div>
              <div className="divider"/>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Contacto de emergencia</h4>
              <div className="form-row cols-3">
                <div className="field"><label>Nombre completo</label><input placeholder="Apellido y nombre"/></div>
                <div className="field"><label>Parentesco</label><select><option>Madre</option><option>Padre</option><option>Cónyuge</option><option>Hermano(a)</option><option>Otro</option></select></div>
                <div className="field"><label>Celular de emergencia</label><input className="mono" placeholder="9XX XXX XXX"/></div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>Revisión y firma</h3>
              <p className="soft" style={{ margin: '0 0 18px', fontSize: 13 }}>Confirma los datos. El contrato se generará en PDF y se enviará al firmante.</p>

              <div className="form-row" style={{ gap: 24 }}>
                <div className="card" style={{ background: 'var(--surface-2)', border: 'none' }}>
                  <div className="card-body">
                    <div className="soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Modalidad</div>
                    <div style={{ fontWeight: 600 }}>{MODALIDADES[modIdx].title}</div>
                    <div className="soft" style={{ fontSize: 12.5, marginTop: 4 }}>{MODALIDADES[modIdx].desc}</div>
                    <div className="divider"/>
                    <dl className="kv">
                      <dt>Naturaleza</dt><dd>{MODALIDADES[modIdx].naturaleza}</dd>
                      <dt>Plazo máximo</dt><dd className="mono">{MODALIDADES[modIdx].max}</dd>
                      <dt>Inicio</dt><dd className="mono">{formatDate(start)}</dd>
                      <dt>Término</dt><dd className="mono">{end ? formatDate(end) : '—'}</dd>
                      <dt>Remuneración</dt><dd className="mono">{formatPEN(parseFloat(salary || 0))}</dd>
                      <dt>Jornada</dt><dd>Tiempo completo (8 h)</dd>
                    </dl>
                  </div>
                </div>
                <div className="card" style={{ background: 'var(--surface-2)', border: 'none' }}>
                  <div className="card-body">
                    <div className="soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Validaciones</div>
                    <div className="vstack" style={{ gap: 8 }}>
                      <div className="hstack"><span style={{ color: 'var(--success)' }}>{I.check}</span><span style={{ fontSize: 13 }}>Plazo dentro del máximo legal</span></div>
                      <div className="hstack"><span style={{ color: 'var(--success)' }}>{I.check}</span><span style={{ fontSize: 13 }}>DNI verificado en RENIEC</span></div>
                      <div className="hstack"><span style={{ color: 'var(--success)' }}>{I.check}</span><span style={{ fontSize: 13 }}>UBIGEO INEI válido</span></div>
                      <div className="hstack"><span style={{ color: 'var(--success)' }}>{I.check}</span><span style={{ fontSize: 13 }}>CCI con 20 dígitos</span></div>
                      <div className="hstack"><span style={{ color: 'var(--success)' }}>{I.check}</span><span style={{ fontSize: 13 }}>CUSPP coincide con la AFP seleccionada</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, padding: 14, background: 'var(--info-soft)', color: 'var(--info)', borderRadius: 10, fontSize: 13, display: 'flex', gap: 10 }}>
                <span style={{ flexShrink: 0 }}>{I.doc}</span>
                <div>El contrato se generará como PDF firmable. El colaborador recibirá un enlace por correo para firmar electrónicamente.</div>
              </div>
            </>
          )}

        </div>
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="soft" style={{ fontSize: 12 }}>Paso {step + 1} de {STEPS.length}</div>
          <div className="hstack">
            <button className="btn" onClick={goPrev} disabled={step === 0}>{I.left} Anterior</button>
            {step < STEPS.length - 1
              ? <button className="btn btn-primary" onClick={goNext}>Siguiente {I.right}</button>
              : <button className="btn btn-accent">{I.check} Firmar y registrar</button>}
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ContratosList, ContratoWizard });
