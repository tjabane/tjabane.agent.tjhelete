import type { HttpClient } from "../../../http/http-client.interface.js";
import type { InvestecAccessTokenProvider } from "./investec-access-token-provider.interface.js";
import { ProviderResponseValidationError } from "../errors/provider-response-validation-error.js";

interface CachedAccessToken {
  readonly value: string;
  readonly expiresAt: number;
}

interface InvestecAccessTokenDto {
  readonly access_token: string;
  readonly token_type: "Bearer";
  readonly expires_in: number;
  readonly scope: string;
}

export class DefaultInvestecAccessTokenProvider implements InvestecAccessTokenProvider {
  private cachedToken?: CachedAccessToken;
  private tokenAcquisition?: Promise<CachedAccessToken>;

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly tokenUrl: URL,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly apiKey: string,
    private readonly requestTimeoutMs = 10_000,
    private readonly expirySafetyMarginMs = 30_000,
    private readonly now: () => number = Date.now,
  ) {
    this.validateConfiguration();
  }

  public async getAccessToken(): Promise<string> {
    if (this.cachedToken !== undefined && this.cachedToken.expiresAt > this.now()) {
      return this.cachedToken.value;
    }

    this.tokenAcquisition ??= this.acquireAndCacheToken();

    try {
      return (await this.tokenAcquisition).value;
    } finally {
      this.tokenAcquisition = undefined;
    }
  }

  private async acquireAndCacheToken(): Promise<CachedAccessToken> {
    const response = await this.httpClient.request({
      method: "POST",
      url: this.tokenUrl,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${encodeBasicCredentials(this.clientId, this.clientSecret)}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": this.apiKey,
      },
      body: "grant_type=client_credentials",
      timeoutMs: this.requestTimeoutMs,
      retryable: true,
    });
    const dto = decodeAccessToken(response.body);
    const expiresAt = this.now() + Math.max(0, dto.expires_in * 1_000 - this.expirySafetyMarginMs);
    const token = {
      value: dto.access_token,
      expiresAt,
    };

    this.cachedToken = token;

    return token;
  }

  private validateConfiguration(): void {
    if (this.clientId.length === 0 || this.clientId.includes(":")) {
      throw new Error("Investec client ID must be non-empty and must not contain a colon.");
    }

    if (this.clientSecret.length === 0) {
      throw new Error("Investec client secret must be non-empty.");
    }

    if (this.apiKey.length === 0) {
      throw new Error("Investec API key must be non-empty.");
    }

    if (!Number.isFinite(this.requestTimeoutMs) || this.requestTimeoutMs <= 0) {
      throw new RangeError("Investec token request timeout must be a positive finite number.");
    }

    if (!Number.isFinite(this.expirySafetyMarginMs) || this.expirySafetyMarginMs < 0) {
      throw new RangeError(
        "Investec token expiry safety margin must be a non-negative finite number.",
      );
    }
  }
}

function decodeAccessToken(body: unknown): InvestecAccessTokenDto {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw invalidToken("response must be an object");
  }

  const token = body as Record<string, unknown>;
  const accessToken = readNonEmptyString(token.access_token, "access_token");
  const tokenType = readNonEmptyString(token.token_type, "token_type");
  const expiresIn = token.expires_in;
  const scope = readNonEmptyString(token.scope, "scope");

  if (tokenType.toLowerCase() !== "bearer") {
    throw invalidToken('token_type must be "Bearer"');
  }

  if (typeof expiresIn !== "number" || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw invalidToken("expires_in must be a positive finite number");
  }

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope,
  };
}

function readNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalidToken(`${field} must be a non-empty string`);
  }

  return value;
}

function invalidToken(reason: string): ProviderResponseValidationError {
  return new ProviderResponseValidationError(`access token ${reason}.`);
}

function encodeBasicCredentials(clientId: string, clientSecret: string): string {
  const bytes = new TextEncoder().encode(`${clientId}:${clientSecret}`);
  let binaryValue = "";

  for (const byte of bytes) {
    binaryValue += String.fromCharCode(byte);
  }

  return btoa(binaryValue);
}
