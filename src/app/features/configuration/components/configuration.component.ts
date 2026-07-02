import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService, CompanyConfig } from '../../../shared/services/configuration.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserService, UserDto } from '../../../shared/services/user.service';
import { ServiceTypeService, ServiceDto } from '../../../shared/services/service-type.service';
import { LocationService, LocationDto } from '../../../shared/services/location.service';
import { ScheduleService, ScheduleDto } from '../../../shared/services/schedule.service';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hr-page-header" style="margin-bottom: 20px;">
      <div>
        <h1 class="hr-page-title">Configuración del Sistema</h1>
        <p class="hr-page-sub">Administra la información de tu empresa, roles y permisos de acceso.</p>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="hr-tabs">
      <button class="hr-tab" [class.active]="activeTab() === 'empresa'" (click)="setTab('empresa')">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          🏢 Datos de la Empresa
        </span>
      </button>
      <button class="hr-tab" [class.active]="activeTab() === 'roles'" (click)="setTab('roles')">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          🔑 Roles y Permisos
        </span>
      </button>
      <button class="hr-tab" [class.active]="activeTab() === 'usuarios'" (click)="setTab('usuarios')">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          👥 Usuarios
        </span>
      </button>
      <button class="hr-tab" [class.active]="activeTab() === 'servicios'" (click)="setTab('servicios')">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          🛡️ Servicios
        </span>
      </button>
      <button class="hr-tab" [class.active]="activeTab() === 'sedes'" (click)="setTab('sedes')">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          📍 Sedes
        </span>
      </button>
      <button class="hr-tab" [class.active]="activeTab() === 'horarios'" (click)="setTab('horarios')">
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          ⏰ Horarios
        </span>
      </button>
    </div>

    <!-- Error/Success Alerts -->
    <div *ngIf="successMessage()" class="hr-card success-banner" style="margin-bottom: 20px; padding: 12px; display: flex; align-items: center; gap: 8px;">
      <span class="icon">✅</span>
      <span style="font-weight: 500; font-size: 13.5px;">{{ successMessage() }}</span>
    </div>

    <div *ngIf="errorMessage()" class="hr-card danger-banner" style="margin-bottom: 20px; padding: 12px; display: flex; align-items: center; gap: 8px;">
      <span class="icon">⚠️</span>
      <span style="font-weight: 500; font-size: 13.5px;">{{ errorMessage() }}</span>
    </div>

    <!-- LOADING STATE -->
    <div *ngIf="loadingData()" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 250px; gap: 12px;">
      <div class="hr-spinner"></div>
      <span style="color: var(--text-soft); font-weight: 500;">Cargando configuraciones...</span>
    </div>

    <!-- TAB 1: DATOS DE LA EMPRESA -->
    <div *ngIf="!loadingData() && activeTab() === 'empresa'" class="hr-card" style="padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text);">Perfil Corporativo</h3>
      <p style="color: var(--text-soft); font-size: 13px; margin-bottom: 20px;">Edita la información legal y de contacto que aparecerá en tus contratos y reportes.</p>

      <form (ngSubmit)="saveCompany()" #companyForm="ngForm">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px;">
          <div class="hr-field" style="display: flex; flex-direction: column;">
            <label for="name">Razón Social <span class="req">*</span></label>
            <input id="name" name="name" type="text" [(ngModel)]="company.name" required placeholder="Nombre de la empresa" />
          </div>

          <div class="hr-field" style="display: flex; flex-direction: column;">
            <label for="ruc">RUC <span class="req">*</span></label>
            <input id="ruc" name="ruc" type="text" [(ngModel)]="company.ruc" required maxlength="11" minlength="11" pattern="[0-9]*" placeholder="RUC de 11 dígitos" />
          </div>
        </div>

        <div class="hr-field" style="display: flex; flex-direction: column; margin-bottom: 18px;">
          <label for="address">Dirección Fiscal</label>
          <input id="address" name="address" type="text" [(ngModel)]="company.address" placeholder="Av. Principal 123, San Isidro, Lima" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <div class="hr-field" style="display: flex; flex-direction: column;">
            <label for="phone">Teléfono de Contacto</label>
            <input id="phone" name="phone" type="text" [(ngModel)]="company.phone" placeholder="+51 999 888 777" />
          </div>

          <div class="hr-field" style="display: flex; flex-direction: column;">
            <label for="email">Correo Electrónico</label>
            <input id="email" name="email" type="email" [(ngModel)]="company.email" placeholder="contacto@empresa.pe" />
          </div>
        </div>

        <div class="hr-hstack" style="justify-content: flex-end;">
          <button type="submit" class="hr-btn hr-btn-accent" [disabled]="saving() || !companyForm.valid">
            {{ saving() ? 'Guardando...' : 'Guardar Información' }}
          </button>
        </div>
      </form>
    </div>

    <!-- TAB 2: ROLES Y PERMISOS -->
    <div *ngIf="!loadingData() && activeTab() === 'roles'">
      <div class="hr-card" style="padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text);">Matriz de Permisos</h3>
        <p style="color: var(--text-soft); font-size: 13px; margin-bottom: 20px;">Define las facultades de acceso a los diferentes módulos de acuerdo al rol asignado a cada cuenta.</p>

        <!-- ADMIN ROLE SECTION -->
        <div style="border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 16px; font-weight: 700; color: var(--text);">Administrador (ADMIN)</span>
            <span class="hr-badge success no-dot" style="font-size: 10px;">Acceso Total</span>
          </div>
          <p style="color: var(--text-soft); font-size: 12.5px; margin-bottom: 16px;">
            Este rol tiene acceso total de lectura, escritura y configuración sobre todos los recursos corporativos y de asistencia.
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
            <label *ngFor="let perm of permissionKeys" class="perm-card">
              <input type="checkbox" [(ngModel)]="rolesPermissions.ADMIN[perm]" />
              <div class="perm-body">
                <span class="lbl">{{ getPermissionLabel(perm) }}</span>
                <span class="desc">{{ getPermissionDesc(perm) }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- GUARDIA ROLE SECTION -->
        <div style="border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 16px; font-weight: 700; color: var(--text);">Guardia de Seguridad (GUARDIA)</span>
            <span class="hr-badge info no-dot" style="font-size: 10px;">Operativo</span>
          </div>
          <p style="color: var(--text-soft); font-size: 12.5px; margin-bottom: 16px;">
            Este rol se encarga de operar el Punto de Control QR y Comedor para registrar la entrada/salida y refrigerios de los colaboradores.
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
            <label *ngFor="let perm of permissionKeys" class="perm-card">
              <input type="checkbox" [(ngModel)]="rolesPermissions.GUARDIA[perm]" />
              <div class="perm-body">
                <span class="lbl">{{ getPermissionLabel(perm) }}</span>
                <span class="desc">{{ getPermissionDesc(perm) }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- USER/COLABORADOR ROLE SECTION -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 16px; font-weight: 700; color: var(--text);">Colaborador (USER)</span>
            <span class="hr-badge neutral no-dot" style="font-size: 10px;">Básico</span>
          </div>
          <p style="color: var(--text-soft); font-size: 12.5px; margin-bottom: 16px;">
            Este rol corresponde a los empleados generales del sistema, quienes acceden solo a verificar su información personal.
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
            <label *ngFor="let perm of permissionKeys" class="perm-card">
              <input type="checkbox" [(ngModel)]="rolesPermissions.USER[perm]" />
              <div class="perm-body">
                <span class="lbl">{{ getPermissionLabel(perm) }}</span>
                <span class="desc">{{ getPermissionDesc(perm) }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="hr-hstack" style="justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 20px;">
          <button class="hr-btn hr-btn-accent" [disabled]="saving()" (click)="savePermissions()">
            {{ saving() ? 'Guardando...' : 'Aplicar Roles y Permisos' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 3: GESTIÓN DE USUARIOS -->
    <div *ngIf="!loadingData() && activeTab() === 'usuarios'">
      <div class="hr-card" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text);">Usuarios del Sistema</h3>
            <p style="color: var(--text-soft); font-size: 13px; margin: 4px 0 0 0;">Cuentas de usuario que tienen credenciales de acceso al sistema.</p>
          </div>
          <button class="hr-btn hr-btn-accent" (click)="openAddUserModal()">
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span>+</span> Agregar Usuario
            </span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="hr-search-input" style="max-width: 320px; margin-bottom: 20px; border-color: var(--border-strong);">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
          </span>
          <input placeholder="Buscar usuario..." [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)"/>
        </div>

        <!-- Loading Users state -->
        <div *ngIf="loadingUsers()" style="display: flex; justify-content: center; align-items: center; height: 120px;">
          <div class="hr-spinner" style="width: 30px; height: 30px; border-width: 3px;"></div>
        </div>

        <!-- Users Table -->
        <div *ngIf="!loadingUsers()" class="hr-table-wrapper" style="overflow-x: auto; border: 1px solid var(--border); border-radius: 8px;">
          <table class="hr-tbl">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Creado el</th>
                <th style="width: 100px; text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of getFilteredUsers()">
                <td>
                  <div class="hr-row-emp">
                    <span class="hr-emp-avatar" style="background: var(--accent); color: var(--accent-contrast); font-weight: 600;">
                      {{ getUserInitials(u.name) }}
                    </span>
                    <div>
                      <div class="hr-emp-name" style="font-weight: 600; color: var(--text);">{{ u.name }}</div>
                      <div class="hr-emp-id" style="color: var(--text-soft); font-size: 11.5px;">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="hr-badge no-dot" [class]="getRoleBadgeClass(u.role)">
                    {{ getRoleLabel(u.role) }}
                  </span>
                </td>
                <td class="hr-mono" style="font-size: 12.5px;">
                  {{ u.created_at ? (u.created_at | date: 'dd/MM/yyyy HH:mm') : '—' }}
                </td>
                <td class="action-cell" style="text-align: right; white-space: nowrap;">
                  <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="openEditUserModal(u)" title="Editar usuario" style="margin-right: 4px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button class="hr-btn hr-btn-ghost hr-btn-icon danger-text" (click)="deleteUser(u)" title="Eliminar usuario">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="getFilteredUsers().length === 0">
                <td colspan="4" style="text-align: center; color: var(--text-soft); padding: 32px;">
                  No se encontraron usuarios.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- USER MODAL (ADD / EDIT) -->
    <div *ngIf="showUserModal()" class="modal-overlay" (click)="closeUserModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingUser() ? 'Editar Usuario' : 'Agregar Nuevo Usuario' }}</h3>
          <button class="close-btn" (click)="closeUserModal()">&times;</button>
        </div>
        
        <div *ngIf="errorModalMessage()" class="hr-card danger-banner" style="margin-bottom: 16px; padding: 10px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12.5px;">⚠️ {{ errorModalMessage() }}</span>
        </div>

        <form (ngSubmit)="saveUser()" #userForm="ngForm">
          <div class="modal-body">
            <div class="hr-field">
              <label for="userName">Nombre Completo <span class="req">*</span></label>
              <input id="userName" name="name" type="text" [(ngModel)]="userModel.name" required placeholder="Ej. Carlos Mendoza" />
            </div>
            
            <div class="hr-field" style="margin-top: 14px;">
              <label for="userEmail">Correo Electrónico <span class="req">*</span></label>
              <input id="userEmail" name="email" type="email" [(ngModel)]="userModel.email" required placeholder="Ej. cmendoza@empresa.pe" />
            </div>

            <div class="hr-field" style="margin-top: 14px;">
              <label for="userRole">Rol <span class="req">*</span></label>
              <select id="userRole" name="role" [(ngModel)]="userModel.role" required style="width: 100%; height: 38px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text);">
                <option value="admin">Administrador (ADMIN)</option>
                <option value="guardia">Guardia de Seguridad (GUARDIA)</option>
                <option value="user">Colaborador (USER)</option>
              </select>
            </div>

            <div class="hr-field" style="margin-top: 14px;">
              <label for="userPassword">
                Contraseña 
                <span class="req" *ngIf="!editingUser()">*</span>
                <span style="font-size: 11px; color: var(--text-soft);" *ngIf="editingUser()"> (Dejar en blanco para no cambiar)</span>
              </label>
              <input id="userPassword" name="password" type="password" [(ngModel)]="userModel.password" [required]="!editingUser()" placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <div class="modal-footer hr-hstack" style="justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
            <button type="button" class="hr-btn hr-btn-ghost" (click)="closeUserModal()">Cancelar</button>
            <button type="submit" class="hr-btn hr-btn-accent" [disabled]="savingUser() || !userForm.valid">
              {{ savingUser() ? 'Guardando...' : 'Guardar Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB 4: SERVICIOS -->
    <div *ngIf="!loadingData() && activeTab() === 'servicios'">
      <div class="hr-card" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text);">Tipos de Servicio</h3>
            <p style="color: var(--text-soft); font-size: 13px; margin: 4px 0 0 0;">Configura los tipos de servicios de seguridad privada ofrecidos por la empresa.</p>
          </div>
          <button class="hr-btn hr-btn-accent" (click)="openAddServiceModal()">
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span>+</span> Agregar Servicio
            </span>
          </button>
        </div>

        <div class="hr-search-input" style="max-width: 320px; margin-bottom: 20px; border-color: var(--border-strong);">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
          </span>
          <input placeholder="Buscar servicio..." [ngModel]="searchTermServices()" (ngModelChange)="searchTermServices.set($event)"/>
        </div>

        <div *ngIf="loadingServices()" style="display: flex; justify-content: center; align-items: center; height: 120px;">
          <div class="hr-spinner" style="width: 30px; height: 30px; border-width: 3px;"></div>
        </div>

        <div *ngIf="!loadingServices()" class="hr-table-wrapper" style="overflow-x: auto; border: 1px solid var(--border); border-radius: 8px;">
          <table class="hr-tbl">
            <thead>
              <tr>
                <th>Nombre del Servicio</th>
                <th>Descripción</th>
                <th style="width: 100px; text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of getFilteredServices()">
                <td style="font-weight: 600; color: var(--text);">{{ s.name }}</td>
                <td style="color: var(--text-soft); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ s.description || 'Sin descripción' }}</td>
                <td class="action-cell" style="text-align: right; white-space: nowrap;">
                  <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="openEditServiceModal(s)" title="Editar" style="margin-right: 4px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button class="hr-btn hr-btn-ghost hr-btn-icon danger-text" (click)="deleteService(s)" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="getFilteredServices().length === 0">
                <td colspan="3" style="text-align: center; color: var(--text-soft); padding: 32px;">No se encontraron servicios.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: SEDES -->
    <div *ngIf="!loadingData() && activeTab() === 'sedes'">
      <div class="hr-card" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text);">Sedes de Operación</h3>
            <p style="color: var(--text-soft); font-size: 13px; margin: 4px 0 0 0;">Administra los locales físicos y frentes donde los colaboradores registran asistencia.</p>
          </div>
          <button class="hr-btn hr-btn-accent" (click)="openAddLocationModal()">
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span>+</span> Agregar Sede
            </span>
          </button>
        </div>

        <div class="hr-search-input" style="max-width: 320px; margin-bottom: 20px; border-color: var(--border-strong);">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
          </span>
          <input placeholder="Buscar sede..." [ngModel]="searchTermLocations()" (ngModelChange)="searchTermLocations.set($event)"/>
        </div>

        <div *ngIf="loadingLocations()" style="display: flex; justify-content: center; align-items: center; height: 120px;">
          <div class="hr-spinner" style="width: 30px; height: 30px; border-width: 3px;"></div>
        </div>

        <div *ngIf="!loadingLocations()" class="hr-table-wrapper" style="overflow-x: auto; border: 1px solid var(--border); border-radius: 8px;">
          <table class="hr-tbl">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre de la Sede</th>
                <th>Dirección</th>
                <th>Coordenadas (Lat, Lng)</th>
                <th>Radio (m)</th>
                <th style="width: 100px; text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of getFilteredLocations()">
                <td class="hr-mono" style="font-size: 12px; font-weight: 600;">{{ l.code }}</td>
                <td style="font-weight: 600; color: var(--text);">{{ l.name }}</td>
                <td style="color: var(--text-soft);">{{ l.address || '—' }}</td>
                <td class="hr-mono" style="font-size: 12px;">{{ l.latitude || '—' }}, {{ l.longitude || '—' }}</td>
                <td>{{ l.radius_meters }}m</td>
                <td class="action-cell" style="text-align: right; white-space: nowrap;">
                  <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="openEditLocationModal(l)" title="Editar" style="margin-right: 4px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button class="hr-btn hr-btn-ghost hr-btn-icon danger-text" (click)="deleteLocation(l)" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="getFilteredLocations().length === 0">
                <td colspan="6" style="text-align: center; color: var(--text-soft); padding: 32px;">No se encontraron sedes.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 6: HORARIOS -->
    <div *ngIf="!loadingData() && activeTab() === 'horarios'">
      <div class="hr-card" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text);">Horarios y Turnos</h3>
            <p style="color: var(--text-soft); font-size: 13px; margin: 4px 0 0 0;">Configura los turnos de entrada y salida vinculados a sedes y servicios específicos.</p>
          </div>
          <button class="hr-btn hr-btn-accent" (click)="openAddScheduleModal()">
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <span>+</span> Agregar Horario
            </span>
          </button>
        </div>

        <div class="hr-search-input" style="max-width: 320px; margin-bottom: 20px; border-color: var(--border-strong);">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-3.5-3.5"/>
            </svg>
          </span>
          <input placeholder="Buscar horario..." [ngModel]="searchTermSchedules()" (ngModelChange)="searchTermSchedules.set($event)"/>
        </div>

        <div *ngIf="loadingSchedules()" style="display: flex; justify-content: center; align-items: center; height: 120px;">
          <div class="hr-spinner" style="width: 30px; height: 30px; border-width: 3px;"></div>
        </div>

        <div *ngIf="!loadingSchedules()" class="hr-table-wrapper" style="overflow-x: auto; border: 1px solid var(--border); border-radius: 8px;">
          <table class="hr-tbl">
            <thead>
              <tr>
                <th>Horario / Turno</th>
                <th>Servicio</th>
                <th>Sede</th>
                <th>Jornada (Entrada - Salida)</th>
                <th>Tolerancia (min)</th>
                <th>Días de Trabajo</th>
                <th style="width: 100px; text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of getFilteredSchedules()">
                <td style="font-weight: 600; color: var(--text);">{{ s.name }}</td>
                <td><span class="hr-badge info no-dot" style="font-size: 11px;">{{ s.service?.name }}</span></td>
                <td><span class="hr-badge neutral no-dot" style="font-size: 11px;">{{ s.location?.name }}</span></td>
                <td class="hr-mono" style="font-size: 12.5px; font-weight: 600; color: var(--text);">{{ formatTime(s.start_time) }} - {{ formatTime(s.end_time) }}</td>
                <td style="text-align: center;">{{ s.grace_minutes }}m</td>
                <td style="font-size: 11.5px; color: var(--text-soft);">{{ getWorkDaysLabel(s.work_days) }}</td>
                <td class="action-cell" style="text-align: right; white-space: nowrap;">
                  <button class="hr-btn hr-btn-ghost hr-btn-icon" (click)="openEditScheduleModal(s)" title="Editar" style="margin-right: 4px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button class="hr-btn hr-btn-ghost hr-btn-icon danger-text" (click)="deleteSchedule(s)" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="getFilteredSchedules().length === 0">
                <td colspan="7" style="text-align: center; color: var(--text-soft); padding: 32px;">No se encontraron horarios.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: SERVICIO (ADD / EDIT) -->
    <div *ngIf="showServiceModal()" class="modal-overlay" (click)="closeServiceModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingService() ? 'Editar Servicio' : 'Agregar Tipo de Servicio' }}</h3>
          <button class="close-btn" (click)="closeServiceModal()">&times;</button>
        </div>
        <form (ngSubmit)="saveService()" #serviceForm="ngForm">
          <div class="modal-body">
            <div class="hr-field">
              <label for="srvName">Nombre del Servicio <span class="req">*</span></label>
              <input id="srvName" name="name" type="text" [(ngModel)]="serviceModel.name" required placeholder="Ej. Discotecas, Eventos" />
            </div>
            <div class="hr-field" style="margin-top: 14px;">
              <label for="srvDesc">Descripción</label>
              <textarea id="srvDesc" name="description" [(ngModel)]="serviceModel.description" placeholder="Detalla el tipo de servicio..." style="width: 100%; min-height: 80px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-family: inherit; font-size: 13px; resize: vertical;"></textarea>
            </div>
          </div>
          <div class="modal-footer hr-hstack" style="justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
            <button type="button" class="hr-btn hr-btn-ghost" (click)="closeServiceModal()">Cancelar</button>
            <button type="submit" class="hr-btn hr-btn-accent" [disabled]="saving() || !serviceForm.valid">
              {{ saving() ? 'Guardando...' : 'Guardar Servicio' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: SEDE (ADD / EDIT) -->
    <div *ngIf="showLocationModal()" class="modal-overlay" (click)="closeLocationModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingLocation() ? 'Editar Sede' : 'Agregar Nueva Sede' }}</h3>
          <button class="close-btn" (click)="closeLocationModal()">&times;</button>
        </div>
        <form (ngSubmit)="saveLocation()" #locationForm="ngForm">
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px;">
              <div class="hr-field">
                <label for="locCode">Código <span class="req">*</span></label>
                <input id="locCode" name="code" type="text" [(ngModel)]="locationModel.code" required placeholder="Ej. TAL-JOYA" />
              </div>
              <div class="hr-field">
                <label for="locName">Nombre de Sede <span class="req">*</span></label>
                <input id="locName" name="name" type="text" [(ngModel)]="locationModel.name" required placeholder="Ej. Talleres La Joya" />
              </div>
            </div>
            <div class="hr-field" style="margin-top: 14px;">
              <label for="locAddress">Dirección Física</label>
              <input id="locAddress" name="address" type="text" [(ngModel)]="locationModel.address" placeholder="Ej. Carretera Panamericana Km 980" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px;">
              <div class="hr-field">
                <label for="locLat">Latitud</label>
                <input id="locLat" name="latitude" type="number" step="0.000001" [(ngModel)]="locationModel.latitude" readonly style="background: var(--surface-2); cursor: not-allowed;" />
              </div>
              <div class="hr-field">
                <label for="locLng">Longitud</label>
                <input id="locLng" name="longitude" type="number" step="0.000001" [(ngModel)]="locationModel.longitude" readonly style="background: var(--surface-2); cursor: not-allowed;" />
              </div>
            </div>
            
            <div class="hr-field" style="margin-top: 14px;">
              <label for="locRad">Radio de Tolerancia Geocerca (metros, máx. 20m) <span class="req">*</span></label>
              <input id="locRad" name="radius_meters" type="number" [(ngModel)]="locationModel.radius_meters" (ngModelChange)="onRadiusChange()" required min="5" max="20" placeholder="Máx 20m" />
            </div>

            <!-- Leaflet Map Container -->
            <div class="hr-field" style="margin-top: 14px;">
              <label style="margin-bottom: 6px; display: block;">Ubicación de Geocerca (Arrastra el marcador azul)</label>
              <div id="map" style="height: 220px; width: 100%; border-radius: 8px; border: 1px solid var(--border); z-index: 1;"></div>
            </div>
          </div>
          <div class="modal-footer hr-hstack" style="justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
            <button type="button" class="hr-btn hr-btn-ghost" (click)="closeLocationModal()">Cancelar</button>
            <button type="submit" class="hr-btn hr-btn-accent" [disabled]="saving() || !locationForm.valid">
              {{ saving() ? 'Guardando...' : 'Guardar Sede' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: HORARIO (ADD / EDIT) -->
    <div *ngIf="showScheduleModal()" class="modal-overlay" (click)="closeScheduleModal()">
      <div class="modal-card" style="max-width: 500px;" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingSchedule() ? 'Editar Horario' : 'Agregar Horario y Turno' }}</h3>
          <button class="close-btn" (click)="closeScheduleModal()">&times;</button>
        </div>
        <form (ngSubmit)="saveSchedule()" #scheduleForm="ngForm">
          <div class="modal-body">
            <div class="hr-field">
              <label for="schName">Nombre del Turno/Horario <span class="req">*</span></label>
              <input id="schName" name="name" type="text" [(ngModel)]="scheduleModel.name" required placeholder="Ej. Turno Día Almacén" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px;">
              <div class="hr-field">
                <label for="schSrv">Servicio Vinculado <span class="req">*</span></label>
                <select id="schSrv" name="service_id" [(ngModel)]="scheduleModel.service_id" required style="width: 100%; height: 38px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text);">
                  <option value="" disabled selected>Selecciona un servicio</option>
                  <option *ngFor="let s of services()" [value]="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="hr-field">
                <label for="schLoc">Sede Vinculada <span class="req">*</span></label>
                <select id="schLoc" name="location_id" [(ngModel)]="scheduleModel.location_id" required style="width: 100%; height: 38px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text);">
                  <option value="" disabled selected>Selecciona una sede</option>
                  <option *ngFor="let l of locations()" [value]="l.id">{{ l.name }}</option>
                </select>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 14px;">
              <div class="hr-field">
                <label for="schStart">Entrada <span class="req">*</span></label>
                <input id="schStart" name="start_time" type="text" [(ngModel)]="scheduleModel.start_time" required placeholder="HH:MM" style="width: 100%; box-sizing: border-box;" />
              </div>
              <div class="hr-field">
                <label for="schEnd">Salida <span class="req">*</span></label>
                <input id="schEnd" name="end_time" type="text" [(ngModel)]="scheduleModel.end_time" required placeholder="HH:MM" style="width: 100%; box-sizing: border-box;" />
              </div>
              <div class="hr-field">
                <label for="schGrace">Tolerancia (min)</label>
                <input id="schGrace" name="grace_minutes" type="number" [(ngModel)]="scheduleModel.grace_minutes" min="0" placeholder="15" style="width: 100%; box-sizing: border-box;" />
              </div>
            </div>
            <div class="hr-field" style="margin-top: 14px;">
              <label>Días Laborales <span class="req">*</span></label>
              <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;">
                <label *ngFor="let d of [
                  {v: 1, l: 'L'}, {v: 2, l: 'M'}, {v: 3, l: 'X'}, 
                  {v: 4, l: 'J'}, {v: 5, l: 'V'}, {v: 6, l: 'S'}, {v: 7, l: 'D'}
                ]" style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); cursor: pointer;"
                [style.background]="scheduleModel.work_days.includes(d.v) ? 'var(--accent)' : 'var(--surface-2)'"
                [style.color]="scheduleModel.work_days.includes(d.v) ? 'var(--accent-contrast)' : 'var(--text)'"
                [style.font-weight]="'600'"
                (click)="toggleWorkDay(d.v)">
                  {{ d.l }}
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer hr-hstack" style="justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
            <button type="button" class="hr-btn hr-btn-ghost" (click)="closeScheduleModal()">Cancelar</button>
            <button type="submit" class="hr-btn hr-btn-accent" [disabled]="saving() || !scheduleForm.valid || scheduleModel.work_days.length === 0">
              {{ saving() ? 'Guardando...' : 'Guardar Horario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .success-banner {
      background: var(--success-soft);
      border: 1px solid var(--success);
      color: var(--success);
    }
    .danger-banner {
      background: var(--danger-soft);
      border: 1px solid var(--danger);
      color: var(--danger);
    }
    .perm-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface-2);
      cursor: pointer;
      transition: border-color 0.12s, background-color 0.12s;
    }
    .perm-card:hover {
      border-color: var(--accent);
      background: var(--surface);
    }
    .perm-card input[type="checkbox"] {
      margin-top: 3px;
      cursor: pointer;
    }
    .perm-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .perm-body .lbl {
      font-weight: 600;
      font-size: 13px;
      color: var(--text);
    }
    .perm-body .desc {
      font-size: 11px;
      color: var(--text-mute);
      line-height: 1.3;
    }
    .hr-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .danger-text {
      color: var(--danger) !important;
    }
    .danger-text:hover {
      background: var(--danger-soft) !important;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease-out;
    }
    .modal-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 100%;
      max-width: 460px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04);
      animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .modal-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }
    .modal-header .close-btn {
      background: transparent;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-soft);
      line-height: 1;
      padding: 0;
    }
    .modal-header .close-btn:hover {
      color: var(--text);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfigurationComponent implements OnInit {
  private readonly configService = inject(ConfigurationService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly serviceTypeService = inject(ServiceTypeService);
  private readonly locationService = inject(LocationService);
  private readonly scheduleService = inject(ScheduleService);

  readonly activeTab = signal<'empresa' | 'roles' | 'usuarios' | 'servicios' | 'sedes' | 'horarios'>('empresa');
  readonly loadingData = signal(true);
  readonly saving = signal(false);
  
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Users management state
  readonly users = signal<UserDto[]>([]);
  readonly loadingUsers = signal(false);
  readonly showUserModal = signal(false);
  readonly savingUser = signal(false);
  readonly editingUser = signal<UserDto | null>(null);
  readonly searchTerm = signal('');
  readonly errorModalMessage = signal<string | null>(null);

  // Services State
  readonly services = signal<ServiceDto[]>([]);
  readonly loadingServices = signal(false);
  readonly showServiceModal = signal(false);
  readonly editingService = signal(false);
  serviceModel = { id: '', name: '', description: '' };
  readonly searchTermServices = signal('');

  // Locations State
  readonly locations = signal<LocationDto[]>([]);
  readonly loadingLocations = signal(false);
  readonly showLocationModal = signal(false);
  readonly editingLocation = signal(false);
  locationModel = { id: '', code: '', name: '', address: '', latitude: 0, longitude: 0, radius_meters: 20 };
  readonly searchTermLocations = signal('');
  
  leafletMap: any = null;
  leafletMarker: any = null;
  leafletCircle: any = null;

  // Schedules State
  readonly schedules = signal<ScheduleDto[]>([]);
  readonly loadingSchedules = signal(false);
  readonly showScheduleModal = signal(false);
  readonly editingSchedule = signal(false);
  scheduleModel = { id: '', name: '', service_id: '', location_id: '', start_time: '', end_time: '', grace_minutes: 15, work_days: [] as number[] };
  readonly searchTermSchedules = signal('');

  userModel: UserDto = {
    name: '',
    email: '',
    password: '',
    role: 'user'
  };

  company: CompanyConfig = {
    name: '',
    ruc: '',
    address: '',
    phone: '',
    email: ''
  };

  rolesPermissions: any = {
    ADMIN: {},
    GUARDIA: {},
    USER: {}
  };

  readonly permissionKeys = [
    'ver_colaboradores',
    'editar_colaboradores',
    'ver_asistencia',
    'editar_asistencia',
    'ver_contratos',
    'editar_contratos',
    'ver_reportes',
    'acceso_scanner',
    'configurar_sistema'
  ];

  ngOnInit(): void {
    this.loadConfig();
  }

  setTab(tab: 'empresa' | 'roles' | 'usuarios' | 'servicios' | 'sedes' | 'horarios'): void {
    this.activeTab.set(tab);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    if (tab === 'usuarios') {
      this.loadUsers();
    } else if (tab === 'servicios') {
      this.loadServices();
    } else if (tab === 'sedes') {
      this.loadLocations();
    } else if (tab === 'horarios') {
      this.loadServices();
      this.loadLocations();
      this.loadSchedules();
    }
  }

  async loadConfig(): Promise<void> {
    this.loadingData.set(true);
    this.errorMessage.set(null);
    try {
      const response = await this.configService.getCompany();
      this.company = response.company;
      if (response.company.rolesPermissions) {
        this.rolesPermissions = response.company.rolesPermissions;
      }
    } catch (err: any) {
      console.error('Error loading config:', err);
      this.errorMessage.set('No se pudo cargar la configuración de la empresa. Revisa los permisos.');
    } finally {
      this.loadingData.set(false);
    }
  }

  async loadUsers(): Promise<void> {
    this.loadingUsers.set(true);
    this.errorMessage.set(null);
    try {
      const response = await this.userService.getUsers();
      this.users.set(response.users);
    } catch (err: any) {
      console.error('Error loading users:', err);
      this.errorMessage.set('No se pudieron cargar los usuarios de la empresa.');
    } finally {
      this.loadingUsers.set(false);
    }
  }

  openAddUserModal(): void {
    this.editingUser.set(null);
    this.errorModalMessage.set(null);
    this.userModel = {
      name: '',
      email: '',
      password: '',
      role: 'user'
    };
    this.showUserModal.set(true);
  }

  openEditUserModal(user: UserDto): void {
    this.editingUser.set(user);
    this.errorModalMessage.set(null);
    this.userModel = {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    };
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
    this.errorModalMessage.set(null);
  }

  async saveUser(): Promise<void> {
    if (this.savingUser()) return;
    this.savingUser.set(true);
    this.errorModalMessage.set(null);

    const payload: UserDto = {
      name: this.userModel.name.trim(),
      email: this.userModel.email.trim(),
      role: this.userModel.role
    };

    if (this.userModel.password && this.userModel.password.trim().length > 0) {
      payload.password = this.userModel.password.trim();
    }

    try {
      const editUser = this.editingUser();
      if (editUser && editUser.id) {
        await this.userService.updateUser(editUser.id, payload);
        this.successMessage.set('Usuario actualizado con éxito.');
      } else {
        await this.userService.createUser(payload);
        this.successMessage.set('Usuario creado con éxito.');
      }
      this.closeUserModal();
      this.loadUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      const validationError = err.error?.errors ? Object.values(err.error.errors).flat().join(' ') : null;
      this.errorModalMessage.set(err.error?.error || validationError || 'Error al guardar el usuario.');
    } finally {
      this.savingUser.set(false);
    }
  }

  async deleteUser(user: UserDto): Promise<void> {
    if (!user.id) return;
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.name}"?`)) {
      this.successMessage.set(null);
      this.errorMessage.set(null);
      try {
        await this.userService.deleteUser(user.id);
        this.successMessage.set('Usuario eliminado con éxito.');
        this.loadUsers();
      } catch (err: any) {
        console.error('Error deleting user:', err);
        this.errorMessage.set(err.error?.error || 'No se pudo eliminar el usuario.');
      }
    }
  }

  getFilteredUsers(): UserDto[] {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return this.users();
    return this.users().filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search) || 
      u.role.toLowerCase().includes(search)
    );
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  getRoleBadgeClass(role: string): string {
    if (!role) return 'neutral';
    const r = role.toLowerCase();
    if (r === 'admin' || r === 'rrhh') return 'success';
    if (r === 'guardia') return 'info';
    return 'neutral';
  }

  getRoleLabel(role: string): string {
    if (!role) return 'Colaborador';
    const r = role.toLowerCase();
    if (r === 'admin') return 'Administrador';
    if (r === 'rrhh') return 'Administrador RR.HH.';
    if (r === 'guardia') return 'Guardia de Seguridad';
    return 'Colaborador';
  }

  async saveCompany(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const payload = {
      name: this.company.name.trim(),
      ruc: this.company.ruc.trim(),
      address: this.company.address?.trim() || null,
      phone: this.company.phone?.trim() || null,
      email: this.company.email?.trim() || null
    };

    try {
      await this.configService.updateCompany(payload);
      this.successMessage.set('Información corporativa guardada con éxito.');
      await this.authService.fetchCurrentUser();
    } catch (err: any) {
      console.error('Error updating company:', err);
      this.errorMessage.set(err.error?.error || 'Error al guardar los datos de la empresa.');
    } finally {
      this.saving.set(false);
    }
  }

  async savePermissions(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      await this.configService.updateRolesPermissions(this.rolesPermissions);
      this.successMessage.set('Permisos de roles actualizados exitosamente en el servidor.');
    } catch (err: any) {
      console.error('Error updating permissions:', err);
      this.errorMessage.set('Error al actualizar la matriz de permisos de roles.');
    } finally {
      this.saving.set(false);
    }
  }

  getPermissionLabel(key: string): string {
    const labels: Record<string, string> = {
      ver_colaboradores: 'Ver Colaboradores',
      editar_colaboradores: 'Gestionar Colaboradores',
      ver_asistencia: 'Ver Asistencias',
      editar_asistencia: 'Gestionar Asistencias',
      ver_contratos: 'Ver Contratos',
      editar_contratos: 'Gestionar Contratos',
      ver_reportes: 'Ver Reportes y Exportables',
      acceso_scanner: 'Acceso a Terminal Biométrico QR',
      configurar_sistema: 'Administrar Configuración del Sistema'
    };
    return labels[key] || key;
  }

  getPermissionDesc(key: string): string {
    const descs: Record<string, string> = {
      ver_colaboradores: 'Visualizar lista e información de la planilla',
      editar_colaboradores: 'Crear, actualizar y dar de baja colaboradores',
      ver_asistencia: 'Ver logs y KPIs diarios/mensuales de marcaciones',
      editar_asistencia: 'Crear, justificar o editar marcaciones manuales',
      ver_contratos: 'Visualizar contratos activos e históricos en PDF',
      editar_contratos: 'Crear, renovar o finalizar modalidades de contratos',
      ver_reportes: 'Exportar reportes de asistencia y nómina en CSV',
      acceso_scanner: 'Permitir uso del scanner QR y toma de fotos',
      configurar_sistema: 'Cambiar datos de empresa, RUC, roles y permisos'
    };
    return descs[key] || '';
  }
  // ==========================================
  // SERVICES CRUD
  // ==========================================
  async loadServices(): Promise<void> {
    this.loadingServices.set(true);
    try {
      const res = await this.serviceTypeService.getServices();
      this.services.set(res.data || res);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      this.loadingServices.set(false);
    }
  }

  openAddServiceModal(): void {
    this.editingService.set(false);
    this.serviceModel = { id: '', name: '', description: '' };
    this.showServiceModal.set(true);
  }

  openEditServiceModal(service: ServiceDto): void {
    this.editingService.set(true);
    this.serviceModel = {
      id: service.id || '',
      name: service.name,
      description: service.description || ''
    };
    this.showServiceModal.set(true);
  }

  closeServiceModal(): void {
    this.showServiceModal.set(false);
  }

  async saveService(): Promise<void> {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    try {
      if (this.editingService()) {
        await this.serviceTypeService.updateService(this.serviceModel.id, this.serviceModel);
        this.successMessage.set('Servicio actualizado con éxito.');
      } else {
        await this.serviceTypeService.createService(this.serviceModel);
        this.successMessage.set('Servicio registrado con éxito.');
      }
      this.closeServiceModal();
      this.loadServices();
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Error al guardar el servicio.');
    }
  }

  async deleteService(service: ServiceDto): Promise<void> {
    if (!service.id) return;
    if (confirm(`¿Estás seguro de que deseas eliminar el servicio "${service.name}"?`)) {
      this.successMessage.set(null);
      this.errorMessage.set(null);
      try {
        await this.serviceTypeService.deleteService(service.id);
        this.successMessage.set('Servicio eliminado con éxito.');
        this.loadServices();
      } catch (err: any) {
        this.errorMessage.set(err.error?.message || 'No se pudo eliminar el servicio.');
      }
    }
  }

  getFilteredServices(): ServiceDto[] {
    const s = this.searchTermServices().toLowerCase().trim();
    if (!s) return this.services();
    return this.services().filter(item => item.name.toLowerCase().includes(s));
  }

  // ==========================================
  // LOCATIONS CRUD
  // ==========================================
  async loadLocations(): Promise<void> {
    this.loadingLocations.set(true);
    try {
      const res = await this.locationService.getLocations();
      this.locations.set(res.data || res);
    } catch (err) {
      console.error('Error loading locations:', err);
    } finally {
      this.loadingLocations.set(false);
    }
  }

  openAddLocationModal(): void {
    this.editingLocation.set(false);
    this.locationModel = { 
      id: '', 
      code: '', 
      name: '', 
      address: '', 
      latitude: -12.046374, 
      longitude: -77.042793, 
      radius_meters: 20 
    };
    this.showLocationModal.set(true);
    this.initMap();
  }

  openEditLocationModal(loc: LocationDto): void {
    this.editingLocation.set(true);
    this.locationModel = {
      id: loc.id || '',
      code: loc.code,
      name: loc.name,
      address: loc.address || '',
      latitude: loc.latitude || -12.046374,
      longitude: loc.longitude || -77.042793,
      radius_meters: Math.min(loc.radius_meters || 20, 20)
    };
    this.showLocationModal.set(true);
    this.initMap();
  }

  closeLocationModal(): void {
    this.showLocationModal.set(false);
    if (this.leafletMap) {
      try {
        this.leafletMap.remove();
      } catch (e) {}
      this.leafletMap = null;
      this.leafletMarker = null;
      this.leafletCircle = null;
    }
  }

  loadLeaflet(): Promise<void> {
    if ((window as any).L) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  initMap(): void {
    setTimeout(async () => {
      await this.loadLeaflet();
      
      const lat = this.locationModel.latitude || -12.046374;
      const lng = this.locationModel.longitude || -77.042793;
      
      const L = (window as any).L;
      if (!L) return;

      const mapContainer = document.getElementById('map');
      if (!mapContainer) return;

      if (this.leafletMap) {
        try {
          this.leafletMap.remove();
        } catch (e) {}
      }

      this.leafletMap = L.map('map').setView([lat, lng], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(this.leafletMap);

      // Create draggable marker
      this.leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(this.leafletMap);

      // Create geofence circle (radius max 20m)
      const rad = Math.min(this.locationModel.radius_meters || 20, 20);
      this.locationModel.radius_meters = rad;
      
      this.leafletCircle = L.circle([lat, lng], {
        radius: rad,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2
      }).addTo(this.leafletMap);

      // Drag listener
      this.leafletMarker.on('dragend', () => {
        const pos = this.leafletMarker.getLatLng();
        this.locationModel.latitude = Number(pos.lat.toFixed(6));
        this.locationModel.longitude = Number(pos.lng.toFixed(6));
        this.leafletCircle.setLatLng(pos);
      });

      // Map click listener
      this.leafletMap.on('click', (e: any) => {
        const pos = e.latlng;
        this.leafletMarker.setLatLng(pos);
        this.locationModel.latitude = Number(pos.lat.toFixed(6));
        this.locationModel.longitude = Number(pos.lng.toFixed(6));
        this.leafletCircle.setLatLng(pos);
      });
    }, 150);
  }

  onRadiusChange(): void {
    if (this.locationModel.radius_meters > 20) {
      this.locationModel.radius_meters = 20;
    }
    if (this.leafletCircle) {
      this.leafletCircle.setRadius(this.locationModel.radius_meters);
    }
  }

  async saveLocation(): Promise<void> {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    try {
      if (this.editingLocation()) {
        await this.locationService.updateLocation(this.locationModel.id, this.locationModel);
        this.successMessage.set('Sede actualizada con éxito.');
      } else {
        await this.locationService.createLocation(this.locationModel);
        this.successMessage.set('Sede registrada con éxito.');
      }
      this.closeLocationModal();
      this.loadLocations();
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Error al guardar la sede.');
    }
  }

  async deleteLocation(loc: LocationDto): Promise<void> {
    if (!loc.id) return;
    if (confirm(`¿Estás seguro de que deseas eliminar la sede "${loc.name}"?`)) {
      this.successMessage.set(null);
      this.errorMessage.set(null);
      try {
        await this.locationService.deleteLocation(loc.id);
        this.successMessage.set('Sede eliminada con éxito.');
        this.loadLocations();
      } catch (err: any) {
        this.errorMessage.set(err.error?.message || 'No se pudo eliminar la sede.');
      }
    }
  }

  getFilteredLocations(): LocationDto[] {
    const s = this.searchTermLocations().toLowerCase().trim();
    if (!s) return this.locations();
    return this.locations().filter(item => 
      item.name.toLowerCase().includes(s) || 
      item.code.toLowerCase().includes(s)
    );
  }

  // ==========================================
  // SCHEDULES CRUD
  // ==========================================
  async loadSchedules(): Promise<void> {
    this.loadingSchedules.set(true);
    try {
      const res = await this.scheduleService.getSchedules();
      this.schedules.set(res.data || res);
    } catch (err) {
      console.error('Error loading schedules:', err);
    } finally {
      this.loadingSchedules.set(false);
    }
  }

  openAddScheduleModal(): void {
    this.editingSchedule.set(false);
    this.scheduleModel = {
      id: '',
      name: '',
      service_id: this.services()[0]?.id || '',
      location_id: this.locations()[0]?.id || '',
      start_time: '08:00',
      end_time: '18:00',
      grace_minutes: 15,
      work_days: [1, 2, 3, 4, 5, 6]
    };
    this.showScheduleModal.set(true);
  }

  openEditScheduleModal(sched: ScheduleDto): void {
    this.editingSchedule.set(true);
    this.scheduleModel = {
      id: sched.id || '',
      name: sched.name,
      service_id: sched.service_id,
      location_id: sched.location_id,
      start_time: sched.start_time.slice(0, 5),
      end_time: sched.end_time.slice(0, 5),
      grace_minutes: sched.grace_minutes,
      work_days: [...sched.work_days]
    };
    this.showScheduleModal.set(true);
  }

  closeScheduleModal(): void {
    this.showScheduleModal.set(false);
  }

  toggleWorkDay(day: number): void {
    const idx = this.scheduleModel.work_days.indexOf(day);
    if (idx > -1) {
      this.scheduleModel.work_days.splice(idx, 1);
    } else {
      this.scheduleModel.work_days.push(day);
    }
  }

  async saveSchedule(): Promise<void> {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    try {
      if (this.editingSchedule()) {
        await this.scheduleService.updateSchedule(this.scheduleModel.id, this.scheduleModel);
        this.successMessage.set('Horario actualizado con éxito.');
      } else {
        await this.scheduleService.createSchedule(this.scheduleModel);
        this.successMessage.set('Horario registrado con éxito.');
      }
      this.closeScheduleModal();
      this.loadSchedules();
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Error al guardar el horario.');
    }
  }

  async deleteSchedule(sched: ScheduleDto): Promise<void> {
    if (!sched.id) return;
    if (confirm(`¿Estás seguro de que deseas eliminar el horario "${sched.name}"?`)) {
      this.successMessage.set(null);
      this.errorMessage.set(null);
      try {
        await this.scheduleService.deleteSchedule(sched.id);
        this.successMessage.set('Horario eliminado con éxito.');
        this.loadSchedules();
      } catch (err: any) {
        this.errorMessage.set(err.error?.message || 'No se pudo eliminar el horario.');
      }
    }
  }

  getFilteredSchedules(): ScheduleDto[] {
    const s = this.searchTermSchedules().toLowerCase().trim();
    if (!s) return this.schedules();
    return this.schedules().filter(item => item.name.toLowerCase().includes(s));
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.slice(0, 5);
  }

  getWorkDaysLabel(days: number[]): string {
    if (!days || days.length === 0) return 'Ninguno';
    const dayLabels: Record<number, string> = {
      1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom'
    };
    return days.sort().map(d => dayLabels[d]).join(', ');
  }
}
