import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentResponse, AdStats } from '../models/social';

@Injectable({
    providedIn: 'root'
})
export class SocialService {

    constructor(private http: HttpClient) { }

    toggleLike(userId: number, adId: number): Observable<void> {
        return this.http.post<void>(`/api/social/like?userId=${userId}&adId=${adId}`, {});
    }

    addComment(userId: number, adId: number, content: string): Observable<CommentResponse> {
        return this.http.post<CommentResponse>(`/api/social/comment?userId=${userId}&adId=${adId}`, content);
    }

    getComments(adId: number): Observable<CommentResponse[]> {
        return this.http.get<CommentResponse[]>(`/api/social/comments/${adId}`);
    }

    getAdStats(adId: number, userId?: number): Observable<AdStats> {
        let url = `/api/social/ad-stats/${adId}`;
        if (userId) url += `?userId=${userId}`;
        return this.http.get<AdStats>(url);
    }
}
