import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { RestaurantService } from '../../services/restaurant.service';
import { FloorPlan3DComponent } from '../floor-plan-3d/floor-plan-3d.component';

@Component({
    selector: 'app-booking',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, FloorPlan3DComponent],
    templateUrl: './booking.component.html',
    styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
    allRestaurants: any[] = [];
    filteredRestaurants: any[] = [];
    recommendedRestaurants: any[] = [];

    // Search & Filter state
    searchQuery: string = '';
    sortBy: string = 'Recommended';
    userLatitude: number | null = null;
    userLongitude: number | null = null;
    locating: boolean = false;

    selectedRestaurantId: number | null = null;
    selectedDate: string = '';
    guestCount: number = 2;
    availableSlots: any[] = [];
    selectedSlotId: number | null = null;
    bookingLoading = false;
    showSuccessPopup = false;

    // Floor Plan selection
    floorTables: any[] = [];
    selectedTableId: number | null = null;
    fetchingTables = false;
    floors: number[] = [1];
    selectedFloor: number = 1;

    reservationTarget: any = null;
    restaurantMenu: any[] = [];
    selectedPreOrders: any[] = [];
    menuLoading = false;

    constructor(
        private bookingService: BookingService,
        public authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private alertService: AlertService,
        private restaurantService: RestaurantService
    ) { }

    ngOnInit() {
        this.loadRestaurants();
        this.loadRecommendations();
        this.route.queryParams.subscribe(params => {
            if (params['reserve']) {
                const resId = +params['reserve'];
                this.preSelectRestaurant(resId);
            }
        });
    }

    preSelectRestaurant(id: number) {
        if (this.allRestaurants.length > 0) {
            const target = this.allRestaurants.find(r => r.id === id);
            if (target) {
                this.openReserver(target);
            }
        } else {
            setTimeout(() => this.preSelectRestaurant(id), 500);
        }
    }

    loadRestaurants() {
        this.bookingService.getRestaurants().subscribe(res => {
            this.allRestaurants = res;
            this.applyFilters();
        });
    }

    loadRecommendations() {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.restaurantService.getPersonalizedRecommendations(user.userId).subscribe(res => {
                this.recommendedRestaurants = res;
            });
        }
    }

    applyFilters() {
        let results = [...this.allRestaurants];

        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            results = results.filter(r =>
                r.name.toLowerCase().includes(query) ||
                r.address.toLowerCase().includes(query)
            );
        }

        if (this.sortBy === 'Deposit: Low to High') {
            results.sort((a, b) => a.depositAmount - b.depositAmount);
        } else if (this.sortBy === 'Name: A-Z') {
            results.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === 'Near Me' && this.userLatitude && this.userLongitude) {
            results.sort((a, b) => {
                const distA = this.calculateDistance(this.userLatitude!, this.userLongitude!, a.latitude, a.longitude);
                const distB = this.calculateDistance(this.userLatitude!, this.userLongitude!, b.latitude, b.longitude);
                return distA - distB;
            });
        }

        this.filteredRestaurants = results;
    }

    locateUser() {
        if (!navigator.geolocation) {
            this.alertService.error('Geolocation is not supported by your browser');
            return;
        }

        this.locating = true;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLatitude = position.coords.latitude;
                this.userLongitude = position.coords.longitude;
                this.sortBy = 'Near Me';
                this.applyFilters();
                this.locating = false;
                this.alertService.success('Found your location!');
            },
            (error) => {
                this.locating = false;
                console.error('Geolocation error', error);
                this.alertService.error('Could not get your location. Please check permissions.');
            }
        );
    }

    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        if (!lat2 || !lon2) return 999999; // Far away if no coordinates
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    openReserver(restaurant: any) {
        this.reservationTarget = restaurant;
        this.selectedRestaurantId = restaurant.id;
        this.availableSlots = [];
        this.selectedSlotId = null;
        this.selectedTableId = null;
        this.floorTables = [];
        this.guestCount = 2;
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.selectedPreOrders = [];
        this.fetchRestaurantMenu(restaurant.id);
        this.onParamsChange();
    }

    fetchRestaurantMenu(restaurantId: number) {
        this.menuLoading = true;
        this.bookingService.getPopularMenu(restaurantId).subscribe({
            next: (menu) => {
                this.restaurantMenu = menu;
                this.menuLoading = false;
            },
            error: () => {
                this.menuLoading = false;
            }
        });
    }

    togglePreOrder(item: any) {
        const index = this.selectedPreOrders.findIndex(p => p.menuId === item.menuId);
        if (index > -1) {
            this.selectedPreOrders.splice(index, 1);
        } else {
            this.selectedPreOrders.push({
                menuId: item.menuId,
                itemName: item.itemName,
                price: item.price,
                quantity: 1
            });
        }
    }

    isPreOrdered(menuId: number): boolean {
        return this.selectedPreOrders.some(p => p.menuId === menuId);
    }

    getPreOrderTotal(): number {
        return this.selectedPreOrders.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    }

    onParamsChange() {
        if (this.selectedRestaurantId && this.selectedDate && this.guestCount > 0) {
            if (this.guestCount > 8) {
                this.alertService.info('Maximum 8 guests allowed per booking.');
                this.guestCount = 8;
                return;
            }

            this.bookingLoading = true;
            this.bookingService.getAvailableSlots(
                this.selectedRestaurantId,
                this.selectedDate,
                this.guestCount
            ).subscribe({
                next: (slots) => {
                    this.availableSlots = slots;
                    this.selectedSlotId = null;
                    this.selectedTableId = null;
                    this.floorTables = [];
                    this.bookingLoading = false;
                },
                error: (err) => {
                    this.bookingLoading = false;
                    this.availableSlots = [];
                    console.error('Error fetching slots', err);
                    this.alertService.error('Failed to load slots.');
                }
            });
        }
    }

    onSlotSelected() {
        if (this.selectedSlotId && this.selectedRestaurantId && this.selectedDate) {
            this.loadFloorPlan();
        } else {
            this.floorTables = [];
            this.selectedTableId = null;
        }
    }

    loadFloorPlan() {
        if (!this.selectedRestaurantId || !this.selectedDate || !this.selectedSlotId) return;

        this.fetchingTables = true;

        // Fetch floors
        this.restaurantService.getFloors(this.selectedRestaurantId).subscribe({
            next: (floors) => {
                this.floors = floors.length > 0 ? floors : [1];
                if (!this.floors.includes(this.selectedFloor)) {
                    this.selectedFloor = this.floors[0];
                }
            },
            error: () => { this.floors = [1]; }
        });

        // Fetch availability
        this.bookingService.getTableAvailability(
            this.selectedRestaurantId,
            this.selectedDate,
            this.selectedSlotId,
            this.guestCount
        ).subscribe({
            next: (tables) => {
                this.floorTables = tables;
                this.selectedTableId = null;
                this.fetchingTables = false;
            },
            error: (err) => {
                console.error('Error fetching table availability', err);
                this.fetchingTables = false;
            }
        });
    }

    on3DTableSelected(tableData: any) {
        if (tableData.isBooked || !tableData.hasCapacity) return;
        this.selectedTableId = this.selectedTableId === tableData.tableId ? null : tableData.tableId;
    }

    onFloorChanged(floor: number) {
        this.selectedFloor = floor;
        this.selectedTableId = null;
    }

    selectFloorTable(table: any) {
        if (table.isBooked || !table.hasCapacity) return;
        this.selectedTableId = this.selectedTableId === table.tableId ? null : table.tableId;
    }

    bookTable() {
        if (this.selectedRestaurantId && this.selectedDate && this.selectedSlotId) {
            this.bookingLoading = true;
            const preOrders = this.selectedPreOrders.map(p => ({
                menuId: p.menuId,
                quantity: p.quantity
            }));

            this.bookingService.createBooking(
                this.selectedRestaurantId,
                this.selectedDate,
                this.selectedSlotId,
                this.guestCount,
                this.selectedTableId || undefined,
                preOrders
            ).subscribe({
                next: (res) => {
                    this.bookingLoading = false;
                    this.reservationTarget = null;
                    this.alertService.success(this.selectedTableId ? 'Table Picked & Booking Confirmed!' : 'Booking Confirmed!');
                    this.router.navigate(['/history']);
                },
                error: (err) => {
                    this.alertService.error('Booking failed: ' + (err.error?.message || 'Unknown error'));
                    this.bookingLoading = false;
                }
            });
        }
    }
}
