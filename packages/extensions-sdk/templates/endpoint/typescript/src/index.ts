import { defineEndpoint } from '@skuhnow/directus-extensions-sdk';

export default defineEndpoint((router) => {
	router.get('/', (_req, res) => res.send('Hello, World!'));
});
