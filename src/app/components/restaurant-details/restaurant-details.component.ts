import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { MenuItem } from '../../models/restaurant-detail';
import { Review, ReviewRequest } from '../../models/review';

@Component({
    selector: 'app-restaurant-details',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './restaurant-details.component.html',
    styleUrl: './restaurant-details.component.css'
})
export class RestaurantDetailsComponent implements OnInit {
    restaurant: any;
    menuItems: MenuItem[] = [];
    reviews: Review[] = [];
    loading = true;
    isSubmitting = false;

    newReview: ReviewRequest = {
        userId: 0,
        restaurantId: 0,
        rating: 5,
        content: '',
        photoUrls: []
    };
    newPhotoUrl = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private bookingService: BookingService,
        private reviewService: ReviewService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const restaurantId = +id;
            this.loadRestaurantData(restaurantId);
            this.loadReviews(restaurantId);

            const user = this.authService.getCurrentUser();
            if (user) {
                this.newReview.userId = user.userId;
                this.newReview.restaurantId = restaurantId;
            }
        }
    }

    loadRestaurantData(id: number): void {
        this.bookingService.getRestaurants().subscribe(list => {
            this.restaurant = list.find(r => r.id === id);
            if (this.restaurant) {
                this.loadMenu(id);
            } else {
                this.router.navigate(['/booking']);
            }
        });
    }

    loadMenu(id: number): void {
        this.bookingService.getPopularMenu(id).subscribe({
            next: (items) => {
                this.menuItems = items;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadReviews(id: number): void {
        this.reviewService.getRestaurantReviews(id).subscribe({
            next: (data) => {
                this.reviews = data;
            },
            error: (err) => console.error('Error loading reviews', err)
        });
    }

    addPhotoUrl(): void {
        if (this.newPhotoUrl.trim()) {
            this.newReview.photoUrls.push(this.newPhotoUrl.trim());
            this.newPhotoUrl = '';
        }
    }

    removePhotoUrl(index: number): void {
        this.newReview.photoUrls.splice(index, 1);
    }

    submitReview(): void {
        if (!this.authService.isLoggedIn()) {
            alert('Please login to submit a review');
            return;
        }

        if (!this.newReview.content.trim()) {
            alert('Please write some content for your review');
            return;
        }

        this.isSubmitting = true;
        this.reviewService.addReview(this.newReview).subscribe({
            next: (savedReview) => {
                this.reviews.unshift(savedReview);
                this.isSubmitting = false;
                this.newReview.content = '';
                this.newReview.photoUrls = [];
                this.newReview.rating = 5;
                alert('Review submitted successfully!');
            },
            error: (err) => {
                console.error('Error submitting review', err);
                this.isSubmitting = false;
                alert('Failed to submit review. Please try again.');
            }
        });
    }

    bookNow(): void {
        this.router.navigate(['/booking'], { queryParams: { reserve: this.restaurant.id } });
    }
}

