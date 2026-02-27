export interface BookingHistory {
    bookingId: number;
    restaurantName: string;
    address: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    status: string;
    depositAmount: number;
    paymentStatus: string;
    dietaryNotes?: string;
}
