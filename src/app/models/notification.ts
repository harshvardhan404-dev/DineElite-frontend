export enum NotificationType {
    BOOKING = 'BOOKING',
    LIKE = 'LIKE',
    COMMENT = 'COMMENT'
}

export interface Notification {
    notificationId: number;
    recipientId: number;
    senderName?: string;
    type: NotificationType;
    message: string;
    isRead: boolean;
    createdAt: string;
}
