# Frontend — Sistema de Recursos Humanos

Aplicación web en **Angular 21** del sistema HR. Base: **Sakai-NG** + PrimeNG + Tailwind. Se está reemplazando progresivamente por el **diseño aprobado** que vive en `../design/`.

📌 **El CLAUDE.md raíz** (`../CLAUDE.md`) tiene el contexto completo del sistema. Léelo antes de codear.

---

## Stack

- **Angular 21** (standalone components + Signals + zoneless change detection)
- **PrimeNG 21** + **@primeuix/themes Aura**
- **TailwindCSS 4** (utilities — los colores vienen de los design tokens, no de Tailwind)
- **NgRx Signal Store** (para estado de features cuando crezca)
- **Reactive Forms** (en formularios complejos) + **template-driven** (para forms simples como login)
- **TypeScript** strict
- Lockfile generado en Linux Docker (cross-platform completo)

---

## Diseño aprobado — fuente visual PRIMARIA

**Regla del proyecto** (confirmada por el usuario):

> El diseño en `../design/project/` es lo que se ve. PrimeNG/Sakai-NG solo se usa cuando un componente complejo lo justifica.

Implicancias:
- **Componentes simples** (botones, inputs, badges, cards, tabs, sidebar, topbar, KPI cards, breadcrumbs, formularios) → construir HTML+CSS desde el diseño. **NO** usar `<p-button>`, `<p-card>`, etc.
- **Componentes complejos** (DataTable con sort/filter, Calendar, Dropdown con autocomplete, Dialog modal, Toast) → SÍ usar PrimeNG, pero **customizar CSS** con `:host ::ng-deep` para que respete los design tokens (`--accent`, `--surface`, alturas `--row-h`, etc.).
- **Tailwind** → solo utilidades de layout (flex, grid, gap, padding). **Cero colores Tailwind semánticos** (`text-blue-500`, `bg-gray-100`, etc.). Los colores vienen de las CSS vars del diseño.
- **Cero colores hardcoded** en componentes — siempre `var(--accent)`, etc.

Todo lo visual sale de `../design/project/`:
- `styles.css` → sistema visual completo (~940 líneas) → ya traducido a `src/assets/styles/design-tokens.scss` y `login.scss`
- `shell.jsx` → LoginScreen + Sidebar + Topbar (pendiente Fase C)
- `screens-dashboard.jsx` → Dashboard (pendiente Fase D)
- `screens-contratos.jsx` → Contratos lista + wizard (pendiente Fase E)
- `screens-colaboradores.jsx` → Colaboradores lista + detalle (pendiente Fase F)
- `screens-ops.jsx` → Asistencia + Vacaciones + Reportes + Configuración (pendiente Fase G)
- `data.jsx` → mock data + iconos Lucide-style

**Antes de implementar una pantalla, leer el JSX correspondiente del diseño.**

---

## Estructura

```
src/app/
├── core/                      # Singleton (1 instancia)
│   ├── auth/                  # AuthService (Signals), guards, models
│   ├── http/interceptors/     # auth + error
│   ├── config/                # ThemeService (tema/densidad/acento)
│   └── tokens/
├── shared/                    # Reutilizable, sin estado
│   ├── components/
│   ├── directives/
│   ├── pipes/                 # dni-format, currency-pen, ubigeo (pendientes)
│   ├── validators/
│   └── models/
├── features/                  # 1 carpeta por módulo del sistema
│   └── contracts/             # (pendiente Fase E)
├── pages/                     # Páginas standalone heredadas de Sakai
│   ├── auth/login.ts          # ✅ Redesigned (Fase B)
│   └── ...                    # demo pages de Sakai (se eliminan en Fase C)
├── layout/                    # Layout de Sakai (se reemplaza en Fase C)
├── app.component.ts
├── app.config.ts
└── app.routes.ts

src/assets/
├── styles/
│   ├── design-tokens.scss     # ✅ Tokens del diseño (Fase A)
│   └── login.scss             # ✅ Login styles (Fase B)
├── styles.scss                # Orden de imports
├── tailwind.css               # Tailwind 4 config
├── layout/                    # SCSS heredado de Sakai
└── demo/                      # SCSS heredado de Sakai (se elimina)

src/environments/              # apiUrl dev/prod
```

---

## Reglas NO negociables

### Componentes
- ✅ Standalone components (sin NgModules).
- ✅ `components/` = presentacionales: solo `@Input` / `@Output`, **prohibido llamar APIs**.
- ✅ `pages/` = containers: llaman al store o a services.
- ✅ Cambio de detección **OnPush** o **zoneless** (ya configurado globalmente).

### Estado
- ✅ **Signals** para estado local.
- ✅ **NgRx Signal Store** para estado del feature cuando crezca.
- ❌ Sin RxJS Subjects manuales para estado.

