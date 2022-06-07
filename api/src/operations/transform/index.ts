import { defineOperationApi } from '@skuhnow/directus-shared/utils';
import { parseJSON } from '../../utils/parse-json';

type Options = {
	json: string;
};

export default defineOperationApi<Options>({
	id: 'transform',

	handler: ({ json }) => {
		return parseJSON(json);
	},
});
