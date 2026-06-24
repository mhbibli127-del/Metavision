export type SamlConfig = {
  entryPoint: string;
  issuer: string;
  cert: string;
  callbackUrl: string;
};

export function getSamlConfig(): SamlConfig | null {
  const entryPoint = process.env.SAML_ENTRY_POINT;
  const issuer = process.env.SAML_ISSUER ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cert = process.env.SAML_IDP_CERT;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!entryPoint || !cert) return null;
  return {
    entryPoint,
    issuer,
    cert: cert.replace(/\\n/g, "\n"),
    callbackUrl: `${appUrl}/api/auth/sso/saml/callback`,
  };
}

export function buildSamlLoginUrl(config: SamlConfig): string {
  const relayState = crypto.randomUUID();
  const xml = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="${relayState}" IssueInstant="${new Date().toISOString()}" Version="2.0" AssertionConsumerServiceURL="${config.callbackUrl}" />`;
  const encoded = Buffer.from(xml).toString("base64");
  const params = new URLSearchParams({ SAMLRequest: encoded, RelayState: relayState });
  return `${config.entryPoint}?${params.toString()}`;
}
