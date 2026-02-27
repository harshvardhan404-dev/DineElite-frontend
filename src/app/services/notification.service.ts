import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(private http: HttpClient) { }

    getNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>('/api/notifications');
    }

    getUnreadCount(): Observable<number> {
        return this.http.get<number>('/api/notifications/unread-count');
    }

    markAsRead(notificationId: number): Observable<void> {
        return this.http.post<void>(`/api/notifications/read/${notificationId}`, {});
    }
}
