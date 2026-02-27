import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { BookingHistory } from '../../models/booking-history';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  bookings: BookingHistory[] = [];
  loading = true;

  constructor(
    private bookingService: BookingService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = user.userId || 1; // Demo fallback

    this.bookingService.getBookingHistory(userId).subscribe({
      next: (data) => {
        this.bookings = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.loading = false;
        this.alertService.error('Could not load booking history.');
      }
    });
  }

  cancelBooking(bookingId: number) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: (res) => {
          this.alertService.success(res.message);
          this.loadHistory();
        },
        error: (err) => {
          this.alertService.error('Cancellation failed: ' + (err.error?.message || 'Check 1-hour policy'));
        }
      });
    }
  }

  getStatusClass(status: string) {
    return {
      'status-confirmed': status === 'CONFIRMED',
      'status-cancelled': status === 'CANCELLED',
      'status-completed': status === 'COMPLETED'
    };
  }
}
