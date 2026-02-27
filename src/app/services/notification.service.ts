import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models/notification';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(private http: HttpClient) { }

    getNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${environment.apiUrl}/api/notifications`);
    }

    getUnreadCount(): Observable<number> {
        return this.http.get<number>(`${environment.apiUrl}/api/notifications/unread-count`);
    }

    markAsRead(notificationId: number): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}/api/notifications/read/${notificationId}`, {});
    }
}
