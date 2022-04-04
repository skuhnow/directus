import { Router } from 'express';
import { LocalAuthDriver } from './local';
import { respond } from '../../middleware/respond';
import { AuthDriverOptions } from '../../types';
import { getAuthProvider } from '../../auth';
const { SAML } = require('node-saml');

export class SamlAuthDriver extends LocalAuthDriver {
	saml: any;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		this.saml = new SAML({
			callbackUrl: config.callbackUrl,
			entryPoint: config.entryPoint,
			logoutUrl: config.logoutUrl,
			cert: config.cert,
			issuer: config.issuer,
		});
	}
}

export function createSamlAuthRouter(providerName: string): Router {
	const router = Router();

	const bodyParser = require('body-parser');
	const urlencodedParser = bodyParser.urlencoded({ extended: false });

	router.get(
		'/',
		async (req, res) => {
			const provider = getAuthProvider(providerName) as SamlAuthDriver;
			const url = await provider.saml.getAuthorizeUrlAsync();
			return res.redirect(url);
		},
		respond
	);

	router.post(
		'/callback',
		urlencodedParser,
		async (req, res) => {
			const provider = getAuthProvider(providerName) as SamlAuthDriver;

			const { profile } = await provider.saml.validatePostResponseAsync(req.body);

			return res.redirect('https://cms2.prominate-platform.com');
		},
		respond
	);

	return router;
}
