export interface Governorate {
  id: number;
  name?: string;
  nameEn: string;
  nameAr: string;
}

export interface Area {
  id: number;
  name?: string;
  nameEn: string;
  nameAr: string;
  governorateId: number;
}

export interface GovernorateListResponse {
  success: boolean;
  data: Governorate[];
}

export interface AreaListResponse {
  success: boolean;
  data: Area[];
}
