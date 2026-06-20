import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealService } from '../../../shared/services/meal.service';
import { EmployeeService } from '../../../shared/services/employee.service';
import { Employee } from '../../../shared/models/hr.models';
import { environment } from '../../../../environments/environment';

interface MealLog {
  time: Date;
  employeeName: string;
  mealType: 'desayuno' | 'almuerzo' | 'cena';
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  message: string;
  success: boolean;
}

@Component({
  selector: 'app-meal-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hr-scanner-container">
      <!-- Header -->
      <div class="hr-scanner-header">
        <div class="hr-badge-guard">MÓDULO ALIMENTACIÓN</div>
        <h1 class="hr-scanner-title">Registro de Comidas con QR y Foto</h1>
        <p class="hr-scanner-desc">
          Registra el desayuno, almuerzo o cena de los colaboradores. Escanea el código QR, toma una foto de la bandeja de alimentos y captura la ubicación.
        </p>
      </div>

      <!-- Main Layout Grid -->
      <div class="hr-scanner-grid">
        
        <!-- Left Column: Camera Scanner & Controls -->
        <div class="hr-scanner-left">
          
          <!-- Ración Selector -->
          <div class="hr-glass-card hr-meal-selector-card">
            <div class="hr-card-title-container">
              <span class="hr-title-dot yellow"></span>
              <h3>Selección de Ración</h3>
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

          <!-- Camera / Capture Card -->
          <div class="hr-glass-card hr-main-scanner-card">
            <div class="hr-card-glow" [class.desayuno]="mealType() === 'desayuno'" [class.almuerzo]="mealType() === 'almuerzo'" [class.cena]="mealType() === 'cena'"></div>
            
            <div class="hr-scanner-viewfinder">
              <!-- Video stream -->
              <video #videoElement [class.active]="isCameraActive() && !capturedPhoto()" autoplay playsinline class="hr-video-preview"></video>
              
              <!-- Captured photo preview -->
              <img *ngIf="capturedPhoto()" [src]="capturedPhoto()" class="hr-photo-preview" alt="Foto capturada"/>
              
              <!-- Offscreen Canvas for Snapshot Capture -->
              <canvas #canvasElement style="display: none;"></canvas>

              <!-- Video Off Placeholder -->
              <div *ngIf="!isCameraActive() && !capturedPhoto()" class="hr-scanner-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="hr-camera-icon">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <p class="hr-placeholder-txt">Cámara Apagada</p>
                <span class="hr-placeholder-sub">Activa la cámara del dispositivo para capturar la bandeja de alimentos</span>
              </div>
            </div>

            <!-- Camera Actions -->
            <div class="hr-scanner-actions">
              <!-- Turn camera on -->
              <button *ngIf="!isCameraActive() && !capturedPhoto()" class="hr-btn-premium hr-btn-cyan" (click)="startCamera()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z"/>
                </svg>
                Iniciar Cámara
              </button>

              <!-- Capture Photo -->
              <button *ngIf="isCameraActive() && !capturedPhoto()" class="hr-btn-premium hr-btn-orange" (click)="takePhoto()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Capturar Foto
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

          <!-- Simulator Card (Local Dev QR Scan Simulation) -->
          <div class="hr-glass-card hr-simulator-card">
            <div class="hr-card-title-container">
              <span class="hr-title-dot purple"></span>
              <h3>Simulación de Escaneo QR (Local)</h3>
            </div>
            
            <p class="hr-card-info">
              Selecciona un colaborador para simular el escaneo de su código QR y registrar la ración de alimentos.
            </p>

            <div class="hr-form-group">
              <label for="employeeSelect">Colaborador:</label>
              <select id="employeeSelect" class="hr-custom-select" [(ngModel)]="selectedEmployeeId" (change)="onEmployeeSelected()">
                <option value="">Selecciona un colaborador...</option>
                <option *ngFor="let emp of employees()" [value]="emp.id">
                  {{ emp.firstName }} {{ emp.lastName }} ({{ emp.position }})
                </option>
              </select>
            </div>

            <!-- Auto simulated photo button (in case webcam is not available or local testing) -->
            <div class="hr-form-group" *ngIf="!capturedPhoto()">
              <button class="hr-btn-premium hr-btn-outline w-full" (click)="generateSimulatedPhoto()">
                <span class="icon">🖼️</span> Generar Foto Simulada (Bandeja Comida)
              </button>
            </div>

            <div *ngIf="selectedEmployeeToken()" class="hr-token-badge">
              <span class="label">Token QR:</span>
              <span class="value">{{ selectedEmployeeToken() }}</span>
            </div>

            <!-- Submit meal registration button -->
            <button class="hr-btn-premium hr-btn-purple w-full mt-4" 
                    [disabled]="!selectedEmployeeId() || !capturedBlob() || isApiLoading()" 
                    (click)="submitMealRecord()">
              <span *ngIf="!isApiLoading()">Registrar Alimentación</span>
              <span *ngIf="isApiLoading()">Procesando Registro...</span>
            </button>
          </div>

        </div>

        <!-- Right Column: Location & Results Feed -->
        <div class="hr-scanner-right">
          
          <!-- GPS Status Card -->
          <div class="hr-glass-card hr-location-card">
            <div class="hr-card-title-container">
              <span class="hr-title-dot" [class.green]="gpsStatus() === 'success'" [class.yellow]="gpsStatus() === 'loading'" [class.red]="gpsStatus() === 'error'"></span>
              <h3>Ubicación Satelital (GPS)</h3>
            </div>

            <div class="hr-location-details" [class.error]="gpsStatus() === 'error'" [class.success]="gpsStatus() === 'success'">
              <div *ngIf="gpsStatus() === 'loading'" class="hr-gps-loading">
                <div class="hr-spinner-small"></div>
                <span>Adquiriendo coordenadas de ubicación...</span>
              </div>

              <div *ngIf="gpsStatus() === 'error'" class="hr-gps-error">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14v.01M12 8v5"/>
                </svg>
                <div class="msg-box">
                  <strong>Ubicación GPS no disponible</strong>
                  <p>Por favor otorga permisos de geolocalización al navegador.</p>
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
                  <span class="coord-lbl">Precisión</span>
                  <span class="coord-val">± {{ gpsAccuracy() }} metros</span>
                </div>
              </div>
            </div>

            <button class="hr-btn-premium hr-btn-outline w-full" (click)="requestLocation()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              Actualizar Coordenadas
            </button>
          </div>

          <!-- Last Registered Meal Result -->
          <div *ngIf="lastMealResult()" class="hr-glass-card hr-result-display-card" [class.success]="lastMealResult()?.success" [class.error]="!lastMealResult()?.success">
            <div class="hr-result-pulse-ring"></div>
            
            <div class="hr-result-header">
              <span class="hr-result-type-badge" [class.desayuno]="lastMealResult()?.mealType === 'desayuno'" [class.almuerzo]="lastMealResult()?.mealType === 'almuerzo'" [class.cena]="lastMealResult()?.mealType === 'cena'" [class.error]="!lastMealResult()?.success">
                {{ lastMealResult()?.success ? (lastMealResult()?.mealType | uppercase) : 'ERROR AL REGISTRAR' }}
              </span>
              <span class="hr-result-time">{{ lastMealResult()?.time | date:'HH:mm:ss' }}</span>
            </div>

            <h2 class="hr-result-name">{{ lastMealResult()?.employeeName }}</h2>
            <p class="hr-result-msg">{{ lastMealResult()?.message }}</p>

            <!-- Server uploaded photo preview -->
            <div *ngIf="lastMealResult()?.photoUrl" class="hr-server-photo-container">
              <span class="lbl">Foto del Plato en Servidor:</span>
              <img [src]="lastMealResult()?.photoUrl" class="hr-server-photo" alt="Foto plato guardado"/>
            </div>

            <div class="hr-result-footer">
              <span class="coords" *ngIf="lastMealResult()?.latitude">GPS: {{ lastMealResult()?.latitude | number:'1.4-4' }}, {{ lastMealResult()?.longitude | number:'1.4-4' }}</span>
              <span class="status-badge">EXITOSO</span>
            </div>
          </div>

          <!-- History Feed -->
          <div class="hr-glass-card hr-history-card">
            <div class="hr-card-title-container" style="justify-content: space-between;">
              <div class="hr-hstack">
                <span class="hr-title-dot purple"></span>
                <h3>Historial de Alimentos Registrados</h3>
              </div>
              <button *ngIf="sessionLogs().length > 0" class="hr-btn-clear" (click)="clearLogs()">Limpiar</button>
            </div>

            <div class="hr-history-list" [class.empty]="sessionLogs().length === 0">
              <div *ngIf="sessionLogs().length === 0" class="hr-empty-history">
                <p>No hay raciones registradas en esta sesión.</p>
              </div>

              <div *ngFor="let log of sessionLogs()" class="hr-history-item" [class.success]="log.success" [class.error]="!log.success">
                <img *ngIf="log.photoUrl" [src]="log.photoUrl" class="hr-hist-thumb" alt="Miniatura"/>
                
                <div class="hr-hist-body">
                  <div class="hr-hist-name">{{ log.employeeName }}</div>
                  <div class="hr-hist-desc">{{ log.message }}</div>
                </div>
                
                <span class="hr-hist-badge" [class.desayuno]="log.mealType === 'desayuno'" [class.almuerzo]="log.mealType === 'almuerzo'" [class.cena]="log.mealType === 'cena'" [class.err]="!log.success">
                  {{ log.success ? (log.mealType | titlecase) : 'Error' }}
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
      color: #e2e8f0;
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
      max-width: 1200px;
      margin: 0 auto;
    }

    .hr-scanner-header {
      margin-bottom: 28px;
    }

    .hr-badge-guard {
      display: inline-block;
      padding: 4px 10px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #fff;
      margin-bottom: 12px;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
    }

    .hr-scanner-title {
      font-size: 28px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.5px;
      margin: 0 0 8px 0;
    }

    .hr-scanner-desc {
      color: #94a3b8;
      font-size: 15px;
      max-width: 700px;
      line-height: 1.5;
      margin: 0;
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
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hr-glass-card:hover {
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
    }

    .hr-card-glow {
      position: absolute;
      top: 0;
      left: 20%;
      right: 20%;
      height: 1px;
      transition: background 0.3s;
    }

    .hr-card-glow.desayuno {
      background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent);
    }
    .hr-card-glow.almuerzo {
      background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent);
    }
    .hr-card-glow.cena {
      background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
    }

    /* Meal Buttons Styling */
    .hr-meal-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 8px;
    }

    .hr-meal-btn {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px 8px;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hr-meal-btn .icon {
      font-size: 24px;
    }

    .hr-meal-btn .lbl {
      font-size: 14px;
      font-weight: 700;
    }

    .hr-meal-btn .time-range {
      font-size: 10px;
      opacity: 0.7;
    }

    /* Active states */
    .hr-meal-btn.desayuno.active {
      background: rgba(245, 158, 11, 0.15);
      border-color: #f59e0b;
      color: #fbbf24;
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.25);
    }

    .hr-meal-btn.almuerzo.active {
      background: rgba(6, 182, 212, 0.15);
      border-color: #06b6d4;
      color: #22d3ee;
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
    }

    .hr-meal-btn.cena.active {
      background: rgba(168, 85, 247, 0.15);
      border-color: #a855f7;
      color: #c084fc;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.25);
    }

    /* Camera Viewfinder */
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
      border: 1px solid rgba(255, 255, 255, 0.1);
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

    .hr-scanner-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px;
      color: #64748b;
    }

    .hr-camera-icon {
      color: #334155;
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
      color: #94a3b8;
      margin: 0 0 6px 0;
    }

    .hr-placeholder-sub {
      font-size: 12px;
      color: #64748b;
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

    .w-full {
      width: 100%;
    }

    .mt-4 {
      margin-top: 16px;
    }

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

    .hr-btn-outline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }

    .hr-btn-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
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
    }

    .hr-title-dot.yellow { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
    .hr-title-dot.purple { background: #a855f7; box-shadow: 0 0 10px #a855f7; }
    .hr-title-dot.green { background: #10b981; box-shadow: 0 0 10px #10b981; }
    .hr-title-dot.red { background: #ef4444; box-shadow: 0 0 10px #ef4444; }

    .hr-simulator-card h3, .hr-meal-selector-card h3, .hr-location-card h3, .hr-history-card h3 {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .hr-card-info {
      font-size: 13.5px;
      color: #94a3b8;
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
      color: #cbd5e1;
    }

    .hr-custom-select {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #e2e8f0;
      padding: 10px 14px;
      font-size: 14px;
      outline: none;
      width: 100%;
    }

    .hr-custom-select:focus {
      border-color: #a855f7;
    }

    .hr-token-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(168, 85, 247, 0.08);
      border: 1px dashed rgba(168, 85, 247, 0.25);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .hr-token-badge .label {
      color: #a855f7;
      font-weight: 600;
    }

    .hr-token-badge .value {
      font-family: monospace;
      color: #e2e8f0;
      font-weight: bold;
    }

    /* GPS Location Details */
    .hr-location-details {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 18px;
      border: 1px solid rgba(255, 255, 255, 0.04);
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

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hr-gps-error {
      display: flex;
      gap: 12px;
      color: #ef4444;
    }

    .hr-gps-error .msg-box {
      flex: 1;
    }

    .hr-gps-error strong {
      font-size: 14px;
      display: block;
      margin-bottom: 4px;
    }

    .hr-gps-error p {
      font-size: 12.5px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }

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
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 8px;
      margin-top: 4px;
    }

    .coord-lbl {
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .coord-val {
      font-size: 14px;
      font-family: monospace;
      color: #f1f5f9;
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
      border-color: rgba(16, 185, 129, 0.4);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%);
    }

    .hr-result-display-card.error {
      border-color: rgba(239, 68, 68, 0.4);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%);
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
      padding: 4px 8px;
      border-radius: 4px;
      color: white;
    }

    .hr-result-type-badge.desayuno {
      background: #d97706;
    }

    .hr-result-type-badge.almuerzo {
      background: #0891b2;
    }

    .hr-result-type-badge.cena {
      background: #7e22ce;
    }

    .hr-result-type-badge.error {
      background: #b91c1c;
    }

    .hr-result-time {
      font-size: 12px;
      font-family: monospace;
      color: #94a3b8;
    }

    .hr-result-name {
      font-size: 22px;
      font-weight: 800;
      color: #f8fafc;
      margin: 0 0 6px 0;
      position: relative;
      z-index: 2;
    }

    .hr-result-msg {
      font-size: 14.5px;
      color: #cbd5e1;
      line-height: 1.4;
      margin: 0 0 16px 0;
      position: relative;
      z-index: 2;
    }

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
      color: #64748b;
      margin-bottom: 6px;
    }

    .hr-server-photo {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .hr-result-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 12px;
      position: relative;
      z-index: 2;
    }

    .hr-result-footer .status-badge {
      font-weight: 700;
      color: #10b981;
    }

    /* History Session Log */
    .hr-btn-clear {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }

    .hr-btn-clear:hover {
      color: #f8fafc;
    }

    .hr-history-list {
      max-height: 300px;
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
      color: #475569;
    }

    .hr-history-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 23, 42, 0.3);
      border-radius: 8px;
      padding: 10px 12px;
      border-left: 3px solid #64748b;
      transition: transform 0.2s;
    }

    .hr-history-item:hover {
      transform: translateX(2px);
    }

    .hr-history-item.success {
      border-left-color: #10b981;
    }

    .hr-history-item.error {
      border-left-color: #ef4444;
    }

    .hr-hist-thumb {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 6px;
      background: #0f172a;
    }

    .hr-hist-body {
      flex: 1;
      min-width: 0;
    }

    .hr-hist-name {
      font-size: 13.5px;
      font-weight: 700;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hr-hist-desc {
      font-size: 11.5px;
      color: #64748b;
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

    .hr-hist-badge.desayuno { background: #d97706; }
    .hr-hist-badge.almuerzo { background: #0891b2; }
    .hr-hist-badge.cena { background: #7e22ce; }
    .hr-hist-badge.err { background: #b91c1c; }

    .hr-hstack {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class MealScannerComponent implements OnInit, OnDestroy {
  private readonly mealService = inject(MealService);
  private readonly employeeService = inject(EmployeeService);

  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElementRef!: ElementRef<HTMLCanvasElement>;

  // State Signals
  readonly employees = signal<Employee[]>([]);
  readonly selectedEmployeeId = signal<string>('');
  readonly mealType = signal<'desayuno' | 'almuerzo' | 'cena'>('almuerzo');
  
  readonly isCameraActive = signal<boolean>(false);
  readonly capturedPhoto = signal<string | null>(null);
  readonly capturedBlob = signal<Blob | null>(null);
  readonly isApiLoading = signal<boolean>(false);

  // GPS Coordinates
  readonly gpsStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly currentLatitude = signal<number | null>(null);
  readonly currentLongitude = signal<number | null>(null);
  readonly gpsAccuracy = signal<number>(0);

  // Results
  readonly lastMealResult = signal<MealLog | null>(null);
  readonly sessionLogs = signal<MealLog[]>([]);

  private mediaStream: MediaStream | null = null;

  // Selected Employee QR token details
  readonly selectedEmployeeToken = computed(() => {
    const empId = this.selectedEmployeeId();
    if (!empId) return '';
    const emp = this.employees().find(e => e.id === empId);
    return emp?.qrCodeToken ?? '';
  });

  async ngOnInit(): Promise<void> {
    // 1. Auto-select meal type based on hour
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      this.mealType.set('desayuno');
    } else if (hour >= 11 && hour < 16) {
      this.mealType.set('almuerzo');
    } else {
      this.mealType.set('cena');
    }

    // 2. Request GPS Location coordinates
    this.requestLocation();

    // 3. Load active employees list for testing dropdown
    await this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setMealType(type: 'desayuno' | 'almuerzo' | 'cena'): void {
    this.mealType.set(type);
  }

  onEmployeeSelected(): void {
    // Keep photo but clear result states if needed
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

  // Geolocation
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
        this.gpsAccuracy.set(15);
        this.gpsStatus.set('success');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // WebRTC Camera Management
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
      }
    } catch (err) {
      console.error('Camera open failed:', err);
      this.isCameraActive.set(false);
      alert('No se pudo acceder a la cámara. Compruebe los permisos o genere una foto simulada.');
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive.set(false);
  }

  // Takes a snapshot from the WebRTC video element
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
      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, width, height);
      
      // Convert to Base64 dataUrl for UI preview
      const dataUrl = canvas.toDataURL('image/png');
      this.capturedPhoto.set(dataUrl);

      // Convert to Blob for upload
      canvas.toBlob((blob) => {
        if (blob) {
          this.capturedBlob.set(blob);
        }
      }, 'image/png');

      // Stop camera stream now that we have captured
      this.stopCamera();
    }
  }

  retakePhoto(): void {
    this.capturedPhoto.set(null);
    this.capturedBlob.set(null);
    this.startCamera();
  }

  // Generates a mock canvas-based image for testing when no camera is present
  generateSimulatedPhoto(): void {
    const canvas = this.canvasElementRef ? this.canvasElementRef.nativeElement : document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 1. Draw elegant dark background gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // 2. Draw border representing food tray
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 580, 420);

      // 3. Draw plate circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(320, 240, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      // 4. Draw dining details text
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BANDEJA DE COMIDA SIMULADA', 320, 100);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Ración: ${this.mealType().toUpperCase()}`, 320, 220);
      
      const empId = this.selectedEmployeeId();
      const emp = this.employees().find(e => e.id === empId);
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'DEMO COLABORADOR';
      ctx.fillText(`Colaborador: ${empName}`, 320, 260);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px monospace';
      ctx.fillText(`Fecha: ${new Date().toLocaleDateString()} | GPS: Lima, PE`, 320, 380);

      // 5. Save simulated outputs
      const dataUrl = canvas.toDataURL('image/png');
      this.capturedPhoto.set(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          this.capturedBlob.set(blob);
        }
      }, 'image/png');
    }
  }

  // API Submission
  async submitMealRecord(): Promise<void> {
    const token = this.selectedEmployeeToken();
    const photoBlob = this.capturedBlob();
    const type = this.mealType();
    
    if (!token || !photoBlob) {
      alert('Faltan datos obligatorios. Selecciona un colaborador y toma una foto de la ración.');
      return;
    }

    this.isApiLoading.set(true);

    const lat = this.currentLatitude();
    const lng = this.currentLongitude();

    try {
      const response = await this.mealService.registerMeal(
        token,
        type,
        photoBlob,
        lat ?? undefined,
        lng ?? undefined
      );

      // Strip /api/v1 to get backend base url for uploads
      const backendBaseUrl = environment.apiUrl.replace('/api/v1', '');
      const photoUrl = `${backendBaseUrl}/${response.mealRecord.photo_path}`;

      const newLog: MealLog = {
        time: new Date(),
        employeeName: response.employeeName,
        mealType: response.mealType as any,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        photoUrl: photoUrl,
        message: response.message,
        success: true
      };

      this.lastMealResult.set(newLog);
      this.sessionLogs.update(prev => [newLog, ...prev]);

      // Reset photo state for next employee scan
      this.capturedPhoto.set(null);
      this.capturedBlob.set(null);

    } catch (err: any) {
      console.error('Error submitting meal record:', err);
      const errMsg = err.error?.error || err.error?.message || 'Error de conexión con el backend.';
      
      const emp = this.employees().find(e => e.id === this.selectedEmployeeId());
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Código QR Desconocido';

      const errorLog: MealLog = {
        time: new Date(),
        employeeName: empName,
        mealType: type,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        message: errMsg,
        success: false
      };

      this.lastMealResult.set(errorLog);
      this.sessionLogs.update(prev => [errorLog, ...prev]);

    } finally {
      this.isApiLoading.set(false);
    }
  }

  clearLogs(): void {
    this.sessionLogs.set([]);
    this.lastMealResult.set(null);
  }
}
