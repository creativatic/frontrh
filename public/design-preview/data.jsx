/* global React */
// === Icons (Lucide-style stroke 1.75) ===
const Icon = ({ d, size = 18, fill = "none", stroke = "currentColor", ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d}
  </svg>
);

const I = {
  home: <Icon d={<><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></>}/>,
  users: <Icon d={<><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 11.5a3.5 3.5 0 0 0 0-7"/><path d="M21.5 20a5.5 5.5 0 0 0-4-5.3"/></>}/>,
  contract: <Icon d={<><path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/></>}/>,
  clock: <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>,
  palmtree: <Icon d={<><path d="M13 8c0-3-2.5-5-5-5"/><path d="M13 8c0-3 2.5-5 5-5"/><path d="M13 8c-3 0-5 2-5 5"/><path d="M13 8c3 0 5 2 5 5"/><circle cx="13" cy="8" r="1.2"/><path d="M13 9v12"/><path d="M10 21h6"/></>}/>,
  chart: <Icon d={<><path d="M4 20V8"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>}/>,
  settings: <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></>}/>,
  search: <Icon d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  bell: <Icon d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/><path d="M10.5 21a2 2 0 0 0 3 0"/></>}/>,
  help: <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></>}/>,
  plus: <Icon d={<><path d="M12 5v14"/><path d="M5 12h14"/></>}/>,
  download: <Icon d={<><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></>}/>,
  upload: <Icon d={<><path d="M12 20V8"/><path d="m7 13 5-5 5 5"/><path d="M5 4h14"/></>}/>,
  filter: <Icon d={<><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></>}/>,
  dots: <Icon d={<><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></>}/>,
  edit: <Icon d={<><path d="M3 21h18"/><path d="M14 5l4 4-9 9-4.5.5.5-4.5z"/></>}/>,
  trash: <Icon d={<><path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/></>}/>,
  right: <Icon d={<><path d="m9 6 6 6-6 6"/></>}/>,
  left: <Icon d={<><path d="m15 6-6 6 6 6"/></>}/>,
  down: <Icon d={<><path d="m6 9 6 6 6-6"/></>}/>,
  check: <Icon d={<><path d="m5 12 5 5L20 7"/></>}/>,
  x: <Icon d={<><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>}/>,
  warn: <Icon d={<><path d="M12 3 2 21h20Z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.5" fill="currentColor"/></>}/>,
  mail: <Icon d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>}/>,
  phone: <Icon d={<><path d="M22 16.5v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3 19 19 0 0 1-6-6 19.7 19.7 0 0 1-3-8.7A2 2 0 0 1 4.2 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2L8 9.5a16 16 0 0 0 6 6l1.1-1.3a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.5Z"/></>}/>,
  id: <Icon d={<><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h5"/><path d="M14 14h3"/><path d="M5 17h7"/></>}/>,
  building: <Icon d={<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2"/><path d="M13 7h2"/><path d="M9 11h2"/><path d="M13 11h2"/><path d="M9 15h2"/><path d="M13 15h2"/></>}/>,
  doc: <Icon d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>}/>,
  briefcase: <Icon d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/></>}/>,
  calendar: <Icon d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></>}/>,
  logout: <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>}/>,
  shield: <Icon d={<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/></>}/>,
  map: <Icon d={<><path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></>}/>,
  bank: <Icon d={<><path d="M3 11h18"/><path d="M12 3 3 8h18Z"/><path d="M5 11v8"/><path d="M9 11v8"/><path d="M15 11v8"/><path d="M19 11v8"/><path d="M3 21h18"/></>}/>,
  fingerprint: <Icon d={<><path d="M5 11a7 7 0 0 1 14 0v1"/><path d="M9 11a3 3 0 0 1 6 0v3a8 8 0 0 1-1 4"/><path d="M12 11v5a8 8 0 0 0 .5 3"/><path d="M5 16a7 7 0 0 0 .5 3"/><path d="M19 16v.5"/></>}/>,
  arrowUp: <Icon d={<><path d="m6 14 6-6 6 6"/></>} size={14}/>,
  arrowDown: <Icon d={<><path d="m6 10 6 6 6-6"/></>} size={14}/>,
  refresh: <Icon d={<><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/></>}/>,
  eye: <Icon d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}/>,
  lock: <Icon d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>}/>,
  external: <Icon d={<><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>}/>,
};

// === Mock data ===
const accentForName = (name) => {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = [30, 60, 145, 200, 240, 280, 320, 10];
  return `oklch(0.65 0.12 ${hues[h % hues.length]})`;
};
const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();

