import { defineOperationApi, parseJSON } from '@skuhnow/directus-shared/utils';

type Options = {
	json: string;
};

export default defineOperationApi<Options>({
	id: 'transform',

	handler: ({ json }) => {
		return parseJSON(json);
	},
});
