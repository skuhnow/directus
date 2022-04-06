import { defineDisplay } from '@skuhnow/directus-shared/utils';
import { TYPES, LOCAL_TYPES } from '@skuhnow/directus-shared/constants';

export default defineDisplay({
	id: 'raw',
	name: '$t:displays.raw.raw',
	icon: 'code',
	component: ({ value }) => (typeof value === 'string' ? value : JSON.stringify(value)),
	options: [],
	types: TYPES,
	localTypes: LOCAL_TYPES,
});
