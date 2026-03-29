export type IndividualPropertyStatus = 'DRAFT' | 'PENDING_ADMIN' | 'SENT_TO_COMPANIES' | 'ACTIVE' | 'REJECTED' | 'SOLD';
export type IndividualPropertyOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type IndividualPropertyImage = {
  imageUrl: string;
  displayOrder?: number;
  isCover?: boolean;
};

export type IndividualProperty = {
  id: number;
  title?: string | null;
  description: string;
  videoUrl?: string | null;
  type: string;
  purpose: string;
  minimumPrice: string | number;
  governorate: string;
  area: string;
  branch?: string | null;
  images?: IndividualPropertyImage[] | string[];
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  furnishingStatus?: string | null;
  floorsCount?: number | null;
  floorNumber?: number | null;
  livingRooms?: number | null;
  buildingAge?: number | null;
  negotiable?: boolean;
  parkingCount?: number | null;
  condition?: string | null;
  showPhone?: boolean;
  enableWhatsapp?: boolean;
  status: IndividualPropertyStatus;
  createdAt: string;
  updatedAt: string;
};

export type IndividualPropertyOffer = {
  id: number;
  companyId: number;
  propertyId: number;
  companyPrice?: string | number | null;
  status: IndividualPropertyOfferStatus;
  createdAt: string;
  updatedAt: string;
  property: IndividualProperty;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};
