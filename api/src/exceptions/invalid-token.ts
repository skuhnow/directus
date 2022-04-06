import { BaseException } from '@skuhnow/directus-shared/exceptions';

export class InvalidTokenException extends BaseException {
	constructor(message = 'Invalid token') {
		super(message, 403, 'INVALID_TOKEN');
	}
}
