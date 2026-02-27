export interface Restaurant {
    id: number;
    name: string;
    address: string;
    openingTime: string;
    closingTime: string;
    imageUrl: string;
    depositAmount: number;
    description: string;
    houseRules: string;
    cuisine: string;
    latitude?: number;
    longitude?: number;
}

export interface MenuItem {
    menuId: number;
    itemName: string;
    price: number;
    isAvailable: boolean;
}
