import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { RecommendationService } from '../../services/recommendation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  dishes: any[] = [];
  loading = false;

  constructor(public authService: AuthService, private recommendationService: RecommendationService) { }

  ngOnInit() {
    if (this.getRole() === 'CUSTOMER' || this.getRole() === 'USER') {
      this.fetchDishRecommendations();
    }
  }

  fetchDishRecommendations() {
    this.loading = true;
    this.recommendationService.getDishRecommendations().subscribe({
      next: (data) => {
        this.dishes = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getRole(): string {
    return this.authService.getRole();
  }
}
