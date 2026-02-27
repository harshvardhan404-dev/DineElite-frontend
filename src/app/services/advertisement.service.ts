import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Advertisement } from '../models/advertisement';

@Injectable({
    providedIn: 'root'
})
export class AdvertisementService {

    constructor(private http: HttpClient) { }

    getAllAdvertisements(): Observable<Advertisement[]> {
        return this.http.get<Advertisement[]>(`${environment.apiUrl}/api/advertisements`);
    }

    getRestaurantAdvertisements(restaurantId: number): Observable<Advertisement[]> {
        return this.http.get<Advertisement[]>(`${environment.apiUrl}/api/advertisements/restaurant/${restaurantId}`);
    }

    createAdvertisement(advertisement: any): Observable<Advertisement> {
        return this.http.post<Advertisement>(`${environment.apiUrl}/api/advertisements`, advertisement);
    }
}
