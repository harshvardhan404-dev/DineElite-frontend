import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUserSubject.next(JSON.parse(savedUser));
        }
    }

    login(email: string, password: string): Observable<any> {
        const body = new HttpParams()
            .set('username', email)
            .set('password', password);

        return this.http.post('/api/login', body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).pipe(
            switchMap(() => this.fetchMe())
        );
    }

    fetchMe(): Observable<any> {
        return this.http.get('/api/user/me').pipe(
            tap(user => this.setUser(user))
        );
    }

    register(user: any): Observable<any> {
        return this.http.post('/api/register', user, { responseType: 'text' });
    }

    logout() {
        return this.http.post('/api/logout', {}).pipe(
            tap(() => {
                localStorage.removeItem('currentUser');
                this.currentUserSubject.next(null);
            })
        );
    }

    updateDietaryPreferences(dietaryPreferences: string): Observable<any> {
        return this.http.put('/api/user/dietary', dietaryPreferences);
    }

    deleteAccount(): Observable<any> {
        return this.http.delete('/api/user', { responseType: 'text' }).pipe(
            tap(() => {
                localStorage.removeItem('currentUser');
                this.currentUserSubject.next(null);
            })
        );
    }

    setUser(user: any) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
    }

    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    getRole(): string {
        return this.currentUserSubject.value?.role || '';
    }

    getCurrentUser(): any {
        return this.currentUserSubject.value;
    }
}
