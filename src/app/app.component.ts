import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { GlobalAlertComponent } from './components/global-alert/global-alert.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, GlobalAlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  unreadCount: number = 0;
  isLoginPage: boolean = false;
  isMobileMenuOpen: boolean = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Initial check
    this.isLoginPage = this.router.url.includes('/login');

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginPage = event.urlAfterRedirects.includes('/login');
      this.isMobileMenuOpen = false; // Close menu on navigation
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.role === 'ADMIN') {
        this.fetchUnreadCount();
        // Poll every 30 seconds for new notifications
        setInterval(() => this.fetchUnreadCount(), 30000);
      } else {
        this.unreadCount = 0;
      }
    });
  }

  fetchUnreadCount() {
    this.notificationService.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        // Even if server logout fails, clear local and redirect
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
      }
    });
  }
}
