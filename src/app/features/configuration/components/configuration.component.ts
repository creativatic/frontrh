import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigurationService, CompanyConfig } from '../../../shared/services/configuration.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserService, UserDto } from '../../../shared/services/user.service';

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
          👥 Gestión de Usuarios
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

  readonly activeTab = signal<'empresa' | 'roles' | 'usuarios'>('empresa');
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

  setTab(tab: 'empresa' | 'roles' | 'usuarios'): void {
    this.activeTab.set(tab);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    if (tab === 'usuarios') {
      this.loadUsers();
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
}
