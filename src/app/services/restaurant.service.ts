import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RestaurantService {

    constructor(private http: HttpClient) { }

    getRestaurantByAdmin(userId: number): Observable<any> {
        return this.http.get<any>(`/api/restaurants/admin/${userId}`);
    }

    getAllRestaurants(): Observable<any[]> {
        return this.http.get<any[]>('/api/restaurants');
    }

    getPersonalizedRecommendations(userId: number): Observable<any[]> {
        return this.http.get<any[]>(`/api/restaurants/recommendations?userId=${userId}`);
    }

    updateRestaurant(id: number, restaurant: any): Observable<any> {
        return this.http.put<any>(`/api/restaurants/${id}`, restaurant);
    }

    // Menu Management
    addMenuItem(restaurantId: number, item: any): Observable<any> {
        return this.http.post<any>(`/api/menu/restaurant/${restaurantId}`, item);
    }

    updateMenuItem(menuId: number, item: any): Observable<any> {
        return this.http.put<any>(`/api/menu/${menuId}`, item);
    }

    deleteMenuItem(menuId: number): Observable<any> {
        return this.http.delete<any>(`/api/menu/${menuId}`);
    }

    // Table Layout Management
    getTableLayout(restaurantId: number): Observable<any[]> {
        return this.http.get<any[]>(`/api/table-layout/${restaurantId}`);
    }

    saveTableLayout(restaurantId: number, tables: any[]): Observable<any> {
        return this.http.put<any>(`/api/table-layout/${restaurantId}`, tables);
    }

    addTable(restaurantId: number, table: any): Observable<any> {
        return this.http.post<any>(`/api/table-layout/${restaurantId}`, table);
    }

    deleteTable(tableId: number): Observable<any> {
        return this.http.delete<any>(`/api/table-layout/table/${tableId}`);
    }
}