const employees = [
  { id: '70123456', name: 'María Fernanda Quispe Huamán', role: 'Analista Senior de Planillas', dept: 'Recursos Humanos',
    contractKind: 'Indeterminado', contractStatus: 'Vigente', start: '2022-03-14', end: null,
    salary: 5800, phone: '999 845 217', email: 'mquispe@empresa.pe', district: 'San Isidro', afp: 'Integra',
    sex: 'F', civil: 'Casada', children: 2, blood: 'O+', familyAlloc: true },
  { id: '47568901', name: 'Carlos Alberto Vargas Cárdenas', role: 'Desarrollador Backend', dept: 'Tecnología',
    contractKind: 'Sujeto a modalidad', contractSub: 'Necesidades de mercado', contractStatus: 'Vigente',
    start: '2024-01-08', end: '2026-12-31', salary: 7200, phone: '986 123 044', email: 'cvargas@empresa.pe',
    district: 'Miraflores', afp: 'Prima', sex: 'M', civil: 'Soltero', children: 0, blood: 'A+', familyAlloc: false },
  { id: '76543210', name: 'Ana Lucía Rivera Salazar', role: 'Diseñadora UX', dept: 'Producto',
    contractKind: 'Sujeto a modalidad', contractSub: 'Inicio de actividad', contractStatus: 'Por vencer',
    start: '2024-06-01', end: '2026-05-31', salary: 4900, phone: '977 442 813', email: 'arivera@empresa.pe',
    district: 'Surco', afp: 'Habitat', sex: 'F', civil: 'Soltera', children: 0, blood: 'B+', familyAlloc: false },
  { id: '40987654', name: 'José Ricardo Pérez Mendoza', role: 'Jefe de Operaciones', dept: 'Operaciones',
    contractKind: 'Indeterminado', contractStatus: 'Vigente', start: '2019-09-02', end: null,
    salary: 9800, phone: '999 011 234', email: 'jperez@empresa.pe', district: 'La Molina', afp: 'ONP',
    sex: 'M', civil: 'Casado', children: 3, blood: 'O-', familyAlloc: true },
  { id: '72112558', name: 'Lucero Patricia Tello Bravo', role: 'Asistente Contable', dept: 'Finanzas',
    contractKind: 'Tiempo parcial', contractStatus: 'Vigente', start: '2025-02-10', end: null,
    salary: 1850, phone: '942 187 562', email: 'ltello@empresa.pe', district: 'Lince', afp: 'Profuturo',
    sex: 'F', civil: 'Soltera', children: 1, blood: 'A-', familyAlloc: true },
  { id: '46221984', name: 'Diego Armando Soto Linares', role: 'Soporte TI', dept: 'Tecnología',
    contractKind: 'Sujeto a modalidad', contractSub: 'Suplencia', contractStatus: 'Vigente',
    start: '2025-08-15', end: '2026-08-14', salary: 3200, phone: '988 776 102', email: 'dsoto@empresa.pe',
    district: 'San Miguel', afp: 'Integra', sex: 'M', civil: 'Soltero', children: 0, blood: 'O+', familyAlloc: false },
  { id: '71334820', name: 'Valeria Estefanía Bermúdez Cruz', role: 'Especialista de Marca', dept: 'Marketing',
    contractKind: 'Sujeto a modalidad', contractSub: 'Inicio de actividad', contractStatus: 'Por vencer',
    start: '2024-11-01', end: '2026-06-30', salary: 5100, phone: '993 224 657', email: 'vbermudez@empresa.pe',
    district: 'Barranco', afp: 'Prima', sex: 'F', civil: 'Conviviente', children: 1, blood: 'AB+', familyAlloc: true },
  { id: '45678123', name: 'Rodrigo Esteban Cárdenas Ríos', role: 'Gerente Comercial', dept: 'Comercial',
    contractKind: 'Indeterminado', contractStatus: 'Vigente', start: '2018-04-22', end: null,
    salary: 12500, phone: '999 555 871', email: 'rcardenas@empresa.pe', district: 'San Borja', afp: 'Integra',
    sex: 'M', civil: 'Casado', children: 2, blood: 'B+', familyAlloc: true },
  { id: '70991122', name: 'Mariana Inés Cabrera Loayza', role: 'Reclutadora', dept: 'Recursos Humanos',
    contractKind: 'Sujeto a modalidad', contractSub: 'Inicio de actividad', contractStatus: 'Vigente',
    start: '2025-05-05', end: '2027-05-04', salary: 4200, phone: '912 345 678', email: 'mcabrera@empresa.pe',
    district: 'Magdalena', afp: 'Habitat', sex: 'F', civil: 'Soltera', children: 0, blood: 'O+', familyAlloc: false },
  { id: '42771156', name: 'Andrés Felipe Castillo Yáñez', role: 'Data Analyst', dept: 'Tecnología',
    contractKind: 'Sujeto a modalidad', contractSub: 'Reconversión empresarial', contractStatus: 'Vigente',
    start: '2025-01-20', end: '2027-01-19', salary: 6400, phone: '977 998 213', email: 'acastillo@empresa.pe',
    district: 'Jesús María', afp: 'Profuturo', sex: 'M', civil: 'Soltero', children: 0, blood: 'A+', familyAlloc: false },
  { id: '73224501', name: 'Camila Antonella Espinoza Vela', role: 'Practicante de RR.HH.', dept: 'Recursos Humanos',
    contractKind: 'Modalidad formativa', contractStatus: 'Vigente', start: '2026-01-15', end: '2026-07-14',
    salary: 1100, phone: '977 661 005', email: 'cespinoza@empresa.pe', district: 'Pueblo Libre', afp: '—',
    sex: 'F', civil: 'Soltera', children: 0, blood: 'O-', familyAlloc: false },
  { id: '48771203', name: 'Luis Enrique Rojas Paredes', role: 'Auxiliar de Almacén', dept: 'Operaciones',
    contractKind: 'Sujeto a modalidad', contractSub: 'Ocasional', contractStatus: 'Vencido',
    start: '2025-03-01', end: '2025-08-31', salary: 1500, phone: '923 871 654', email: 'lrojas@empresa.pe',
    district: 'Ate', afp: 'ONP', sex: 'M', civil: 'Casado', children: 1, blood: 'O+', familyAlloc: true },
].map(e => ({ ...e, color: accentForName(e.name), initials: initials(e.name) }));

