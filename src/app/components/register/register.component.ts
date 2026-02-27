import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent {
    fullName = '';
    email = '';
    password = '';
    role = 'CUSTOMER';

    // Restaurant Profile Fields
    restaurantName = '';
    restaurantAddress = '';
    openingTime = '09:00';
    closingTime = '22:00';
    restaurantImageUrl = '';
    restaurantDescription = '';

    selectedDiets: string[] = [];

    message = '';
    error = '';
    loading = false;

    constructor(private authService: AuthService, private router: Router) { }

    toggleDiet(diet: string) {
        if (this.selectedDiets.includes(diet)) {
            this.selectedDiets = this.selectedDiets.filter(d => d !== diet);
        } else {
            this.selectedDiets.push(diet);
        }
    }

    onSubmit(event: Event) {
        event.preventDefault();
        this.loading = true;
        this.error = '';
        this.message = '';

        const user: any = {
            fullName: this.fullName,
            email: this.email,
            password: this.password,
            role: this.role,
            dietaryPreferences: this.selectedDiets.join(', ')
        };

        if (this.role === 'ADMIN') {
            user.restaurantName = this.restaurantName;
            user.restaurantAddress = this.restaurantAddress;
            user.openingTime = this.openingTime;
            user.closingTime = this.closingTime;
            user.restaurantImageUrl = this.restaurantImageUrl;
            user.restaurantDescription = this.restaurantDescription;
        }

        this.authService.register(user).subscribe({
            next: (res) => {
                this.message = res;
                this.loading = false;
                setTimeout(() => this.router.navigate(['/login']), 5000);
            },
            error: (err) => {
                this.error = err.error || 'Registration failed';
                this.loading = false;
            }
        });
    }
}
