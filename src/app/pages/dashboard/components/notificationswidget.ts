import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

@Component({
    standalone: true,
    selector: 'app-notifications-widget',
    imports: [ButtonModule, MenuModule],
    template: `<div class="card">
        <div class="flex items-center justify-between mb-6">
            <div class="font-semibold text-xl">Notificaciones de Seguridad</div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>

        <span class="block text-muted-color font-medium mb-4">HOY</span>
        <ul class="p-0 mx-0 mt-0 mb-6 list-none">
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-clock text-xl! text-orange-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >Renato Paredes
                    <span class="text-surface-700 dark:text-surface-100">registró ingreso con <span class="text-primary font-bold">Tardanza</span> en Talleres La Joya</span>
                </span>
            </li>
            <li class="flex items-center py-2">
                <div class="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-map-marker text-xl! text-blue-500"></i>
                </div>
                <span class="text-surface-700 dark:text-surface-100 leading-normal">Marcación de ingreso exitosa de Juan Guardia en Almacén Arequipa (Turno Día).</span>
            </li>
        </ul>

        <span class="block text-muted-color font-medium mb-4">AYER</span>
        <ul class="p-0 m-0 list-none mb-6">
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-check-circle text-xl! text-green-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >Super Administrador
                    <span class="text-surface-700 dark:text-surface-100">aprobó solicitud de permiso de <span class="text-primary font-bold">Carlos Mendoza</span></span>
                </span>
            </li>
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-pink-100 dark:bg-pink-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-exclamation-triangle text-xl! text-pink-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal"
                    >Alerta de Marcación:
                    <span class="text-surface-700 dark:text-surface-100">Jorge Quispe registró salida fuera de la geocerca permitida.</span>
                </span>
            </li>
        </ul>
        <span class="block text-muted-color font-medium mb-4">SEMANA PASADA</span>
        <ul class="p-0 m-0 list-none">
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-calendar-plus text-xl! text-purple-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal">Se agregaron los feriados locales del mes de Julio al calendario de asistencia.</span>
            </li>
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-file text-xl! text-red-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal">Contrato laboral por vencer para <span class="text-primary font-bold">Lucho Seguridad</span> (Vence en 12 días).</span>
            </li>
        </ul>
    </div>`
})
export class NotificationsWidget {
    items = [
        { label: 'Marcar Leídas', icon: 'pi pi-fw pi-check' },
        { label: 'Limpiar Todo', icon: 'pi pi-fw pi-trash' }
    ];
}
