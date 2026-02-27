import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    user: any = null;
    selectedDiets: string[] = [];
    loading = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
        if (this.user?.dietaryPreferences) {
            this.selectedDiets = this.user.dietaryPreferences.split(', ').filter((d: string) => d.length > 0);
        }
    }

    toggleDiet(diet: string) {
        if (this.selectedDiets.includes(diet)) {
            this.selectedDiets = this.selectedDiets.filter(d => d !== diet);
        } else {
            this.selectedDiets.push(diet);
        }
    }

    updateDietaryPreferences() {
        this.loading = true;
        const dietStr = this.selectedDiets.join(', ');
        this.authService.updateDietaryPreferences(dietStr).subscribe({
            next: (updatedUser) => {
                this.authService.setUser(updatedUser);
                this.user = updatedUser;
                this.loading = false;
                alert('Dietary preferences updated successfully!');
            },
            error: (err) => {
                console.error('Error updating dietary preferences', err);
                this.loading = false;
                alert('Failed to update preferences.');
            }
        });
    }

    onDeleteAccount() {
        const confirmed = confirm('DANGER: This will PERMANENTLY delete your account and all associated data. This cannot be undone.\n\nAre you absolutely sure?');

        if (confirmed) {
            this.authService.deleteAccount().subscribe({
                next: () => {
                    alert('Account deleted successfully.');
                    window.location.href = '/login';
                },
                error: (err) => {
                    console.error('Error deleting account', err);
                    alert('Failed to delete account. Please try again later.');
                }
            });
        }
    }
}
