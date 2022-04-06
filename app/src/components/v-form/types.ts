import { DeepPartial, Field } from '@skuhnow/directus-shared/types';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string;
	hideLabel?: boolean;
	hideLoader?: boolean;
};
