import { Component, inject } from '@angular/core';
import { Router, RouterModule, NavigationError } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
    constructor() {
        const router = inject(Router);
        router.events.subscribe((event) => {
            if (event instanceof NavigationError) {
                console.error('ROUTING ERROR:', event.error);
            }
        });
    }
}
