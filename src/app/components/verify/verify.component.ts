import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-verify',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="verify-container">
            <div class="verify-card">
                <h2>Email Verification</h2>
                <div *ngIf="loading" class="status">Verifying your account...</div>
                <div *ngIf="success" class="status success">
                    <h3>Success!</h3>
                    <p>Your account has been verified. You can now login.</p>
                    <a routerLink="/login" class="btn">Go to Login</a>
                </div>
                <div *ngIf="error" class="status error">
                    <h3>Verification Failed</h3>
                    <p>{{ error }}</p>
                    <a routerLink="/register" class="btn">Try Registering Again</a>
                </div>
            </div>
        </div>
    `,
    styleUrl: './verify.component.css'
})
export class VerifyComponent implements OnInit {
    loading = true;
    success = false;
    error = '';

    constructor(private route: ActivatedRoute, private http: HttpClient) { }

    ngOnInit() {
        const token = this.route.snapshot.queryParamMap.get('token');
        if (!token) {
            this.error = 'Invalid or missing verification token.';
            this.loading = false;
            return;
        }

        this.http.get(`${environment.apiUrl}/api/verify`, { params: { token }, responseType: 'text' }).subscribe({
            next: () => {
                this.success = true;
                this.loading = false;
            },
            error: (err) => {
                this.error = err.error || 'Verification failed.';
                this.loading = false;
            }
        });
    }
}
