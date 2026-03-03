import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    email = '';
    password = '';
    error = '';
    loading = false;

    constructor(private authService: AuthService, private router: Router) { }

    onSubmit(event: Event) {
        event.preventDefault();
        this.loading = true;
        this.error = '';

        console.log('>>> Attempting login for:', this.email);
        this.authService.login(this.email, this.password).subscribe({
            next: (response) => {
                console.log('>>> Login Success Response:', response);
                const role = this.authService.getRole();
                if (role === 'ADMIN') {
                    this.router.navigate(['/dashboard']);
                } else {
                    this.router.navigate(['/home']);
                }
            },
            error: (err) => {
                console.error('>>> Login Error:', err);
                this.error = 'Invalid email or password';
                this.loading = false;
            }
        });
    }
}
