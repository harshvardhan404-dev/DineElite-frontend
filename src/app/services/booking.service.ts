import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BookingHistory } from '../models/booking-history';
import { MenuItem } from '../models/restaurant-detail';
import { DashboardAnalytics } from '../models/analytics';

@Injectable({
    providedIn: 'root'
})
export class BookingService {

    constructor(private http: HttpClient) { }

    getRestaurants(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/api/restaurants`);
    }

    checkAvailability(restaurantId: number, date: string, slotId: number, guestCount: number): Observable<any[]> {
        const params = new HttpParams()
            .set('restaurantId', restaurantId)
            .set('date', date)
            .set('slotId', slotId)
            .set('guestCount', guestCount);

        return this.http.get<any[]>(`${environment.apiUrl}/api/booking/availability`, { params });
    }

    getAvailableSlots(restaurantId: number, date: string, guestCount: number): Observable<any[]> {
        const params = new HttpParams()
            .set('restaurantId', restaurantId)
            .set('date', date)
            .set('guestCount', guestCount);

        return this.http.get<any[]>(`${environment.apiUrl}/api/booking/available-slots`, { params });
    }

    getTableAvailability(restaurantId: number, date: string, slotId: number, guestCount: number): Observable<any[]> {
        const params = new HttpParams()
            .set('date', date)
            .set('slotId', slotId)
            .set('guestCount', guestCount);

        return this.http.get<any[]>(`${environment.apiUrl}/api/table-layout/${restaurantId}/availability`, { params });
    }

    createBooking(restaurantId: number, date: string, slotId: number, guestCount: number, tableId?: number): Observable<any> {
        let params = new HttpParams()
            .set('restaurantId', restaurantId)
            .set('date', date)
            .set('slotId', slotId)
            .set('guestCount', guestCount);

        if (tableId) {
            params = params.set('tableId', tableId);
        }

        return this.http.get<any>(`${environment.apiUrl}/api/booking/create`, { params });
    }

    getBookingHistory(): Observable<BookingHistory[]> {
        return this.http.get<BookingHistory[]>(`${environment.apiUrl}/api/booking/history`);
    }

    getPopularMenu(restaurantId: number): Observable<MenuItem[]> {
        return this.http.get<MenuItem[]>(`${environment.apiUrl}/api/restaurants/${restaurantId}/menu`);
    }

    cancelBooking(bookingId: number): Observable<any> {
        return this.http.get(`${environment.apiUrl}/api/booking/cancel/${bookingId}`);
    }

    getAdminStats(restaurantId: number): Observable<any> {
        return this.http.get(`${environment.apiUrl}/api/booking/admin/restaurant/${restaurantId}/count`);
    }

    getDashboardAnalytics(restaurantId: number): Observable<DashboardAnalytics> {
        return this.http.get<DashboardAnalytics>(`${environment.apiUrl}/api/booking/admin/restaurant/${restaurantId}/analytics`);
    }
}
