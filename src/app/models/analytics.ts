export interface DailyTrend {
    date: string;
    count: number;
}

export interface SlotUtilization {
    slotTime: string;
    utilizationPercentage: number;
}

export interface HeatmapData {
    dayOfWeek: number;
    slotTime: string;
    count: number;
}

export interface DashboardAnalytics {
    totalBookings: number;
    peakSlot: string;
    totalRevenue: number;
    averageUtilization: number;
    dailyTrends: DailyTrend[];
    slotUtilizations: SlotUtilization[];
    bookingHeatmap: HeatmapData[];
}
