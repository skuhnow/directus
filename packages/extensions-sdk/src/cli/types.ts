import { EXTENSION_LANGUAGES } from '@skuhnow/directus-shared/constants';

export type Language = typeof EXTENSION_LANGUAGES[number];
export type LanguageShort = 'js' | 'ts';
