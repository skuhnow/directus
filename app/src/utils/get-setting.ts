import { useSettingsStore } from '@/stores';
import { Settings } from '@skuhnow/directus-shared/types';

export default function getSetting(setting: keyof Settings): any {
	const settingsStore = useSettingsStore();
	if (settingsStore.settings) return settingsStore.settings[setting];
	return null;
}
