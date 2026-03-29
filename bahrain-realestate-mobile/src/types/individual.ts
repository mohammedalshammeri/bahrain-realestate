export type IndividualUser = {
  id: number;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type IndividualPropertyImage = {
  id: number;
  imageUrl: string;
  displayOrder: number;
  isCover: boolean;
};

export type IndividualOfferCompany = {
  id: number;
  name: string;
};

export type IndividualPropertyOffer = {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  companyPrice?: string | number | null;
  company: IndividualOfferCompany;
};

export type IndividualPropertySubmission = {
  id: number;
  title?: string | null;
  description: string;
  type: string;
  purpose: string;
  minimumPrice: string | number;
  governorate: string;
  area: string;
  branch?: string | null;
  status: 'DRAFT' | 'PENDING_ADMIN' | 'SENT_TO_COMPANIES' | 'ACTIVE' | 'REJECTED';
  adminRejectionReason?: string | null;
  locationLat?: string | number | null;
  locationLng?: string | number | null;
  images?: IndividualPropertyImage[];
  createdAt: string;
  updatedAt: string;
  offers: IndividualPropertyOffer[];
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};