const departments = [
  { name: 'Tecnología', headcount: 18, leadName: 'Rodrigo C.', growth: '+12%' },
  { name: 'Operaciones', headcount: 24, leadName: 'José P.', growth: '+4%' },
  { name: 'Recursos Humanos', headcount: 6, leadName: 'María Q.', growth: '+0%' },
  { name: 'Comercial', headcount: 12, leadName: 'Rodrigo C.', growth: '+8%' },
  { name: 'Finanzas', headcount: 8, leadName: 'Sara L.', growth: '−1%' },
  { name: 'Marketing', headcount: 5, leadName: 'Valeria B.', growth: '+15%' },
  { name: 'Producto', headcount: 7, leadName: 'Ana R.', growth: '+5%' },
];

const activity = [
  { t: 'hace 6 min', text: <><b>Mariana Cabrera</b> registró asistencia · ingreso 08:42</>, kind: 'attendance' },
  { t: 'hace 22 min', text: <><b>Ana Lucía Rivera</b> solicitó renovación de contrato</>, kind: 'contract' },
  { t: 'hace 1 h', text: <>Generaste el reporte de planilla <span className="mono">PLA-2026-05</span></>, kind: 'report' },
  { t: 'hace 2 h', text: <><b>Carlos Vargas</b> actualizó CCI del Banco BCP</>, kind: 'data' },
  { t: 'hace 3 h', text: <><b>Diego Soto</b> subió contrato firmado (PDF)</>, kind: 'doc' },
  { t: 'ayer 16:20', text: <>Notificación enviada: 3 contratos vencen en julio</>, kind: 'alert' },
];

const reports = [
  { code: 'PLA-2026-05', name: 'Planilla mensual — mayo 2026', kind: 'Planilla', updated: '2026-05-15', size: '124 KB' },
  { code: 'CON-2026-Q2', name: 'Vencimiento de contratos Q2', kind: 'Contratos', updated: '2026-05-12', size: '38 KB' },
  { code: 'ASI-2026-W19', name: 'Asistencia semana 19', kind: 'Asistencia', updated: '2026-05-11', size: '52 KB' },
  { code: 'VAC-2026-PEN', name: 'Vacaciones pendientes de goce', kind: 'Vacaciones', updated: '2026-05-08', size: '21 KB' },
  { code: 'PLA-2026-04', name: 'Planilla mensual — abril 2026', kind: 'Planilla', updated: '2026-04-15', size: '120 KB' },
  { code: 'ROT-2026-T1', name: 'Rotación primer trimestre', kind: 'Indicadores', updated: '2026-04-05', size: '64 KB' },
];

const bankAccounts = {
  '70123456': { bank: 'BCP', cci: '00219112233445566678', type: 'Cuenta Sueldo PEN' },
  '47568901': { bank: 'Interbank', cci: '00321887766554433211', type: 'Cuenta Sueldo PEN' },
  '76543210': { bank: 'BBVA', cci: '01155667788991122334', type: 'Cuenta Sueldo PEN' },
};

const formatPEN = (n) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (s) => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};
const daysUntil = (s) => {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  const today = new Date('2026-05-20');
  return Math.round((d - today) / 86400000);
};

Object.assign(window, { I, Icon, employees, departments, activity, reports, bankAccounts, formatPEN, formatDate, daysUntil, accentForName, initials });
