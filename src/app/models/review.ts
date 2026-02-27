export interface Review {
    reviewId?: number;
    userName: string;
    restaurantName: string;
    rating: number;
    content: string;
    createdAt: Date;
    photoUrls: string[];
}

export interface ReviewRequest {
    userId: number;
    restaurantId: number;
    rating: number;
    content: string;
    photoUrls: string[];
}
