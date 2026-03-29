import { I18nManager, Platform } from 'react-native';

const getIsRTL = () => {
	if (Platform.OS === 'web') {
		try {
			const doc = (globalThis as any)?.document;
			const dir = doc?.documentElement?.dir || doc?.body?.dir;
			if (dir) return dir === 'rtl';

			const lang = doc?.documentElement?.lang || doc?.body?.lang;
			if (lang) {
				const base = String(lang).toLowerCase().split('-')[0];
				return ['ar', 'he', 'fa', 'ur'].includes(base);
			}
		} catch {
			return false;
		}
	}

	return I18nManager.isRTL;
};

export const isRTL = () => getIsRTL();

export const rowDirection = () => (getIsRTL() ? 'row-reverse' : 'row');

export const alignStart = () => (getIsRTL() ? 'flex-end' : 'flex-start');

export const alignEnd = () => (getIsRTL() ? 'flex-start' : 'flex-end');

export const textAlignStart = () => (getIsRTL() ? 'right' : 'left');
