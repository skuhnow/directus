import { Router } from 'express';
import { LocalAuthDriver } from './local';
import { respond } from '../../middleware/respond';
import { AuthDriverOptions, User } from '../../types';
import { getAuthProvider } from '../../auth';
import { AuthenticationService, UsersService } from '../../services';
import { getIPFromReq } from '../../utils/get-ip-from-req';
import logger from '../../logger';
import { InvalidCredentialsException } from '../../exceptions';
import env from '../../env';
import { COOKIE_OPTIONS } from '../../constants';

const { SAML } = require('node-saml');

export class SamlAuthDriver extends LocalAuthDriver {
	saml: any;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);
		this.config = config;

		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.saml = new SAML({
			callbackUrl: config.appEntryUrl,
			entryPoint: config.entryPoint,
			logoutUrl: config.logoutUrl,
			cert: config.cert,
			issuer: config.issuer,
		});
	}

	async getUserID(payload: Record<string, any>): Promise<string> {
		const identifier = payload.uid;
		if (!identifier) {
			logger.trace('[SAML] No UID in payload');
			throw new InvalidCredentialsException();
		}

		const userId = await this.fetchUserId(identifier);
		if (userId) {
			return userId;
		}
		if (payload.companyGroup !== 'servicepartner') {
			logger.error(`Only companyGroup 'servicepartner' is allowed to access the cms.`);
			throw new InvalidCredentialsException();
		}
		const isAdmin = payload.roles.includes('ROLE_ADMIN');
		if (!isAdmin) {
			if (!process.env.SERVICEPARTNER || process.env.SERVICEPARTNER !== payload.companyCode) {
				logger.error(`[SAML] Preset ${process.env.SERVICEPARTNER} does not match companyCode ${payload.companyCode}`);
				throw new InvalidCredentialsException();
			}
		}

		await this.usersService.createOne({
			provider: 'saml',
			first_name: payload.givenName,
			last_name: payload.sn,
			email: payload.email,
			external_identifier: identifier,
			role: await this.resolveRole(payload.roles),
		});

		return (await this.fetchUserId(identifier)) as string;
	}

	private async fetchUserId(identifier: string): Promise<string | undefined> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['external_identifier', identifier.toLowerCase()])
			.first();

		return user?.id;
	}

	private async fetchRoleId(identifier: string): Promise<string | undefined> {
		const role = await this.knex
			.select('id')
			.from('directus_roles')
			.whereRaw('LOWER(??) = ?', ['external_identifier', identifier.toLowerCase()])
			.first();

		return role?.id;
	}

	private async resolveRole(payloadRoles: string[]): Promise<string> {
		let roleId;
		if (payloadRoles.includes('ROLE_ADMIN')) {
			roleId = await this.fetchRoleId('ROLE_ADMIN');
		} else {
			roleId = await this.fetchRoleId('ROLE_USER');
		}

		if (roleId) {
			return roleId;
		}
		throw new InvalidCredentialsException();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async login(user: User): Promise<void> {
		return;
	}

	async logout(user: User): Promise<void> {
		const target = await this.saml.getLogoutUrlAsync(user);
		// TODO: SAML Logout
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

			const authenticationService = new AuthenticationService({
				accountability: {
					ip: getIPFromReq(req),
					userAgent: req.get('user-agent'),
					role: null,
				},
				schema: req.schema,
			});

			let authResponse;
			try {
				res.clearCookie(`saml.${providerName}`);
				authResponse = await authenticationService.login(providerName, profile);
			} catch (error: any) {
				logger.warn(error, `[SAML] Unexpected error during SAML login`);
				throw error;
			}

			const { accessToken, refreshToken, expires } = authResponse;

			const payload = {
				data: { access_token: accessToken, expires },
			} as Record<string, Record<string, any>>;

			res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
			res.locals.payload = payload;

			return res.redirect(provider.config.appEntryUrl);
		},
		respond
	);

	return router;
}
