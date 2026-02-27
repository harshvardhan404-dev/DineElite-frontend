export enum MediaType {
    POST = 'POST',
    REEL = 'REEL'
}

export interface Advertisement {
    adId: number;
    restaurantId: number;
    restaurantName: string;
    mediaUrl: string;
    mediaType: MediaType;
    caption: string;
    createdAt: string;
}