### Formularios
- ✅ **Reactive Forms** en formularios complejos (wizards, multi-step).
- ✅ Template-driven OK en forms simples (login).
- ✅ Validadores compartidos en `shared/validators/` (DNI, RUC, UBIGEO — pendientes).

### Estilos
- ✅ **Design tokens** del diseño aprobado (CSS vars en `:root`) son la fuente de verdad de colores/spacing/tipografía.
- ✅ TailwindCSS para utilidades de layout (flex, grid, gap).
- ✅ PrimeNG para componentes (DataTable, Calendar, Dropdown, Dialog).
- ✅ SCSS específico del feature en `<feature>/styles/`.
- ❌ Cero CSS global nuevo fuera de `src/assets/styles/`.
- ❌ NO usar `#hexcolor` hardcodeado en componentes — siempre `var(--accent)`, `var(--surface)`, etc.

### Iconos
- ✅ SVG inline Lucide-style (stroke 1.75) — copiar de `design/project/data.jsx`.
- ✅ PrimeIcons para componentes PrimeNG.
- ❌ Sin FontAwesome ni Material Icons.

### Rutas
- ✅ Lazy loading por feature.
- ✅ Guards en `core/auth/guards/` (`authGuard`, `guestGuard`).

### HTTP
- ✅ Servicios usan `HttpClient`.
- ✅ URL base desde `environment.apiUrl`.
- ✅ Interceptores globales: `authInterceptor` (Bearer JWT) + `errorInterceptor` (logout en 401).

---

## i18n / Localización

- UI en **español (Perú)** (`es-PE`).
- Moneda en **PEN** (Soles) — pipe `currencyPen` (pendiente).
- Fechas formato `dd/MM/yyyy` — pipe `peDate` (pendiente).
- Números con separador de miles `,` y decimal `.`.

---

## Estado actual del frontend

### Fases del diseño

| Fase | Estado | Notas |
|------|--------|-------|
| **A** Design tokens globales | ✅ done | `design-tokens.scss` con CSS vars + Geist font + light/dark + densidades. `ThemeService` con signals + localStorage. |
| **B** Login redesign | ✅ done | Split-screen + aside con pills + form integrado con `AuthService`. SSO M365 placeholder. |
| **C** App Shell | ⚪ next | Reemplaza `layout/component/app.layout.*` con sidebar 260px (logo RH, tenant switcher, nav agrupada Operación/Administración) + topbar (breadcrumbs + search ⌘K) + tweaks panel. Borra demo pages de Sakai. |
| **D** Dashboard | ⚪ | Feature `dashboard/`: 4 KPI cards + bar chart 12m + donut por modalidad + tabla contratos por vencer + activity feed + grid áreas. Necesita endpoints del backend (`GET /api/dashboard/*`). |
| **E** Contratos | ⚪ | Feature `contracts/`: lista con filtros por estado + **wizard 6 pasos**. Conecta a backend ya existente `POST /api/contracts`. Validación cliente espeja `ContractKind`/`ContractPeriod`. |
| **F** Colaboradores | ⚪ | Feature `employees/`: lista (tabla/cards) + filtros + detalle 6 tabs. Necesita backend Módulo 02. |
| **G** Restantes | ⚪ | Asistencia, Vacaciones, Reportes, Configuración. Cada una necesita su módulo backend. |

### Pendiente transversal (no atado a fase)

- [ ] **Tweaks panel** (esquina inferior derecha): tema + densidad + acento — se construye sobre `ThemeService`
- [ ] **Pipes peruanos**: `dniFormat`, `currencyPen`, `ubigeoFormat`, `peDate`
- [ ] **Validadores compartidos**: `validateDni`, `validateRuc`, `validateUbigeo`
- [ ] **Iconos Lucide** — instalar `lucide-angular` o crear `<hr-icon>` componente
- [ ] **i18n setup** si llega a ser multi-idioma (por ahora solo es-PE)
- [ ] **Eliminación de Sakai demo** (uikit, pages, landing, documentation, dashboard demo) — se hace en Fase C

---

## Comandos

```powershell
# Setup local
npm install --ignore-scripts

# Dev
npm start                       # ng serve en :4200
npm run build:prod              # ng build --configuration production
npm test
npm run lint
npm run format

# Audit
npm run audit:high
npm run ci:install              # para CI: ci con scripts bloqueados
```

---

## Cómo levantar en Docker

Forma parte del stack completo en la raíz. La imagen del frontend hace `npm ci --include=optional` en stage builder (scripts permitidos para binarios nativos como `lightningcss`), luego `nginx:1.31-alpine` sirviendo los estáticos.

```powershell
cd ..
docker compose build frontend
docker compose up -d frontend --force-recreate
# http://localhost:9080
```

---

## Convenciones

- Idioma del código: **inglés**.
- Idioma de la UI (labels, mensajes): **español (Perú)**.
- Sin comentarios decorativos.
- TypeScript strict.
- Sin colores hardcodeados — usar design tokens.
