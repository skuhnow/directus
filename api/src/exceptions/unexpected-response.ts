import { BaseException } from '@skuhnow/directus-shared/exceptions';

export class UnexpectedResponseException extends BaseException {
	constructor(message: string) {
		super(message, 503, 'UNEXPECTED_RESPONSE');
	}
}
