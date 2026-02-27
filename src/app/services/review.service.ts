import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewRequest } from '../models/review';

@Injectable({
    providedIn: 'root'
})
export class ReviewService {

    private apiUrl = '/api/reviews';

    constructor(private http: HttpClient) { }

    addReview(review: ReviewRequest, photos?: File[]): Observable<Review> {
        const formData = new FormData();
        formData.append('review', new Blob([JSON.stringify(review)], { type: 'application/json' }));

        if (photos) {
            photos.forEach(photo => formData.append('photos', photo));
        }

        return this.http.post<Review>(this.apiUrl, formData);
    }

    getRestaurantReviews(restaurantId: number): Observable<Review[]> {
        return this.http.get<Review[]>(`${this.apiUrl}/restaurant/${restaurantId}`);
    }

    getUserReviews(): Observable<Review[]> {
        // Updated to use authenticated context on backend if needed, 
        // but for now keeping it simple as it might not be implemented yet on backend for authenticated user
        return this.http.get<Review[]>(`${this.apiUrl}/user/me`);
    }
}
