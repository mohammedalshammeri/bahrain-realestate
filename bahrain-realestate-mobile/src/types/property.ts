export interface PropertyImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
  isVideo?: boolean;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Property {
  id: number;
  type: string;
  purpose: 'sale' | 'rent';
  price: string; // Decimal is returned as string usually in JSON
  title?: string;
  governorate: string;
  area: string;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  isFeatured: boolean;
  isFeaturedPlus?: boolean;
  featuredExpiresAt?: string;
  // تاريخ انتهاء الإعلان (موجود في الـ backend لكن كان غير معرف هنا)
  expiresAt?: string;
  status: string;
  showPhoneNumber?: boolean;
  enableWhatsApp?: boolean;
  rejectionReason?: string;
  rejectReason?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
  company: Company;
  propertyImages: PropertyImage[];
  // Some endpoints may return flattened image URLs
  images?: string[];
  imageUrl?: string;
}

export interface PropertyListResponse {
  success: boolean;
  data: Property[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    pages: number;
  };
}

export interface PropertyDetailsResponse {
  success: boolean;
  data: Property;
}
