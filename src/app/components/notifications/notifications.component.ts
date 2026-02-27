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
    styles: [`
        .notifications-container {
            padding: 30px;
            border-radius: 24px;
            max-width: 800px;
            margin: 40px auto;
        }
        .notifications-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 15px;
        }
        .unread-badge {
            background: var(--primary);
            color: black;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 800;
        }
        .notification-item {
            display: flex;
            gap: 20px;
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 15px;
            background: rgba(255, 255, 255, 0.02);
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid transparent;
        }
        .notification-item:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateX(5px);
        }
        .notification-item.unread {
            background: rgba(var(--primary-rgb), 0.05);
            border-color: rgba(var(--primary-rgb), 0.2);
        }
        .notification-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
        }
        .notification-icon.booking { background: rgba(255, 184, 0, 0.1); border: 1px solid rgba(255, 184, 0, 0.3); }
        .notification-icon.like { background: rgba(255, 48, 64, 0.1); border: 1px solid rgba(255, 48, 64, 0.3); }
        .notification-icon.comment { background: rgba(0, 149, 246, 0.1); border: 1px solid rgba(0, 149, 246, 0.3); }
        .message { margin-bottom: 5px; color: white; line-height: 1.5; font-size: 0.95rem; }
        .time { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; }
        .empty-state { text-align: center; padding: 60px 0; }
        .sparkle { font-size: 3rem; margin-bottom: 15px; }
    `]
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
