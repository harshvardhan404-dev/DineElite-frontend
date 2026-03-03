import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RecommendationService {

    constructor(private http: HttpClient) { }

    getDishRecommendations(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/api/recommendations/dishes`);
    }

    getRestaurantRecommendations(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/api/recommendations/restaurants`);
    }
}
