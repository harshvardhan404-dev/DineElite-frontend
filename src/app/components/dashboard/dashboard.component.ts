import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { RestaurantService } from '../../services/restaurant.service';
import { AdvertisementService } from '../../services/advertisement.service';
import { NotificationService } from '../../services/notification.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { MediaType } from '../../models/advertisement';
import { DashboardAnalytics } from '../../models/analytics';
import { Review } from '../../models/review';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    activeTab = 'analytics';
    restaurant: any = {};
    totalBookings: number = 0;
    peakSlot: string = 'N/A';
    revenue: number = 0;
    utilization: number = 0;
    dailyTrends: any[] = [];
    slotUtilizations: any[] = [];
    menuItems: any[] = [];
    myAds: any[] = [];
    reviews: Review[] = [];
    unreadNotifications: number = 0;
    notifications: any[] = [];
    bookingHeatmap: any[] = []; // Heatmap grid data
    dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    timeSlots: string[] = [];
    isLoading = true;

    // Floor Plan state
    floorTables: any[] = [];
    selectedTable: any = null;
    isDragging = false;
    dragOffset = { x: 0, y: 0 };
    floorPlanSaving = false;
    floorPlanDirty = false;
    showAddTableForm = false;
    newTableData = { capacity: 2, shape: 'round', tableLabel: '' };

    newAd: any = {
        mediaType: MediaType.POST,
        mediaUrl: '',
        caption: ''
    };

    @ViewChild('floorCanvas') floorCanvas!: ElementRef;

    constructor(
        private bookingService: BookingService,
        private restaurantService: RestaurantService,
        private adService: AdvertisementService,
        private notificationService: NotificationService,
        private reviewService: ReviewService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            if (user && user.role === 'ADMIN') {
                this.restaurantService.getRestaurantByAdmin(user.userId).subscribe({
                    next: (data) => {
                        this.restaurant = data;
                        this.loadStats(this.restaurant.id);
                        this.loadMenu(this.restaurant.id);
                        this.loadMyAds(this.restaurant.id);
                        this.loadReviews(this.restaurant.id);
                        this.loadNotifications();
                    },
                    error: (err) => console.error('Error fetching restaurant', err)
                });
            } else {
                const fallbackUserId = 2;
                this.restaurantService.getRestaurantByAdmin(fallbackUserId).subscribe({
                    next: (data) => {
                        this.restaurant = data;
                        this.loadStats(this.restaurant.id);
                        this.loadMenu(this.restaurant.id);
                        this.loadMyAds(this.restaurant.id);
                        this.loadReviews(this.restaurant.id);
                        this.loadNotifications();
                    }
                });
            }
        });
    }

    loadNotifications() {
        this.notificationService.getNotifications().subscribe(notes => {
            this.notifications = notes;
            this.unreadNotifications = notes.filter((n: any) => !n.isRead).length;
        });
    }

    markAsRead(note: any) {
        if (!note.isRead) {
            this.notificationService.markAsRead(note.notificationId).subscribe(() => {
                note.isRead = true;
                this.unreadNotifications--;
            });
        }
    }

    loadStats(restaurantId: number) {
        this.isLoading = true;
        this.bookingService.getDashboardAnalytics(restaurantId).subscribe({
            next: (stats) => {
                this.totalBookings = stats.totalBookings;
                this.peakSlot = stats.peakSlot;
                this.revenue = stats.totalRevenue;
                this.utilization = Math.round(stats.averageUtilization);
                this.dailyTrends = stats.dailyTrends;
                this.slotUtilizations = stats.slotUtilizations;
                this.timeSlots = [...new Set(stats.bookingHeatmap.map(h => h.slotTime))].sort();
                this.bookingHeatmap = stats.bookingHeatmap;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching analytics', err);
                this.isLoading = false;
            }
        });
    }

    getMaxTrend() {
        if (!this.dailyTrends || this.dailyTrends.length === 0) return 1;
        return Math.max(...this.dailyTrends.map(t => t.count));
    }

    setTab(tab: string) {
        this.activeTab = tab;
        if (tab === 'floor-plan' && this.restaurant?.id) {
            this.loadFloorPlan();
        }
        if (tab === 'notifications' && this.authService.getCurrentUser()) {
            this.loadNotifications();
        }
    }

    // ========================
    // FLOOR PLAN METHODS
    // ========================

    loadFloorPlan() {
        if (!this.restaurant?.id) return;
        this.restaurantService.getTableLayout(this.restaurant.id).subscribe({
            next: (tables) => {
                // Assign default positions in a grid if not set
                this.floorTables = tables.map((t: any, i: number) => ({
                    ...t,
                    posX: t.posX || (80 + (i % 5) * 140),
                    posY: t.posY || (80 + Math.floor(i / 5) * 140)
                }));
                this.floorPlanDirty = false;
            },
            error: (err) => console.error('Error loading floor plan', err)
        });
    }

    onTableMouseDown(event: MouseEvent, table: any) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
        this.selectedTable = table;

        const canvasEl = this.floorCanvas?.nativeElement;
        const rect = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0 };
        this.dragOffset = {
            x: event.clientX - rect.left - table.posX,
            y: event.clientY - rect.top - table.posY
        };
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.isDragging || !this.selectedTable) return;

        const canvasEl = this.floorCanvas?.nativeElement;
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();

        let newX = event.clientX - rect.left - this.dragOffset.x;
        let newY = event.clientY - rect.top - this.dragOffset.y;

        // Clamp to canvas bounds
        const tableSize = this.getTableSize(this.selectedTable);
        newX = Math.max(0, Math.min(newX, rect.width - tableSize.w));
        newY = Math.max(0, Math.min(newY, rect.height - tableSize.h));

        this.selectedTable.posX = Math.round(newX);
        this.selectedTable.posY = Math.round(newY);
        this.floorPlanDirty = true;
    }

    @HostListener('document:mouseup')
    onMouseUp() {
        this.isDragging = false;
    }

    getTableSize(table: any): { w: number; h: number } {
        const shape = table.shape || 'round';
        if (shape === 'rectangle') return { w: 120, h: 70 };
        return { w: 80, h: 80 };
    }

    getHeatmapIntensity(dayIndex: number, slotTime: string): number {
        const found = this.bookingHeatmap.find(h => h.dayOfWeek === dayIndex && h.slotTime === slotTime);
        if (!found) return 0;
        // Map count to 1-4 intensity level
        if (found.count > 10) return 4;
        if (found.count > 5) return 3;
        if (found.count > 2) return 2;
        if (found.count > 0) return 1;
        return 0;
    }

    getHeatmapCount(dayIndex: number, slotTime: string): number {
        const found = this.bookingHeatmap.find(h => h.dayOfWeek === dayIndex && h.slotTime === slotTime);
        return found ? found.count : 0;
    }

    selectTable(table: any) {
        this.selectedTable = table;
    }

    deselectTable() {
        if (!this.isDragging) {
            this.selectedTable = null;
        }
    }

    saveFloorPlan() {
        if (!this.restaurant?.id) return;
        this.floorPlanSaving = true;
        const updates = this.floorTables.map(t => ({
            tableId: t.tableId,
            posX: t.posX,
            posY: t.posY,
            tableLabel: t.tableLabel,
            shape: t.shape,
            capacity: t.capacity
        }));
        this.restaurantService.saveTableLayout(this.restaurant.id, updates).subscribe({
            next: () => {
                this.floorPlanSaving = false;
                this.floorPlanDirty = false;
            },
            error: (err) => {
                console.error('Error saving floor plan', err);
                this.floorPlanSaving = false;
            }
        });
    }

    addNewTable() {
        if (!this.restaurant?.id) return;
        const label = this.newTableData.tableLabel || 'T' + (this.floorTables.length + 1);
        const tablePayload = {
            capacity: this.newTableData.capacity,
            shape: this.newTableData.shape,
            tableLabel: label,
            posX: 60 + Math.random() * 200,
            posY: 60 + Math.random() * 200
        };
        this.restaurantService.addTable(this.restaurant.id, tablePayload).subscribe({
            next: (saved) => {
                this.floorTables.push(saved);
                this.showAddTableForm = false;
                this.newTableData = { capacity: 2, shape: 'round', tableLabel: '' };
            },
            error: (err) => console.error('Error adding table', err)
        });
    }

    deleteTableFromPlan(table: any) {
        if (!confirm(`Delete table "${table.tableLabel}"? This cannot be undone.`)) return;
        this.restaurantService.deleteTable(table.tableId).subscribe({
            next: () => {
                this.floorTables = this.floorTables.filter(t => t.tableId !== table.tableId);
                if (this.selectedTable?.tableId === table.tableId) {
                    this.selectedTable = null;
                }
            },
            error: (err) => console.error('Error deleting table', err)
        });
    }

    getShapeClass(table: any): string {
        return 'table-shape-' + (table.shape || 'round');
    }

    getCapacityIcon(capacity: number): string {
        if (capacity <= 2) return '👤👤';
        if (capacity <= 4) return '👥';
        if (capacity <= 6) return '👥👥';
        return '👥👥👥';
    }

    // ========================
    // EXISTING METHODS
    // ========================

    updateProfile() {
        this.restaurantService.updateRestaurant(this.restaurant.id, this.restaurant).subscribe({
            next: (updated) => {
                this.restaurant = updated;
                alert('Profile updated successfully!');
            },
            error: (err) => alert('Error updating profile')
        });
    }

    postAd() {
        if (!this.restaurant?.id) {
            alert('Error: Restaurant ID not loaded. Please refresh.');
            return;
        }
        if (!this.newAd.mediaUrl) {
            alert('Please provide a Media URL.');
            return;
        }

        const adData = {
            restaurantId: this.restaurant.id || this.restaurant.restaurantId,
            mediaUrl: this.newAd.mediaUrl.trim(),
            mediaType: this.newAd.mediaType,
            caption: this.newAd.caption.trim()
        };

        console.log('>>> Posting Ad:', adData);

        this.adService.createAdvertisement(adData).subscribe({
            next: () => {
                alert('Advertisement published successfully!');
                this.newAd = { mediaType: MediaType.POST, mediaUrl: '', caption: '' };
                this.loadMyAds(this.restaurant.id);
                this.activeTab = 'my-posts';
            },
            error: (err) => {
                console.error('Error publishing ad', err);
                alert('Error publishing advertisement: ' + (err.error?.message || err.message || 'Server error'));
            }
        });
    }

    loadMenu(restaurantId: number) {
        this.bookingService.getPopularMenu(restaurantId).subscribe(items => {
            this.menuItems = items;
        });
    }

    loadMyAds(restaurantId: number) {
        this.adService.getRestaurantAdvertisements(restaurantId).subscribe({
            next: (ads) => {
                this.myAds = ads;
            },
            error: (err) => console.error('Error loading your ads', err)
        });
    }

    loadReviews(restaurantId: number) {
        this.reviewService.getRestaurantReviews(restaurantId).subscribe({
            next: (data) => {
                this.reviews = data;
            },
            error: (err) => console.error('Error loading reviews', err)
        });
    }

    addMenuItem() {
        const newItem = {
            itemName: 'New Item',
            price: 0,
            isAvailable: true
        };
        const name = prompt('Enter item name:');
        if (!name) return;
        const price = parseFloat(prompt('Enter price:') || '0');

        const payload = { ...newItem, itemName: name, price: price };

        this.restaurantService.addMenuItem(this.restaurant.id, payload).subscribe(() => {
            this.loadMenu(this.restaurant.id);
        });
    }

    updateMenuItem(item: any) {
        this.restaurantService.updateMenuItem(item.menuId, item).subscribe(() => {
            alert('Menu item updated!');
        });
    }

    deleteMenuItem(menuId: number) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.restaurantService.deleteMenuItem(menuId).subscribe(() => {
                this.loadMenu(this.restaurant.id);
            });
        }
    }
}
