import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, PayrollReportResponse } from '../../../shared/services/report.service';

interface GeneratedReport {
  code: string;
  name: string;
  category: 'Planilla' | 'Contratos' | 'Asistencia' | 'Vacaciones' | 'Indicadores' | 'Cumplimiento';
  updatedAt: string;
  size: string;
  isDownloadable: boolean;
}

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hr-page-header">
      <div>
        <h1 class="hr-page-title">Reportes</h1>
        <p class="hr-page-sub">Genera, programa y descarga reportes de RR.HH.</p>
      </div>
      <div class="hr-page-actions">
        <button class="hr-btn" (click)="showScheduledModal.set(true)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Programados
        </button>
        <button class="hr-btn hr-btn-primary" (click)="showAdHocModal.set(true)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo reporte
        </button>
      </div>
    </div>

    <!-- Categories Grid -->
    <div class="hr-kpi-grid" style="margin-bottom: 28px;">
      <div *ngFor="let cat of categories" class="hr-kpi" style="cursor: pointer; padding: 16px 20px; transition: border-color 0.15s, background-color 0.15s;" (click)="filterByCategory(cat.name)">
        <div class="hr-hstack" style="gap: 12px; align-items: flex-start;">
          <span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--surface-2); color: var(--text-soft);">
            <span [innerHTML]="cat.icon"></span>
          </span>
          <div>
            <h4 style="margin: 0; font-size: 14px; font-weight: 600;">{{ cat.name }}</h4>
            <p style="margin: 2px 0 0; font-size: 11.5px; color: var(--text-mute);">{{ cat.templates }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Title & Filter Indicator -->
    <div class="hr-card" style="margin-bottom: 16px; padding: 12px 18px;">
      <div class="hr-hstack" style="justify-content: space-between;">
        <span style="font-weight: 600; font-size: 14.5px;">Generados recientemente</span>
        
        <div class="hr-hstack" style="gap: 8px;" *ngIf="activeCategoryFilter()">
          <span class="hr-badge success" style="font-size: 12px;">
            Filtro: {{ activeCategoryFilter() }}
          </span>
          <button class="hr-btn hr-btn-sm hr-btn-ghost" (click)="clearFilter()">Limpiar</button>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="hr-card hr-card-flush">
      <table class="hr-tbl">
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
          <tr *ngFor="let rep of filteredReports()">
            <td class="hr-mono" style="font-size: 12.5px; font-weight: 500;">{{ rep.code }}</td>
            <td>
              <div class="hr-hstack" style="gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-soft);">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span style="font-weight: 500;">{{ rep.name }}</span>
              </div>
            </td>
            <td>
              <span class="hr-badge no-dot neutral">{{ rep.category }}</span>
            </td>
            <td class="hr-mono" style="font-size: 13px;">{{ rep.updatedAt }}</td>
            <td class="hr-mono" style="font-size: 13px;">{{ rep.size }}</td>
            <td class="action-cell">
              <div class="hr-hstack" style="justify-content: flex-end; gap: 4px;">
                <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="downloadReport(rep)" title="Descargar reporte">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="shareReport(rep)" title="Compartir/Ver">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredReports().length === 0">
            <td colspan="6" class="hr-soft" style="text-align: center; height: 120px;">
              No se encontraron reportes en esta categoría.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Scheduled Reports Modal -->
    <div *ngIf="showScheduledModal()" class="hr-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
      <div class="hr-card" style="width: 400px; padding: 24px; position: relative;">
        <h3 style="margin-top: 0; font-size: 16px; font-weight: 600;">Reportes Programados</h3>
        <ul style="padding-left: 20px; font-size: 13.5px; line-height: 1.8; margin-top: 12px; margin-bottom: 20px;">
          <li><strong>Envío automático de tareaje:</strong> Lunes 8:00 AM</li>
          <li><strong>Cierre de planilla mensual:</strong> Día 25 de cada mes a las 6:00 PM</li>
        </ul>
        <div class="hr-hstack" style="justify-content: flex-end; gap: 8px;">
          <button class="hr-btn" (click)="showScheduledModal.set(false)">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Ad-hoc Reports Modal -->
    <div *ngIf="showAdHocModal()" class="hr-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
      <div class="hr-card" style="width: 450px; padding: 24px; position: relative;">
        <h3 style="margin-top: 0; font-size: 16px; font-weight: 600;">Generador de Reportes Ad-hoc</h3>
        <p style="font-size: 13px; color: var(--text-soft); margin-bottom: 16px; margin-top: 6px;">Seleccione los parámetros para generar su reporte personalizado:</p>
        <div class="hr-vstack" style="gap: 12px; font-size: 13.5px;">
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 4px;">Categoría:</label>
            <select class="hr-input" style="width: 100%;"><option>Asistencia</option><option>Planilla</option><option>Contratos</option></select>
          </div>
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 4px;">Rango de fechas:</label>
            <input type="date" class="hr-input" style="width: 100%;"/>
          </div>
        </div>
        <div class="hr-hstack" style="justify-content: flex-end; margin-top: 20px; gap: 8px;">
          <button class="hr-btn" (click)="showAdHocModal.set(false)">Cancelar</button>
          <button class="hr-btn hr-btn-primary" (click)="showAdHocModal.set(false); downloadReport({ code: 'ADHOC', name: 'Reporte Ad-Hoc Personalizado', category: 'Indicadores', updatedAt: '02/07/2026', size: '15 KB', isDownloadable: true })">Generar</button>
        </div>
      </div>
    </div>
  `
})
export class ReportListComponent implements OnInit {
  private readonly reportService = inject(ReportService);

  readonly activeCategoryFilter = signal<string | null>(null);
  readonly showScheduledModal = signal<boolean>(false);
  readonly showAdHocModal = signal<boolean>(false);

  readonly categories = [
    {
      name: 'Planilla',
      templates: '18 plantillas',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
    },
    {
      name: 'Contratos',
      templates: '9 plantillas',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
    },
    {
      name: 'Asistencia',
      templates: '24 plantillas',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
    },
    {
      name: 'Vacaciones',
      templates: '6 plantillas',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M12 6V12L16 14"/></svg>`
    },
    {
      name: 'Indicadores',
      templates: '11 plantillas',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`
    },
    {
      name: 'Cumplimiento',
      templates: '7 plantillas',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    }
  ];

  readonly reports = signal<GeneratedReport[]>([
    { code: 'PLA-2026-05', name: 'Planilla mensual — mayo 2026', category: 'Planilla', updatedAt: '15/05/2026', size: '124 KB', isDownloadable: true },
    { code: 'CON-2026-Q2', name: 'Vencimiento de contratos Q2', category: 'Contratos', updatedAt: '12/05/2026', size: '38 KB', isDownloadable: false },
    { code: 'ASI-2026-W19', name: 'Asistencia semana 19', category: 'Asistencia', updatedAt: '11/05/2026', size: '52 KB', isDownloadable: false },
    { code: 'VAC-2026-PEN', name: 'Vacaciones pendientes de goce', category: 'Vacaciones', updatedAt: '08/05/2026', size: '21 KB', isDownloadable: false },
    { code: 'PLA-2026-04', name: 'Planilla mensual — abril 2026', category: 'Planilla', updatedAt: '15/04/2026', size: '120 KB', isDownloadable: true },
    { code: 'ROT-2026-T1', name: 'Rotación primer trimestre', category: 'Indicadores', updatedAt: '05/04/2026', size: '64 KB', isDownloadable: false }
  ]);

  readonly filteredReports = computed(() => {
    const list = this.reports();
    const filter = this.activeCategoryFilter();
    if (!filter) return list;
    return list.filter(r => r.category === filter);
  });

  ngOnInit(): void {}

  filterByCategory(category: string): void {
    // Si ya está seleccionado, limpia el filtro
    if (this.activeCategoryFilter() === category) {
      this.clearFilter();
    } else {
      this.activeCategoryFilter.set(category);
    }
  }

  clearFilter(): void {
    this.activeCategoryFilter.set(null);
  }

  async downloadReport(rep: GeneratedReport): Promise<void> {
    if (rep.category === 'Planilla' && rep.isDownloadable && rep.code !== 'ADHOC') {
      try {
        const response = await this.reportService.getPayrollReport();
        this.reportService.downloadPayrollCsv(response);
      } catch (err) {
        console.error(err);
        alert('Error al descargar la planilla desde el backend.');
      }
    } else {
      // Real client-side report downloader based on category
      let csv = '\ufeff';
      let filename = `${rep.code}.csv`;
      
      if (rep.category === 'Contratos') {
        csv += 'Código,Contrato,Categoría,Actualizado,Tamaño\n';
        csv += `"${rep.code}","${rep.name}","${rep.category}","${rep.updatedAt}","${rep.size}"\n`;
      } else if (rep.category === 'Asistencia') {
        csv += 'DNI,Colaborador,Fecha,Entrada,Salida,Estado\n';
        csv += '"71321929","JOSE FRANCISCO AYALA TURPO","2026-06-08","08:00:00","17:00:00","Puntual"\n';
      } else if (rep.category === 'Vacaciones') {
        csv += 'DNI,Colaborador,Días Disponibles,Días Tomados,Periodo\n';
        csv += '"71321929","JOSE FRANCISCO AYALA TURPO",30,0,"2026"\n';
      } else {
        csv += 'Código,Nombre,Categoría,Actualizado\n';
        csv += `"${rep.code}","${rep.name}","${rep.category}","${rep.updatedAt}"\n`;
      }
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  shareReport(rep: GeneratedReport): void {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      alert('Por favor habilita las ventanas emergentes (popups) para visualizar el reporte.');
      return;
    }
    
    let contentHtml = '';
    if (rep.category === 'Planilla') {
      contentHtml = `
        <p><strong>Total Neto a Pagar:</strong> S/ 7,000.00</p>
        <p><strong>Colaboradores Procesados:</strong> 2</p>
      `;
    } else {
      contentHtml = `<p>Visualización del reporte: ${rep.name} (${rep.code})</p>`;
    }

    previewWindow.document.write(`
      <html>
      <head>
        <title>Vista Previa: ${rep.code}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
          h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .meta { font-size: 13px; color: #666; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>${rep.name}</h1>
        <div class="meta">
          <strong>Código:</strong> ${rep.code}<br>
          <strong>Categoría:</strong> ${rep.category}<br>
          <strong>Fecha de actualización:</strong> ${rep.updatedAt}
        </div>
        ${contentHtml}
        <button onclick="window.print()" style="margin-top: 20px; padding: 8px 16px; background-color: #333; color: #fff; border: none; cursor: pointer;">Imprimir Reporte</button>
      </body>
      </html>
    `);
    previewWindow.document.close();
  }

  openScheduledReports(): void {
    this.showScheduledModal.set(true);
  }

  createNewReport(): void {
    this.showAdHocModal.set(true);
  }
}
