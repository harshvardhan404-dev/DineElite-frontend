import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvertisementService } from '../../services/advertisement.service';
import { Advertisement } from '../../models/advertisement';
import { SocialService } from '../../services/social.service';
import { AuthService } from '../../services/auth.service';
import { CommentResponse } from '../../models/social';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-advertisement-feed',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './advertisement-feed.component.html',
    styleUrls: ['./advertisement-feed.component.css']
})
export class AdvertisementFeedComponent implements OnInit {
    advertisements: any[] = [];
    currentUser: any = null;

    constructor(
        private adService: AdvertisementService,
        private socialService: SocialService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.currentUser = this.authService.getCurrentUser();
        this.loadAdvertisements();
    }

    loadAdvertisements(): void {
        this.adService.getAllAdvertisements().subscribe({
            next: (data) => {
                this.advertisements = data.map(ad => ({
                    ...ad,
                    likes: 0,
                    isLiked: false,
                    comments: [],
                    showComments: false,
                    newComment: ''
                }));
                this.fetchStats();
            },
            error: (err) => {
                console.error('Error fetching advertisements', err);
            }
        });
    }

    fetchStats(): void {
        this.advertisements.forEach(ad => {
            this.socialService.getAdStats(ad.adId, this.currentUser?.userId).subscribe(stats => {
                ad.likes = stats.likes;
                ad.isLiked = stats.isLiked;
            });
            this.socialService.getComments(ad.adId).subscribe(comments => {
                ad.comments = comments;
            });
        });
    }

    toggleLike(ad: any): void {
        if (!this.currentUser) {
            alert('Please login to like posts');
            return;
        }
        this.socialService.toggleLike(this.currentUser.userId, ad.adId).subscribe(() => {
            ad.isLiked = !ad.isLiked;
            ad.likes += ad.isLiked ? 1 : -1;
        });
    }

    addComment(ad: any): void {
        if (!this.currentUser) {
            alert('Please login to comment');
            return;
        }
        if (!ad.newComment.trim()) return;

        this.socialService.addComment(this.currentUser.userId, ad.adId, ad.newComment).subscribe(comment => {
            ad.comments.unshift(comment);
            ad.newComment = '';
        });
    }

    toggleCommentSection(ad: any): void {
        ad.showComments = !ad.showComments;
    }

    openAd(ad: Advertisement): void {
        console.log('Opening ad', ad);
    }
}
