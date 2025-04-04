import { ApiRequest, CodeChallengeObject, CredentialConfigurationObject, IssuerObject, IssuerConfigurationObject } from "../../types/data";
import i18n from "i18next";
import { api as originalApi, MethodType } from '../../utils/api';

type ApiModule = {
  api: typeof originalApi;
  MethodType: typeof MethodType;
};

describe('Testing API Class', () => {
  let apiModule: ApiModule;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, BASE_URL: 'https://example.com' };

    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://api.collab.mossip.net'
      },
      writable: true
    });

    Object.defineProperty(window, "_env_", {
        value: {
            MIMOTO_HOST: "https://api.collab.mossip.net/v1/mimoto"
        },
        writable: true
    });

    jest.resetModules();
    apiModule = require('../../utils/api') as ApiModule;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('Check mimotoHost property', () => {
    expect(apiModule.api.mimotoHost).toBe('https://api.collab.mossip.net/v1/mimoto');
  });

  test('Check authorizationRedirectionUrl property', () => {
    expect(apiModule.api.authorizationRedirectionUrl).toBe('https://api.collab.mossip.net/redirect');
  });

  test('Check fetchIssuers request', () => {
    const fetchIssuers: ApiRequest = apiModule.api.fetchIssuers;
    expect(fetchIssuers.url()).toBe('https://api.collab.mossip.net/v1/mimoto/issuers');
    expect(fetchIssuers.methodType).toBe(apiModule.MethodType.GET);
    expect(fetchIssuers.headers()).toEqual({
      'Content-Type': 'application/json'
    });
  });

  test('Check fetchSpecificIssuer request', () => {
    const issuerId = '123';
    const fetchSpecificIssuer: ApiRequest = apiModule.api.fetchSpecificIssuer;
    expect(fetchSpecificIssuer.url(issuerId)).toBe('https://api.collab.mossip.net/v1/mimoto/issuers/123');
    expect(fetchSpecificIssuer.methodType).toBe(apiModule.MethodType.GET);
    expect(fetchSpecificIssuer.headers()).toEqual({
      'Content-Type': 'application/json'
    });
  });

  test('Check fetchIssuersWellknown request', () => {
    const issuerId = '123';
    const fetchIssuersConfig: ApiRequest = apiModule.api.fetchIssuersConfiguration;
    expect(fetchIssuersConfig.url(issuerId)).toBe('https://api.collab.mossip.net/v1/mimoto/issuers/123/configuration');
    expect(fetchIssuersConfig.methodType).toBe(apiModule.MethodType.GET);
    expect(fetchIssuersConfig.headers()).toEqual({
      'Content-Type': 'application/json'
    });
  });

  test('Check fetchTokenAnddownloadVc request', () => {
    const fetchTokenAnddownloadVc: ApiRequest = apiModule.api.fetchTokenAnddownloadVc;
    expect(fetchTokenAnddownloadVc.url()).toBe('https://api.collab.mossip.net/v1/mimoto/credentials/download');
    expect(fetchTokenAnddownloadVc.methodType).toBe(apiModule.MethodType.POST);
    expect(fetchTokenAnddownloadVc.headers()).toEqual({
      'accept': 'application/pdf',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
  });

  test('Check authorization URL generation', () => {
    const currentIssuer: IssuerObject = {
      name: 'Issuer Name',
      desc: 'Issuer Description',
      protocol: 'OpenId4VCI',
      issuer_id: 'issuer123',
      authorization_endpoint: 'http://auth.server/authorize',
      credentials_endpoint: 'http://credentials.endpoint',
      display: [
        {
          name: 'Issuer Display Name',
          language: 'en',
          locale: 'en-US',
          logo: { url: 'http://example.com/logo.png', alt_text:'Logo' },
          title: 'Issuer Title',
          description: 'Description of the issuer'
        }
      ],
      client_id: 'client123',
      redirect_uri: 'https://api.collab.mossip.net/redirect',
      token_endpoint: 'http://token.endpoint',
      proxy_token_endpoint: 'http://proxy.token.endpoint',
      client_alias: 'clientAlias',
      ovp_qr_enabled: true,
      scopes_supported: ['openid', 'profile']
    };

    const credentialWellknown: IssuerConfigurationObject = {
        credentials_supported: [
            {
                name: "InsuranceCredential",
                scope: "mosip_vc_ldp",
                display: [
                    {
                        name: "Health Insurance",
                        locale: "en",
                        logo: "https://url.com"
                    }
                ]
            },
            {
                name: "AnotherCredential",
                scope: "mosip_ldp_vc",
                display: [
                    {
                        name: "Another Credential",
                        locale: "en",
                        logo: "https://url.com"
                    }
                ]
            }
        ],
        "authorization_endpoint": "https://env.net/authorize",
        "grant_types_supported": ["authorization_code"]
    };

    const filterCredentialWellknown: CredentialConfigurationObject = {
      name: "InsuranceCredential",
      scope: 'openid',
      display: [
        {
          name: 'Credential Name',
          locale: 'en-US',
          logo: 'http://example.com/logo.png',
        }
      ],
    };

    const state = 'state123';
    const code_challenge: CodeChallengeObject = {
      codeChallenge: 'challenge123',
      codeVerifier: 'verifier123'
    };

    const url = apiModule.api.authorization(
      currentIssuer,
      filterCredentialWellknown,
      state,
      code_challenge,
      'http://auth.server/authorize'
    );
    expect(url).toBe(
      'http://auth.server/authorize' +
      '?response_type=code&' +
      'client_id=client123&' +
      'scope=openid&' +
      `redirect_uri=https://api.collab.mossip.net/redirect&` +
      'state=state123&' +
      'code_challenge=challenge123&' +
      'code_challenge_method=S256&' +
      'ui_locales=' + i18n.language
    );
  });
});