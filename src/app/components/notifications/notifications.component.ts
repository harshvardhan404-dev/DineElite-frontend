import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Notification } from '../../models/notification';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="notifications-container glass">
            <div class="notifications-header">
                <h2>Activity Feed</h2>
                <span class="unread-badge" *ngIf="unreadCount > 0">{{ unreadCount }} New</span>
            </div>
            
            <div class="notifications-list" *ngIf="notifications.length > 0; else empty">
                <div class="notification-item" 
                     *ngFor="let note of notifications" 
                     [class.unread]="!note.isRead"
                     (click)="markRead(note)">
                    <div class="notification-icon" [ngClass]="note.type.toLowerCase()">
                        {{ getIcon(note.type) }}
                    </div>
                    <div class="notification-content">
                        <p class="message">{{ note.message }}</p>
                        <span class="time">{{ note.createdAt | date:'shortTime' }} • {{ note.createdAt | date:'mediumDate' }}</span>
                    </div>
                </div>
            </div>
            
            <ng-template #empty>
                <div class="empty-state">
                    <div class="sparkle">✨</div>
                    <p>All caught up! Check back later for new updates.</p>
                </div>
            </ng-template>
        </div>
    `,
    styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
    notifications: Notification[] = [];
    unreadCount: number = 0;

    constructor(
        private notificationService: NotificationService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.loadNotifications();
            this.loadUnreadCount();
        }
    }

    loadNotifications(): void {
        this.notificationService.getNotifications().subscribe(data => {
            this.notifications = data;
        });
    }

    loadUnreadCount(): void {
        this.notificationService.getUnreadCount().subscribe(count => {
            this.unreadCount = count;
        });
    }

    markRead(note: Notification): void {
        if (!note.isRead) {
            this.notificationService.markAsRead(note.notificationId).subscribe(() => {
                note.isRead = true;
                this.unreadCount--;
            });
        }
    }

    getIcon(type: string): string {
        switch (type) {
            case 'BOOKING': return '📅';
            case 'LIKE': return '❤️';
            case 'COMMENT': return '💬';
            default: return '🔔';
        }
    }
}
