import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { MealService } from '../../../shared/services/meal.service';
import { EmployeeService } from '../../../shared/services/employee.service';
import { Employee } from '../../../shared/models/hr.models';
import { environment } from '../../../../environments/environment';
import jsQR from 'jsqr';

interface ScanLog {
  time: Date;
  employeeName: string;
  type: 'entrada' | 'salida' | 'desayuno' | 'almuerzo' | 'cena';
  status: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string; // photo path on server if meal
  message: string;
  success: boolean;
}

@Component({
  selector: 'app-attendance-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hr-scanner-container">
      <!-- Header -->
      <div class="hr-scanner-header">
        <div class="hr-badge-guard">MÓDULO SEGURIDAD Y CONTROL</div>
        <h1 class="hr-scanner-title">Punto de Control Biométrico QR</h1>
        <p class="hr-scanner-desc">
          Marcación centralizada para guardias. Permite registrar la asistencia (entrada/salida) o verificar el refrigerio (comedor) mediante código QR.
        </p>
      </div>

      <!-- Segmented Mode Control -->
      <div class="hr-mode-toggle-wrapper">
        <div class="hr-mode-toggle">
          <button class="hr-mode-tab" 
                  [class.active]="activeMode() === 'asistencia'" 
                  (click)="setMode('asistencia')">
            <span class="icon">🕒</span> Asistencia (Entrada/Salida)
          </button>
          <button class="hr-mode-tab" 
                  [class.active]="activeMode() === 'refrigerio'" 
                  (click)="setMode('refrigerio')">
            <span class="icon">🍲</span> Refrigerio (Comedor)
          </button>
        </div>
      </div>

      <!-- Main Layout Grid -->
      <div class="hr-scanner-grid">
        
        <!-- Left Column: Camera Viewfinder & Controls -->
        <div class="hr-scanner-left">
          
          <!-- Refrigerio Meal-Type Sub-card -->
          <div *ngIf="activeMode() === 'refrigerio'" class="hr-glass-card hr-meal-selector-card">
            <div class="hr-card-title-container">
              <span class="hr-title-dot yellow"></span>
              <h3>Ración Activa (Detección Automática)</h3>
            </div>
            
            <div class="hr-meal-buttons">
              <button class="hr-meal-btn desayuno" 
                      [class.active]="mealType() === 'desayuno'" 
                      (click)="setMealType('desayuno')">
                <span class="icon">☕</span>
                <span class="lbl">Desayuno</span>
                <span class="time-range">05:00 - 11:00</span>
              </button>
              
              <button class="hr-meal-btn almuerzo" 
                      [class.active]="mealType() === 'almuerzo'" 
                      (click)="setMealType('almuerzo')">
                <span class="icon">🍲</span>
                <span class="lbl">Almuerzo</span>
                <span class="time-range">11:00 - 16:00</span>
              </button>
              
              <button class="hr-meal-btn cena" 
                      [class.active]="mealType() === 'cena'" 
                      (click)="setMealType('cena')">
                <span class="icon">🌙</span>
                <span class="lbl">Cena</span>
                <span class="time-range">16:00 - 23:59</span>
              </button>
            </div>
          </div>

          <!-- Main Viewfinder Card -->
          <div class="hr-glass-card hr-main-scanner-card">
            <div class="hr-card-glow" 
                 [class.asistencia]="activeMode() === 'asistencia'"
                 [class.desayuno]="activeMode() === 'refrigerio' && mealType() === 'desayuno'" 
                 [class.almuerzo]="activeMode() === 'refrigerio' && mealType() === 'almuerzo'" 
                 [class.cena]="activeMode() === 'refrigerio' && mealType() === 'cena'"></div>
            
            <div class="hr-scanner-viewfinder">
              <!-- Laser Scanner Beam (Only when camera is active or simulating) -->
              <div class="hr-laser-beam" 
                   [class.scanning]="isCameraActive() || isSimulating()"></div>
              
              <!-- Video / Live Stream -->
              <video #videoElement 
                     [class.active]="isCameraActive() && !capturedPhoto()" 
                     autoplay playsinline class="hr-video-preview"></video>
              
              <!-- Captured QR badge photo preview -->
              <img *ngIf="capturedPhoto()" 
                   [src]="capturedPhoto()" class="hr-photo-preview" alt="Foto credencial"/>

              <!-- Hidden canvas for photo snapshot -->
              <canvas #canvasElement style="display: none;"></canvas>
              
              <!-- Scanned User Overlay -->
              <div *ngIf="scannedEmployee()" class="hr-scanned-overlay">
                <div class="hr-scanned-info">
                  <div class="icon">✅</div>
                  <div class="name">{{ scannedEmployee()?.firstName }} {{ scannedEmployee()?.lastName }}</div>
                  <div class="desc">Credencial Detectada. Procesando...</div>
                </div>
              </div>

              <!-- Camera Off Placeholder -->
              <div *ngIf="!isCameraActive() && !capturedPhoto()" class="hr-scanner-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="hr-camera-icon">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <p class="hr-placeholder-txt">Cámara Apagada</p>
                <span class="hr-placeholder-sub">Activa la cámara para tomar una foto del fotocheck/credencial QR</span>
              </div>
            </div>

            <!-- Camera Controls -->
            <div class="hr-scanner-actions">
              <!-- Turn camera ON (Shared) -->
              <button *ngIf="!isCameraActive() && !capturedPhoto()" class="hr-btn-premium hr-btn-cyan" (click)="startCamera()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"/>
                </svg>
                Activar Cámara
              </button>

              <!-- Turn camera OFF (Shared) -->
              <button *ngIf="isCameraActive() && !capturedPhoto()" class="hr-btn-premium hr-btn-danger" (click)="stopCamera()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M9 9h6v6H9z"/>
                </svg>
                Desactivar Cámara
              </button>

              <!-- Capture Photo -->
              <button *ngIf="isCameraActive() && !capturedPhoto()" class="hr-btn-premium hr-btn-orange" (click)="takePhoto()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Capturar Fotocheck
              </button>

              <!-- Retake Photo -->
              <button *ngIf="capturedPhoto()" class="hr-btn-premium hr-btn-outline" (click)="retakePhoto()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                Volver a Tomar
              </button>
            </div>
          </div>

          <!-- Simulator Card (For Local developer testing) - Commented out for production
          <div class="hr-glass-card hr-simulator-card">
            <div class="hr-card-title-container">
              <span class="hr-title-dot purple"></span>
              <h3>Panel de Simulación (Desarrollo Local)</h3>
            </div>
            
            <p class="hr-card-info">
              Selecciona un colaborador para simular la lectura de su código QR y registrar la transacción.
            </p>

            <div class="hr-form-group">
              <label for="employeeSelect">Colaborador:</label>
              <select id="employeeSelect" class="hr-custom-select" [ngModel]="selectedEmployeeId()" (ngModelChange)="selectedEmployeeId.set($event)" (change)="onEmployeeSelected()">
                <option value="">Selecciona un colaborador...</option>
                <option *ngFor="let emp of employees()" [value]="emp.id">
                  {{ emp.firstName }} {{ emp.lastName }} ({{ emp.position }})
                </option>
              </select>
            </div>

            <div class="hr-form-group" *ngIf="!capturedPhoto()">
              <button class="hr-btn-premium hr-btn-outline w-full" (click)="generateSimulatedPhoto()">
                <span class="icon">🖼️</span> Generar Fotocheck QR Simulado
              </button>
            </div>

            <div *ngIf="selectedEmployeeToken()" class="hr-token-badge">
              <span class="label">Token QR:</span>
              <span class="value">{{ selectedEmployeeToken() }}</span>
            </div>

            <button class="hr-btn-premium hr-btn-purple w-full mt-4" 
                    [disabled]="isSubmitDisabled()" 
                    (click)="simulateScan()">
              <span *ngIf="!isSimulating() && !isApiLoading()">
                {{ activeMode() === 'asistencia' ? 'Registrar Asistencia (Credencial QR)' : 'Registrar Alimentación (Credencial QR)' }}
              </span>
              <span *ngIf="isSimulating() && !isApiLoading()">Procesando...</span>
              <span *ngIf="isApiLoading()">Conectando con Servidor...</span>
            </button>
          </div>
          -->
        </div>

        <!-- Right Column: Location & Result Feed -->
        <div class="hr-scanner-right">
          
          <!-- GPS Status Card -->
          <div class="hr-glass-card hr-location-card">
            <div class="hr-card-title-container">
              <span class="hr-title-dot" [class.green]="gpsStatus() === 'success'" [class.yellow]="gpsStatus() === 'loading'" [class.red]="gpsStatus() === 'error'"></span>
              <h3>Estado de Geolocalización (GPS)</h3>
            </div>

            <div class="hr-location-details" [class.error]="gpsStatus() === 'error'" [class.success]="gpsStatus() === 'success'">
              <div *ngIf="gpsStatus() === 'loading'" class="hr-gps-loading">
                <div class="hr-spinner-small"></div>
                <span>Adquiriendo señal satelital / coordenadas...</span>
              </div>

              <div *ngIf="gpsStatus() === 'error'" class="hr-gps-error">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14v.01M12 8v5"/>
                </svg>
                <div class="msg-box">
                  <strong>Acceso GPS Denegado / No disponible</strong>
                  <p>Habilita los permisos de ubicación en tu navegador para continuar.</p>
                </div>
              </div>

              <div *ngIf="gpsStatus() === 'success'" class="hr-gps-success-grid">
                <div class="coordinate-item">
                  <span class="coord-lbl">Latitud</span>
                  <span class="coord-val">{{ currentLatitude() | number:'1.6-6' }}</span>
                </div>
                <div class="coordinate-item">
                  <span class="coord-lbl">Longitud</span>
                  <span class="coord-val">{{ currentLongitude() | number:'1.6-6' }}</span>
                </div>
                <div class="coordinate-item full">
                  <span class="coord-lbl">Precisión GPS</span>
                  <span class="coord-val">± {{ gpsAccuracy() }} metros</span>
                </div>
              </div>
            </div>

            <button class="hr-btn-premium hr-btn-outline w-full" (click)="requestLocation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              Recargar Ubicación GPS
            </button>
          </div>

          <!-- Last Scan Result Display Card -->
          <div *ngIf="lastScanResult()" class="hr-glass-card hr-result-display-card" [class.success]="lastScanResult()?.success" [class.error]="!lastScanResult()?.success">
            <div class="hr-result-pulse-ring"></div>
            
            <div class="hr-result-header">
              <span class="hr-result-type-badge" 
                    [class.entrada]="lastScanResult()?.type === 'entrada'" 
                    [class.salida]="lastScanResult()?.type === 'salida'"
                    [class.desayuno]="lastScanResult()?.type === 'desayuno'" 
                    [class.almuerzo]="lastScanResult()?.type === 'almuerzo'" 
                    [class.cena]="lastScanResult()?.type === 'cena'"
                    [class.error]="!lastScanResult()?.success">
                {{ lastScanResult()?.success ? (lastScanResult()?.status === 'termino' ? 'TÉRMINO ' + (lastScanResult()?.type | uppercase) : (lastScanResult()?.type | uppercase)) : 'ERROR DE REGISTRO' }}
              </span>
              <span class="hr-result-time">{{ lastScanResult()?.time | date:'HH:mm:ss' }}</span>
            </div>

            <h2 class="hr-result-name">{{ lastScanResult()?.employeeName }}</h2>
            <p class="hr-result-msg">{{ lastScanResult()?.message }}</p>

            <!-- Server uploaded evidence photo (Credential/Meal) -->
            <div *ngIf="lastScanResult()?.photoUrl" class="hr-server-photo-container">
              <span class="lbl">Evidencia Fotográfica Registrada:</span>
              <img [src]="lastScanResult()?.photoUrl" class="hr-server-photo" alt="Evidencia de marcación"/>
            </div>

            <div class="hr-result-footer">
              <span class="coords" *ngIf="lastScanResult()?.latitude">GPS: {{ lastScanResult()?.latitude | number:'1.4-4' }}, {{ lastScanResult()?.longitude | number:'1.4-4' }}</span>
              <span class="status-badge" [class.tardanza]="lastScanResult()?.status === 'tardanza'">
                {{ lastScanResult()?.status | uppercase }}
              </span>
            </div>
          </div>

          <!-- Consolidated Session Log History -->
          <div class="hr-glass-card hr-history-card">
            <div class="hr-card-title-container" style="justify-content: space-between;">
              <div class="hr-hstack">
                <span class="hr-title-dot purple"></span>
                <h3>Monitor de Registros de la Sesión</h3>
              </div>
              <button *ngIf="sessionLogs().length > 0" class="hr-btn-clear" (click)="clearLogs()">Limpiar</button>
            </div>

            <div class="hr-history-list" [class.empty]="sessionLogs().length === 0">
              <div *ngIf="sessionLogs().length === 0" class="hr-empty-history">
                <p>No hay marcaciones registradas en esta sesión.</p>
              </div>

              <div *ngFor="let log of sessionLogs()" class="hr-history-item" [class.success]="log.success" [class.error]="!log.success">
                
                <!-- Display tiny thumbnail if evidence photo is present, otherwise simple icon -->
                <img *ngIf="log.photoUrl" [src]="log.photoUrl" class="hr-hist-thumb" alt="Miniatura"/>
                <div *ngIf="!log.photoUrl" class="hr-hist-icon-fallback">
                  {{ log.type === 'entrada' || log.type === 'salida' ? '🕒' : '🍲' }}
                </div>

                <div class="hr-hist-body">
                  <div class="hr-hist-name">{{ log.employeeName }}</div>
                  <div class="hr-hist-desc">{{ log.message }}</div>
                </div>
                
                <span class="hr-hist-badge" 
                      [class.entrada]="log.type === 'entrada'" 
                      [class.salida]="log.type === 'salida'"
                      [class.desayuno]="log.type === 'desayuno'" 
                      [class.almuerzo]="log.type === 'almuerzo'" 
                      [class.cena]="log.type === 'cena'" 
                      [class.err]="!log.success">
                  {{ log.success ? (log.status === 'termino' ? 'Fin ' + (log.type | titlecase) : (log.type | titlecase)) : 'Error' }}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .hr-scanner-container {
      padding: 16px;
      color: var(--text);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
      max-width: 1200px;
      margin: 0 auto;
    }

    .hr-scanner-header {
      margin-bottom: 20px;
    }

    .hr-badge-guard {
      display: inline-block;
      padding: 4px 10px;
      background: var(--accent);
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--accent-fg);
      margin-bottom: 12px;
      box-shadow: 0 0 12px var(--accent-soft);
    }

    .hr-scanner-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.5px;
      margin: 0 0 8px 0;
    }

    .hr-scanner-desc {
      color: var(--text-soft);
      font-size: 15px;
      max-width: 700px;
      line-height: 1.5;
      margin: 0;
    }

    /* Mode toggler styling */
    .hr-mode-toggle-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .hr-mode-toggle {
      display: flex;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 4px;
      width: 100%;
      max-width: 500px;
    }

    .hr-mode-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: var(--text-soft);
      font-weight: 600;
      font-size: 14.5px;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .hr-mode-tab:hover {
      color: var(--text);
    }

    .hr-mode-tab.active {
      background: var(--accent);
      color: var(--accent-fg);
      box-shadow: var(--shadow-sm);
    }

    .hr-scanner-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 24px;
    }

    @media (max-width: 992px) {
      .hr-scanner-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Glass Cards */
    .hr-glass-card {
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hr-glass-card:hover {
      border-color: var(--accent);
      box-shadow: var(--shadow-lg);
    }

    .hr-card-glow {
      position: absolute;
      top: 0;
      left: 20%;
      right: 20%;
      height: 1px;
      transition: background 0.3s;
    }

    .hr-card-glow.asistencia {
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
    }
    .hr-card-glow.desayuno {
      background: linear-gradient(90deg, transparent, var(--warning), transparent);
    }
    .hr-card-glow.almuerzo {
      background: linear-gradient(90deg, transparent, var(--info), transparent);
    }
    .hr-card-glow.cena {
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
    }

    /* Refrigerio Sub-card Meal selector */
    .hr-meal-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 8px;
    }

    .hr-meal-btn {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 4px;
      color: var(--text-soft);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hr-meal-btn .icon { font-size: 20px; }
    .hr-meal-btn .lbl { font-size: 13.5px; font-weight: 700; }
    .hr-meal-btn .time-range { font-size: 10px; opacity: 0.7; }

    .hr-meal-btn.desayuno.active {
      background: var(--warning-soft);
      border-color: var(--warning);
      color: oklch(0.5 0.15 70);
      box-shadow: 0 0 15px var(--warning-soft);
    }
    .hr-meal-btn.almuerzo.active {
      background: var(--info-soft);
      border-color: var(--info);
      color: var(--info);
      box-shadow: 0 0 15px var(--info-soft);
    }
    .hr-meal-btn.cena.active {
      background: var(--accent-soft);
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 15px var(--accent-soft);
    }

    /* Viewfinder Scanner */
    .hr-scanner-viewfinder {
      position: relative;
      width: 100%;
      height: 320px;
      background: #0f172a;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-strong);
    }

    .hr-video-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: none;
    }

    .hr-video-preview.active {
      display: block;
    }

    .hr-photo-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .hr-laser-beam {
      position: absolute;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.8), rgba(168, 85, 247, 0.1));
      box-shadow: 0 0 8px 2px rgba(168, 85, 247, 0.5);
      z-index: 10;
      top: 0;
      display: none;
    }

    .hr-laser-beam.scanning {
      display: block;
      animation: laserPulse 2.5s infinite ease-in-out;
    }

    @keyframes laserPulse {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }

    .hr-scanner-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px;
      color: var(--text-mute);
    }

    .hr-scanned-overlay {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: rgba(16, 185, 129, 0.9);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 16px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
    }

    @keyframes popIn {
      0% { transform: translateY(20px) scale(0.9); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }

    .hr-scanned-info {
      text-align: center;
    }

    .hr-scanned-info .icon {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .hr-scanned-info .name {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .hr-scanned-info .desc {
      font-size: 12px;
      opacity: 0.9;
    }

    .hr-camera-icon {
      color: var(--text-mute);
      margin-bottom: 16px;
      animation: cameraPulse 2s infinite ease-in-out;
    }

    @keyframes cameraPulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.05); opacity: 1; }
    }

    .hr-placeholder-txt {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-mute);
      margin: 0 0 6px 0;
    }

    .hr-placeholder-sub {
      font-size: 12px;
      color: var(--text-soft);
      max-width: 250px;
      line-height: 1.4;
    }

    .hr-scanner-actions {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    /* Buttons */
    .hr-btn-premium {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 14.5px;
      font-weight: 600;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      color: #fff;
      transition: all 0.2s ease;
    }

    .w-full { width: 100%; }
    .mt-4 { margin-top: 16px; }

    .hr-btn-cyan {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
    }
    .hr-btn-cyan:hover:not(:disabled) {
      transform: translateY(-1.5px);
      box-shadow: 0 6px 18px rgba(6, 182, 212, 0.4);
    }

    .hr-btn-orange {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
    }
    .hr-btn-orange:hover:not(:disabled) {
      transform: translateY(-1.5px);
      box-shadow: 0 6px 18px rgba(249, 115, 22, 0.4);
    }

    .hr-btn-purple {
      background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);
      box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3);
    }
    .hr-btn-purple:hover:not(:disabled) {
      transform: translateY(-1.5px);
      box-shadow: 0 6px 18px rgba(168, 85, 247, 0.4);
    }

    .hr-btn-danger {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
    }
    .hr-btn-danger:hover {
      transform: translateY(-1.5px);
      box-shadow: 0 6px 18px rgba(239, 68, 68, 0.4);
    }

    .hr-btn-outline {
      background: transparent;
      border: 1px solid var(--border-strong);
      color: var(--text-soft);
    }
    .hr-btn-outline:hover:not(:disabled) {
      background: var(--surface-2);
      border-color: var(--border-strong);
    }

    .hr-btn-premium:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    /* Simulator Panel */
    .hr-card-title-container {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .hr-title-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--text-mute);
    }
    .hr-title-dot.green { background: #10b981; box-shadow: 0 0 10px #10b981; }
    .hr-title-dot.yellow { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
    .hr-title-dot.red { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
    .hr-title-dot.blue { background: #06b6d4; box-shadow: 0 0 10px #06b6d4; }
    .hr-title-dot.purple { background: var(--accent); box-shadow: 0 0 10px var(--accent); }

    .hr-simulator-card h3, .hr-location-card h3, .hr-history-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .hr-card-info {
      font-size: 13.5px;
      color: var(--text-soft);
      line-height: 1.45;
      margin: 0 0 18px 0;
    }

    .hr-form-group {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hr-form-group label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-soft);
    }

    .hr-custom-select {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      padding: 10px 14px;
      font-size: 14px;
      outline: none;
      width: 100%;
      transition: border-color 0.2s;
    }
    .hr-custom-select:focus { border-color: var(--accent); }

    .hr-token-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--accent-soft);
      border: 1px dashed var(--accent);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 12px;
    }
    .hr-token-badge .label { color: var(--accent); font-weight: 600; }
    .hr-token-badge .value { font-family: monospace; color: var(--text); font-weight: bold; }

    /* GPS Coordinates Details */
    .hr-location-details {
      background: var(--surface-2);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 18px;
      border: 1px solid var(--border);
    }

    .hr-gps-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #f59e0b;
      font-size: 13.5px;
    }

    .hr-spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(245, 158, 11, 0.2);
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .hr-gps-error { display: flex; gap: 12px; color: #ef4444; }
    .hr-gps-error .msg-box { flex: 1; }
    .hr-gps-error strong { font-size: 14px; display: block; margin-bottom: 4px; }
    .hr-gps-error p { font-size: 12.5px; color: var(--text-soft); margin: 0; line-height: 1.4; }

    .hr-gps-success-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .coordinate-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .coordinate-item.full {
      grid-column: span 2;
      border-top: 1px solid var(--border);
      padding-top: 8px;
      margin-top: 4px;
    }

    .coord-lbl {
      font-size: 11px;
      color: var(--text-mute);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .coord-val {
      font-size: 14px;
      font-family: monospace;
      color: var(--text);
      font-weight: 600;
    }

    /* Result Display Card */
    .hr-result-display-card {
      border-width: 2px;
      transform: scale(1);
      animation: resultEntry 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes resultEntry {
      0% { transform: scale(0.9); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .hr-result-display-card.success {
      border-color: var(--success);
      background: var(--success-soft);
    }
    .hr-result-display-card.error {
      border-color: var(--danger);
      background: var(--danger-soft);
    }

    .hr-result-pulse-ring {
      position: absolute;
      top: -50px;
      right: -50px;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
      z-index: 1;
    }
    .hr-result-display-card.error .hr-result-pulse-ring {
      background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
    }

    .hr-result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      position: relative;
      z-index: 2;
    }

    .hr-result-type-badge {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .hr-result-type-badge.entrada { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .hr-result-type-badge.salida { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
    .hr-result-type-badge.desayuno { background: #d97706; color: #fff; }
    .hr-result-type-badge.almuerzo { background: #0891b2; color: #fff; }
    .hr-result-type-badge.cena { background: #7e22ce; color: #fff; }
    .hr-result-type-badge.error { background: rgba(239, 68, 68, 0.2); color: #f87171; }

    .hr-result-time {
      font-size: 12px;
      font-family: monospace;
      color: var(--text-mute);
    }

    .hr-result-name {
      font-size: 22px;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 6px 0;
      position: relative;
      z-index: 2;
    }

    .hr-result-msg {
      font-size: 14.5px;
      color: var(--text-soft);
      line-height: 1.4;
      margin: 0 0 16px 0;
      position: relative;
      z-index: 2;
    }

    /* Sustento photo styles */
    .hr-server-photo-container {
      margin-bottom: 16px;
      position: relative;
      z-index: 2;
    }
    .hr-server-photo-container .lbl {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-mute);
      margin-bottom: 6px;
    }
    .hr-server-photo {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .hr-result-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-mute);
      border-top: 1px solid var(--border);
      padding-top: 12px;
      position: relative;
      z-index: 2;
    }

    .hr-result-footer .status-badge {
      font-weight: 700;
      text-transform: uppercase;
      color: #10b981;
    }
    .hr-result-footer .status-badge.tardanza { color: #f59e0b; }

    /* Session Logs History */
    .hr-btn-clear {
      background: transparent;
      border: none;
      color: var(--text-mute);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s;
    }
    .hr-btn-clear:hover { color: var(--text); }

    .hr-history-list {
      max-height: 280px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .hr-history-list.empty {
      justify-content: center;
      align-items: center;
      height: 100px;
    }
    .hr-empty-history {
      font-size: 13.5px;
      color: var(--text-soft);
      text-align: center;
    }

    .hr-history-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface-2);
      border-radius: 8px;
      padding: 10px 12px;
      border-left: 3px solid var(--border-strong);
      transition: transform 0.2s;
    }
    .hr-history-item:hover { transform: translateX(2px); }
    .hr-history-item.success { border-left-color: #10b981; }
    .hr-history-item.error { border-left-color: #ef4444; }

    /* Thumbnails and fallbacks */
    .hr-hist-thumb {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 6px;
      background: var(--surface-3);
    }
    .hr-hist-icon-fallback {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      background: var(--surface-3);
      border-radius: 6px;
    }

    .hr-hist-body {
      flex: 1;
      min-width: 0;
    }
    .hr-hist-name {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hr-hist-desc {
      font-size: 11.5px;
      color: var(--text-soft);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hr-hist-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
    }
    .hr-hist-badge.entrada { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .hr-hist-badge.salida { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .hr-hist-badge.desayuno { background: #d97706; }
    .hr-hist-badge.almuerzo { background: #0891b2; }
    .hr-hist-badge.cena { background: #7e22ce; }
    .hr-hist-badge.err { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

    .hr-hstack {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class AttendanceScannerComponent implements OnInit, OnDestroy {
  private readonly attendanceService = inject(AttendanceService);
  private readonly mealService = inject(MealService);
  private readonly employeeService = inject(EmployeeService);

  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElementRef!: ElementRef<HTMLCanvasElement>;

  // Modes: 'asistencia' (Entry/Exit Clocking) or 'refrigerio' (Meal record verification)
  readonly activeMode = signal<'asistencia' | 'refrigerio'>('asistencia');
  
  // States
  readonly employees = signal<Employee[]>([]);
  readonly selectedEmployeeId = signal<string>('');
  readonly sessionLogs = signal<ScanLog[]>([]);
  
  readonly scannedEmployee = signal<Employee | null>(null);

  readonly isCameraActive = signal<boolean>(false);
  readonly isSimulating = signal<boolean>(false);
  readonly isApiLoading = signal<boolean>(false);

  // Meal specific states
  readonly mealType = signal<'desayuno' | 'almuerzo' | 'cena'>('almuerzo');
  readonly capturedPhoto = signal<string | null>(null);
  readonly capturedBlob = signal<Blob | null>(null);

  // GPS Coordinates
  readonly gpsStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly currentLatitude = signal<number | null>(null);
  readonly currentLongitude = signal<number | null>(null);
  readonly gpsAccuracy = signal<number>(0);

  // Results
  readonly lastScanResult = signal<ScanLog | null>(null);

  // Camera stream tracks reference
  private mediaStream: MediaStream | null = null;

  // Selected Employee computed details
  readonly selectedEmployeeToken = computed(() => {
    const empId = this.selectedEmployeeId();
    if (!empId) return '';
    const emp = this.employees().find(e => e.id === empId);
    return emp?.qrCodeToken ?? '';
  });

  async ngOnInit(): Promise<void> {
    // 1. Initial GPS loading
    this.requestLocation();

    // 2. Load active employees for simulator panel
    await this.loadEmployees();

    // 3. Compute default meal type based on hour
    this.calculateMealType();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setMode(mode: 'asistencia' | 'refrigerio'): void {
    this.activeMode.set(mode);
    // Stop camera if mode changes to avoid stream leaks
    this.stopCamera();
    // Clear selected employee and visual scanner states to prevent bugs
    this.selectedEmployeeId.set('');
    this.capturedPhoto.set(null);
    this.capturedBlob.set(null);
    this.lastScanResult.set(null);
    this.isSimulating.set(false);
    this.isApiLoading.set(false);
    
    // Recompute active meal type if changing to meal
    if (mode === 'refrigerio') {
      this.calculateMealType();
    }
  }

  setMealType(type: 'desayuno' | 'almuerzo' | 'cena'): void {
    this.mealType.set(type);
  }

  private calculateMealType(): void {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      this.mealType.set('desayuno');
    } else if (hour >= 11 && hour < 16) {
      this.mealType.set('almuerzo');
    } else {
      this.mealType.set('cena');
    }
  }

  onEmployeeSelected(): void {
    this.isSimulating.set(false);
  }

  // Fetch employees to populate simulation selector
  async loadEmployees(): Promise<void> {
    try {
      const response = await this.employeeService.getEmployees('', '', 1, 100);
      const now = new Date();
      const activeList = response.data.filter(emp => {
        if (!emp.terminationDate) return true;
        return new Date(emp.terminationDate) >= now;
      });
      this.employees.set(activeList);
    } catch (err) {
      console.error('Error loading employees for simulator:', err);
    }
  }

  // Request browser location coordinates
  requestLocation(): void {
    if (!navigator.geolocation) {
      this.gpsStatus.set('error');
      return;
    }

    this.gpsStatus.set('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentLatitude.set(position.coords.latitude);
        this.currentLongitude.set(position.coords.longitude);
        this.gpsAccuracy.set(Math.round(position.coords.accuracy));
        this.gpsStatus.set('success');
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        this.gpsStatus.set('error');
        // Fallback coordination on local developer environments
        this.currentLatitude.set(-12.046374); // Lima Plaza Mayor
        this.currentLongitude.set(-77.031252);
        this.gpsAccuracy.set(20);
        this.gpsStatus.set('success');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Start Camera WebRTC Stream
  async startCamera(): Promise<void> {
    try {
      this.capturedPhoto.set(null);
      this.capturedBlob.set(null);
      this.isCameraActive.set(true);

      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElementRef && this.videoElementRef.nativeElement) {
        this.videoElementRef.nativeElement.srcObject = this.mediaStream;
        this.videoElementRef.nativeElement.setAttribute('playsinline', 'true');
        this.videoElementRef.nativeElement.play();
        this.videoElementRef.nativeElement.onplay = () => {
          this.scanFrame();
        };
      }
    } catch (err) {
      console.error('Camera open failed:', err);
      this.isCameraActive.set(false);
      alert('No se pudo acceder a la cámara. Compruebe los permisos o genere una foto simulada.');
    }
  }

  // Stop Camera WebRTC Stream
  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive.set(false);
  }

  scanFrame() {
    if (!this.isCameraActive() || !this.videoElementRef || !this.canvasElementRef) return;
    const video = this.videoElementRef.nativeElement;
    const canvas = this.canvasElementRef.nativeElement;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Found QR!
          this.handleQrCodeDecoded(code.data);
          return; // stop scanning loop for a moment
        }
      }
    }
    
    // Continue loop if camera is still active and no QR found
    if (this.isCameraActive()) {
      requestAnimationFrame(() => this.scanFrame());
    }
  }

  async handleQrCodeDecoded(token: string) {
    if (this.isApiLoading() || this.capturedBlob()) return; // prevent duplicate fires
    
    // Auto-select employee in the dropdown if matched (for UI consistency in simulation mode)
    const matchedEmp = this.employees().find(e => e.qrCodeToken === token);
    if (matchedEmp) {
      this.selectedEmployeeId.set(matchedEmp.id);
      this.scannedEmployee.set(matchedEmp);
    }
    
    // Take photo snapshot from current frame and stop camera
    this.takePhoto();
    
    // Artificially delay a bit for UX, then process the scan
    setTimeout(async () => {
      await this.processScan(token);
    }, 1500); // 1.5s delay to let the user see the overlay banner
  }

  // Takes photo of food tray from video element
  takePhoto(): void {
    if (!this.videoElementRef || !this.canvasElementRef) return;

    const video = this.videoElementRef.nativeElement;
    const canvas = this.canvasElementRef.nativeElement;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw frame
      ctx.drawImage(video, 0, 0, width, height);
      
      // Get base64 URL for visual feedback
      this.capturedPhoto.set(canvas.toDataURL('image/png'));

      // Get Blob for FormData payload
      canvas.toBlob((blob) => {
        if (blob) {
          this.capturedBlob.set(blob);
        }
      }, 'image/png');

      // Stop camera stream
      this.stopCamera();
    }
  }

  retakePhoto(): void {
    this.capturedPhoto.set(null);
    this.capturedBlob.set(null);
    this.startCamera();
  }

  // Simulated credential/badge image drawer on offscreen canvas
  generateSimulatedPhoto(): void {
    const canvas = this.canvasElementRef ? this.canvasElementRef.nativeElement : document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const empId = this.selectedEmployeeId();
      const emp = this.employees().find(e => e.id === empId);
      const firstName = emp?.firstName || 'Aldair';
      const lastName = emp?.lastName || 'Castillo Arenas';
      const position = emp?.position || 'Especialista';
      const dni = emp?.dni || '73024819';
      
      // 1. Draw elegant dark background representing a scanner feed background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 640, 480);
      
      // Draw grid lines on the background for high-tech look
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 640; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 480);
        ctx.stroke();
      }
      for (let j = 0; j < 480; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(640, j);
        ctx.stroke();
      }

      // Draw a circular radar overlay
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(320, 240, 220, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(320, 240, 120, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Draw vertical ID card badge centered
      const cardX = 200;
      const cardY = 30;
      const cardW = 240;
      const cardH = 400;
      const radius = 16;

      // Draw rounded card container path
      ctx.beginPath();
      ctx.moveTo(cardX + radius, cardY);
      ctx.lineTo(cardX + cardW - radius, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
      ctx.lineTo(cardX + cardW, cardY + cardH - radius);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
      ctx.lineTo(cardX + radius, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
      ctx.lineTo(cardX, cardY + radius);
      ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
      ctx.closePath();

      // Fill card with vertical steel-blue gradient
      const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
      cardGrad.addColorStop(0, '#1e293b');
      cardGrad.addColorStop(0.5, '#0f172a');
      cardGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = cardGrad;
      ctx.fill();

      // Stroke card border (glowing purple/indigo)
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 3. Card Header text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TALENT CONTROL', cardX + (cardW / 2), cardY + 25);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('CREDENCIAL DIGITAL', cardX + (cardW / 2), cardY + 36);

      // Thin separator line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + 45);
      ctx.lineTo(cardX + cardW - 20, cardY + 45);
      ctx.stroke();

      // 4. Draw profile avatar box
      const avX = cardX + 70;
      const avY = cardY + 60;
      const avW = 100;
      const avH = 110;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(avX, avY, avW, avH);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(avX, avY, avW, avH);

      // Draw vector head/shoulders placeholder inside avatar box
      ctx.fillStyle = '#475569';
      // Head
      ctx.beginPath();
      ctx.arc(avX + (avW / 2), avY + 40, 22, 0, Math.PI * 2);
      ctx.fill();
      // Shoulders
      ctx.beginPath();
      ctx.ellipse(avX + (avW / 2), avY + 95, 38, 25, 0, Math.PI, 0);
      ctx.fill();

      // 5. Draw Employee Info
      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(firstName, cardX + (cardW / 2), cardY + 195);
      ctx.fillText(lastName, cardX + (cardW / 2), cardY + 212);

      // Position
      ctx.fillStyle = '#93c5fd';
      ctx.font = '500 11px sans-serif';
      ctx.fillText(position.toUpperCase(), cardX + (cardW / 2), cardY + 232);

      // DNI
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`DNI: ${dni}`, cardX + (cardW / 2), cardY + 250);

      // 6. Draw Simulated QR Code
      const qrSize = 70;
      const qrX = cardX + 85;
      const qrY = cardY + 275;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);

      // Draw QR Finder Patterns (top-left, top-right, bottom-left)
      ctx.fillStyle = '#000000';
      const fpSize = 20;
      const drawFP = (x: number, y: number) => {
        ctx.fillRect(x, y, fpSize, fpSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 3, y + 3, fpSize - 6, fpSize - 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 6, fpSize - 12, fpSize - 12);
      };
      drawFP(qrX + 3, qrY + 3); // TL
      drawFP(qrX + qrSize - fpSize - 3, qrY + 3); // TR
      drawFP(qrX + 3, qrY + qrSize - fpSize - 3); // BL

      // Draw random pixels to simulate QR noise
      ctx.fillStyle = '#000000';
      const cellSize = 3;
      const cols = Math.floor(qrSize / cellSize);
      for (let r = 0; r < cols; r++) {
        for (let c = 0; c < cols; c++) {
          // Skip corners where finder patterns are drawn
          const isTL = (r < fpSize/cellSize + 2 && c < fpSize/cellSize + 2);
          const isTR = (r < fpSize/cellSize + 2 && c > cols - fpSize/cellSize - 3);
          const isBL = (r > cols - fpSize/cellSize - 3 && c < fpSize/cellSize + 2);
          if (isTL || isTR || isBL) continue;

          if (Math.random() > 0.5) {
            ctx.fillRect(qrX + (c * cellSize), qrY + (r * cellSize), cellSize, cellSize);
          }
        }
      }

      // Draw card validity / footers
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('ACCESO VÁLIDO', cardX + (cardW / 2), cardY + 375);

      // 7. Overlay scan details text at the bottom of the canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 440, 640, 40);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(` [DISPOSITIVO MÓVIL GUARDIA]`, 20, 464);
      
      ctx.textAlign = 'right';
      ctx.fillText(`GPS: LIMA, PE | ${new Date().toLocaleTimeString()} `, 620, 464);

      // Save outputs
      this.capturedPhoto.set(canvas.toDataURL('image/png'));
      canvas.toBlob((blob) => {
        if (blob) {
          this.capturedBlob.set(blob);
        }
      }, 'image/png');
    }
  }

  isSubmitDisabled(): boolean {
    if (!this.selectedEmployeeId() || this.isSimulating() || this.isApiLoading()) return true;
    if (this.activeMode() === 'asistencia') return !this.capturedBlob();
    return false; // For meals, photo is optional on check-out (handled by backend validator)
  }

  // Simulate scanning of QR code
  async simulateScan(): Promise<void> {
    const token = this.selectedEmployeeToken();
    const empId = this.selectedEmployeeId();
    if (!token || !empId) return;

    // Auto-generate photo if not present to make simulation seamless
    if (!this.capturedBlob()) {
      this.generateSimulatedPhoto();
    }

    this.isSimulating.set(true);
    
    // Artificial scanning delay
    setTimeout(async () => {
      await this.processScan(token);
      this.isSimulating.set(false);
    }, 1200);
  }

  // Core scan dispatcher based on active mode
  async processScan(token: string): Promise<void> {
    this.isApiLoading.set(true);
    
    const lat = this.currentLatitude();
    const lng = this.currentLongitude();

    if (this.activeMode() === 'asistencia') {
      // 1. Process QR Clock-in / Clock-out
      const photoBlob = this.capturedBlob();
      if (!photoBlob) {
        const errorLog: ScanLog = {
          time: new Date(),
          employeeName: 'Sistema',
          type: 'entrada',
          status: 'error',
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          message: 'Se requiere una fotografía de la credencial QR para registrar la asistencia.',
          success: false
        };
        this.lastScanResult.set(errorLog);
        this.isApiLoading.set(false);
        return;
      }

      try {
        const response = await this.attendanceService.qrClock(
          token,
          photoBlob,
          lat ?? undefined,
          lng ?? undefined
        );
        
        const photoPath = response.type === 'entrada' 
          ? response.attendance.photo_in_path 
          : response.attendance.photo_out_path;
        const backendBaseUrl = environment.apiUrl.replace('/api/v1', '');
        const photoUrl = photoPath ? `${backendBaseUrl}/${photoPath}` : undefined;

        const newLog: ScanLog = {
          time: new Date(),
          employeeName: response.employeeName,
          type: response.type,
          status: response.attendance.status ?? 'normal',
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          photoUrl: photoUrl,
          message: response.message,
          success: true
        };

        this.lastScanResult.set(newLog);
        this.sessionLogs.update(prev => [newLog, ...prev]);

        // Clean temporary photo states
        this.capturedPhoto.set(null);
        this.capturedBlob.set(null);

      } catch (err: any) {
        console.error('QR clocking error:', err);
        const errMsg = err.error?.error || err.error?.message || 'Error al registrar asistencia en el servidor.';
        
        const matchedEmp = this.employees().find(e => e.qrCodeToken === token);
        const nameStr = matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : 'Código QR Desconocido';

        const errorLog: ScanLog = {
          time: new Date(),
          employeeName: nameStr,
          type: 'entrada', // Default fallback
          status: 'error',
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          message: errMsg,
          success: false
        };

        this.lastScanResult.set(errorLog);
        this.sessionLogs.update(prev => [errorLog, ...prev]);

      } finally {
        this.isApiLoading.set(false);
        this.scannedEmployee.set(null);
      }

    } else {
      // 2. Process Refrigerio (Meal Registration)
      const photoBlob = this.capturedBlob();
      const type = this.mealType();

      try {
        const response = await this.mealService.registerMeal(
          token,
          type,
          photoBlob ?? null,
          lat ?? undefined,
          lng ?? undefined
        );

        // Get photo path url from backend (only if photo path was returned and action is 'inicio')
        const backendBaseUrl = environment.apiUrl.replace('/api/v1', '');
        const photoUrl = response.mealRecord.photo_path 
          ? `${backendBaseUrl}/${response.mealRecord.photo_path}` 
          : undefined;

        const newLog: ScanLog = {
          time: new Date(),
          employeeName: response.employeeName,
          type: response.mealType as any,
          status: response.action ?? 'inicio',
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          photoUrl: response.action === 'inicio' ? photoUrl : undefined,
          message: response.message,
          success: true
        };

        this.lastScanResult.set(newLog);
        this.sessionLogs.update(prev => [newLog, ...prev]);

        // Clean temporary photo states
        this.capturedPhoto.set(null);
        this.capturedBlob.set(null);

      } catch (err: any) {
        console.error('QR meal registration error:', err);
        const errMsg = err.error?.error || err.error?.message || 'Error al registrar refrigerio en el servidor.';
        
        const matchedEmp = this.employees().find(e => e.qrCodeToken === token);
        const nameStr = matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : 'Código QR Desconocido';

        const errorLog: ScanLog = {
          time: new Date(),
          employeeName: nameStr,
          type: type,
          status: 'error',
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          message: errMsg,
          success: false
        };

        this.lastScanResult.set(errorLog);
        this.sessionLogs.update(prev => [errorLog, ...prev]);

      } finally {
        this.isApiLoading.set(false);
        this.scannedEmployee.set(null);
      }
    }
  }

  clearLogs(): void {
    this.sessionLogs.set([]);
    this.lastScanResult.set(null);
  }
}
