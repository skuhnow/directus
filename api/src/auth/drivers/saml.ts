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
			cert: config.x509Cert,
			signatureAlgorithm: 'sha256',
			issuer: config.issuer,
		});
	}
}

export function createSamlAuthRouter(providerName: string): Router {
	const router = Router();

	router.get(
		'/',
		async (req, res) => {
			const provider = getAuthProvider(providerName) as SamlAuthDriver;
			const url = await provider.saml.getAuthorizeUrlAsync('', req.headers.host);
			return res.redirect(url);
		},
		respond
	);

	return router;
}
