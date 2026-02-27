import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
    styles: [`
        .verify-container {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 20px;
        }
        .verify-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 450px;
            text-align: center;
        }
        .status { margin-top: 20px; font-size: 18px; }
        .success { color: #4ade80; }
        .error { color: #f87171; }
        .btn {
            display: inline-block;
            margin-top: 30px;
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
        }
    `]
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

        this.http.get('/api/verify', { params: { token }, responseType: 'text' }).subscribe({
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
