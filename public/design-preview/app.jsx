/* global React, ReactDOM, LoginScreen, Sidebar, Topbar, Dashboard,
   ColaboradoresList, ColaboradorDetail, ContratosList, ContratoWizard,
   Asistencia, Vacaciones, Reportes, Configuracion, employees, daysUntil,
   TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakColor, TweakToggle */
const { useState, useEffect } = React;

function App() {
  const [authed, setAuthed] = useState(false);
  const [route, setRoute] = useState('dashboard');
  const [routeParam, setRouteParam] = useState(null);

  // Tweaks: theme, density, accent
  const [tw, setTweak] = useTweaks(window.__TWEAK_DEFAULTS || {
    theme: 'light',
    density: 'normal',
    accent: '#3656c8',
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tw.theme);
    document.documentElement.setAttribute('data-density', tw.density);
    const hue = hexToHue(tw.accent);
    document.documentElement.style.setProperty('--accent-h', String(hue));
  }, [tw]);

  const goto = (r, p) => {
    setRoute(r);
    setRouteParam(p ?? null);
    if (typeof window !== 'undefined') window.scrollTo?.(0, 0);
  };

  if (!authed) {
    return (
      <>
        <LoginScreen onLogin={() => setAuthed(true)}/>
        <TweaksPanel title="Tweaks">
          <TweakAppearance tw={tw} setTweak={setTweak}/>
        </TweaksPanel>
      </>
    );
  }

  const expiring = employees.filter(e => {
    const d = daysUntil(e.end);
    return d !== null && d >= 0 && d <= 60;
  }).length;

  const crumbs = (() => {
    switch (route) {
      case 'dashboard': return ['Inicio'];
      case 'colaboradores': return ['Operación', 'Colaboradores'];
      case 'colaborador':
        const e = employees.find(x => x.id === routeParam);
        return ['Operación', <a key="c" onClick={() => goto('colaboradores')} style={{ cursor: 'pointer' }}>Colaboradores</a>, e?.name.split(' ').slice(0, 2).join(' ') || 'Detalle'];
      case 'contratos': return ['Operación', 'Contratos'];
      case 'contratos-nuevo': return ['Operación', <a key="ct" onClick={() => goto('contratos')} style={{ cursor: 'pointer' }}>Contratos</a>, 'Nuevo'];
      case 'asistencia': return ['Operación', 'Asistencia'];
      case 'vacaciones': return ['Operación', 'Vacaciones y ausencias'];
      case 'reportes': return ['Administración', 'Reportes'];
      case 'configuracion': return ['Administración', 'Configuración'];
      default: return ['Inicio'];
    }
  })();

  return (
    <div className="app-shell">
      <Sidebar route={route.startsWith('colaborador') ? 'colaboradores' :
                     route.startsWith('contratos') ? 'contratos' : route}
               setRoute={goto}
               alerts={{ expiring }}/>
      <div className="main">
        <Topbar crumbs={crumbs}/>
        <main className="content">
          {route === 'dashboard' && <Dashboard goto={goto}/>}
          {route === 'colaboradores' && <ColaboradoresList goto={goto}/>}
          {route === 'colaborador' && <ColaboradorDetail id={routeParam} goto={goto}/>}
          {route === 'contratos' && <ContratosList goto={goto}/>}
          {route === 'contratos-nuevo' && <ContratoWizard goto={goto}/>}
          {route === 'asistencia' && <Asistencia goto={goto}/>}
          {route === 'vacaciones' && <Vacaciones goto={goto}/>}
          {route === 'reportes' && <Reportes goto={goto}/>}
          {route === 'configuracion' && <Configuracion goto={goto}/>}
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakAppearance tw={tw} setTweak={setTweak}/>
      </TweaksPanel>
    </div>
  );
}

function TweakAppearance({ tw, setTweak }) {
  return (
    <>
      <TweakSection title="Apariencia">
        <TweakRadio label="Tema"
                    options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]}
                    value={tw.theme}
                    onChange={v => setTweak('theme', v)}/>
        <TweakRadio label="Densidad"
                    options={[{ value: 'compact', label: 'Densa' }, { value: 'normal', label: 'Normal' }, { value: 'cozy', label: 'Holgada' }]}
                    value={tw.density}
                    onChange={v => setTweak('density', v)}/>
        <TweakColor label="Acento"
                    options={['#3656c8', '#0a8aa8', '#1a8a6c', '#a96a26', '#b03648', '#6b4ec5']}
                    value={tw.accent}
                    onChange={v => setTweak('accent', v)}/>
      </TweakSection>
    </>
  );
}

// Map hex accent → hue degrees for oklch tokens
function hexToHue(hex) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  // shift to oklch hue space (rough)
  return Math.round(hue);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
