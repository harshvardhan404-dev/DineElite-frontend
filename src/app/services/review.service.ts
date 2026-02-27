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

    addReview(review: ReviewRequest): Observable<Review> {
        return this.http.post<Review>(this.apiUrl, review);
    }

    getRestaurantReviews(restaurantId: number): Observable<Review[]> {
        return this.http.get<Review[]>(`${this.apiUrl}/restaurant/${restaurantId}`);
    }

    getUserReviews(userId: number): Observable<Review[]> {
        return this.http.get<Review[]>(`${this.apiUrl}/user/${userId}`);
    }
}
