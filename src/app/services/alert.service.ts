import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
    type: 'success' | 'error' | 'info';
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    public alert$ = new Subject<Alert | null>();

    constructor() { }

    success(message: string) {
        this.alert$.next({ type: 'success', message });
    }

    error(message: string) {
        this.alert$.next({ type: 'error', message });
    }

    info(message: string) {
        this.alert$.next({ type: 'info', message });
    }

    clear() {
        this.alert$.next(null);
    }
}
