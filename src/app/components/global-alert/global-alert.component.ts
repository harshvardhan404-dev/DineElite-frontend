import { Component, OnInit } from '@angular/core';
import { AlertService, Alert } from '../../services/alert.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-global-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="alert" class="alert-overlay">
      <div class="alert-box glass animate-pop" [ngClass]="alert.type">
        <div class="alert-icon">
          <span *ngIf="alert.type === 'success'">✅</span>
          <span *ngIf="alert.type === 'error'">⚠️</span>
          <span *ngIf="alert.type === 'info'">ℹ️</span>
        </div>
        <div class="alert-content">
          <h3>{{ getTitle(alert.type) }}</h3>
          <p>{{ alert.message }}</p>
        </div>
        <button class="btn-done" (click)="close()">Done</button>
      </div>
    </div>
  `,
  styles: [`
    .alert-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .alert-box {
      background: #1a1a1a;
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      min-width: 320px;
      max-width: 90%;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }

    .animate-pop {
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .alert-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }

    .alert-content h3 {
      font-size: 1.5rem;
      margin-bottom: 10px;
      text-transform: capitalize;
      color: white;
    }

    .alert-content p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 25px;
      line-height: 1.5;
    }

    .btn-done {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s;
    }

    .btn-done:hover {
      transform: scale(1.05);
    }

    /* Type specific styles */
    .success .alert-content h3 { color: #4ade80; }
    .error .alert-content h3 { color: #f87171; }
    .info .alert-content h3 { color: #60a5fa; }
  `]
})
export class GlobalAlertComponent implements OnInit {
  alert: Alert | null = null;

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.alertService.alert$.subscribe(alert => {
      console.log('Global Alert Received:', alert);
      this.alert = alert;
      // Auto close after 5 seconds
      if (alert) {
        setTimeout(() => this.close(), 5000);
      }
    });
  }

  getTitle(type: string): string {
    if (type === 'success') return 'Success';
    if (type === 'error') return 'Oops!';
    return 'Note';
  }

  close() {
    this.alertService.clear();
  }
}
