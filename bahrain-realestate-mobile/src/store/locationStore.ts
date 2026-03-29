import { create } from 'zustand';
import api from '../api/api';
import { Governorate, Area, GovernorateListResponse, AreaListResponse } from '../types/location';

interface LocationState {
  governorates: Governorate[];
  areas: Area[];
  isLoading: boolean;
  tempSelectedLocation: { lat: string; lng: string } | null;
  setTempSelectedLocation: (loc: { lat: string; lng: string } | null) => void;
  fetchLocations: () => Promise<void>;
  getLocalizedName: (name: string, type: 'governorate' | 'area', lang: string) => string;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  governorates: [],
  areas: [],
  isLoading: false,
  tempSelectedLocation: null,
  setTempSelectedLocation: (loc) => set({ tempSelectedLocation: loc }),

  fetchLocations: async () => {
    set({ isLoading: true });
    try {
      // Use axios but request raw text so we can safely inspect and parse
      const [govRawRes, areaRawRes] = await Promise.all([
        api.get('/public/governorates', { transformResponse: [(data) => data] }),
        api.get('/public/areas', { transformResponse: [(data) => data] })
      ]);

      const govText = govRawRes.data;
      const areaText = areaRawRes.data;

      // Log small preview of raw text to help debugging without causing
      // additional errors from JSON.stringify on weird objects.
      console.log('[LOC] governorates response (preview):', govText ? govText.slice(0, 1000) : 'EMPTY');
      console.log('[LOC] areas response (preview):', areaText ? areaText.slice(0, 1000) : 'EMPTY');

      let govJson: GovernorateListResponse | null = null;
      let areaJson: AreaListResponse | null = null;

      try {
        govJson = JSON.parse(govText);
      } catch (e) {
        console.error('[LOC] Failed to parse governorates JSON, raw text saved above', e);
      }

      try {
        areaJson = JSON.parse(areaText);
      } catch (e) {
        console.error('[LOC] Failed to parse areas JSON, raw text saved above', e);
      }

      if (govJson && govJson.success && areaJson && areaJson.success) {
        set({
          governorates: Array.isArray(govJson.data) ? govJson.data : [],
          areas: Array.isArray(areaJson.data) ? areaJson.data : [],
          isLoading: false
        });
      } else {
        console.warn('[LOC] governorates/areas response invalid — not setting store');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      set({ isLoading: false });
    }
  },

  getLocalizedName: (name: string, type: 'governorate' | 'area', lang: string) => {
    if (lang === 'en') return name;
    
    const { governorates, areas } = get();
    
    if (type === 'governorate') {
      const gov = governorates.find(g => 
        (g.nameEn && g.nameEn.toLowerCase() === name.toLowerCase()) || 
        (g.name && g.name.toLowerCase() === name.toLowerCase())
      );
      return gov ? gov.nameAr : name;
    } else {
      const area = areas.find(a => 
        (a.nameEn && a.nameEn.toLowerCase() === name.toLowerCase()) || 
        (a.name && a.name.toLowerCase() === name.toLowerCase())
      );
      return area ? area.nameAr : name;
    }
  }
}));
