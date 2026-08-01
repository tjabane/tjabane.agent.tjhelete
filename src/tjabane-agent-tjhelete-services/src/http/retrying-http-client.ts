import type { HttpClient, HttpRequestOptions, HttpResponse } from "./http-client.interface.js";
import {
  HttpNetworkError,
  HttpRequestCancelledError,
  HttpStatusError,
  HttpTimeoutError,
} from "./http-error.js";

export interface HttpRetryPolicyOptions {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

export type RetryDelay = (delayMs: number, signal?: AbortSignal) => Promise<void>;

const defaultPolicy: HttpRetryPolicyOptions = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2_000,
};

const retryableStatusCodes = new Set([408, 429, 500, 502, 503, 504]);

export class RetryingHttpClient implements HttpClient {
  private readonly policy: HttpRetryPolicyOptions;

  public constructor(
    private readonly innerClient: HttpClient,
    policy: Partial<HttpRetryPolicyOptions> = {},
    private readonly delay: RetryDelay = wait,
    private readonly now: () => number = Date.now,
  ) {
    this.policy = { ...defaultPolicy, ...policy };
    validatePolicy(this.policy);
  }

  public async request(options: HttpRequestOptions): Promise<HttpResponse> {
    const retriesEnabled = options.retryable ?? options.method === "GET";

    for (let attempt = 1; ; attempt += 1) {
      if (options.signal?.aborted === true) {
        throw new HttpRequestCancelledError();
      }

      try {
        return await this.innerClient.request(options);
      } catch (error) {
        if (!retriesEnabled || attempt >= this.policy.maxAttempts || !isTransientFailure(error)) {
          throw error;
        }

        await this.delay(this.calculateDelay(attempt, error), options.signal);
      }
    }
  }

  private calculateDelay(attempt: number, error: unknown): number {
    const retryAfterMs =
      error instanceof HttpStatusError ? parseRetryAfter(error.retryAfter, this.now()) : undefined;
    const exponentialDelay = this.policy.baseDelayMs * 2 ** (attempt - 1);

    return Math.min(retryAfterMs ?? exponentialDelay, this.policy.maxDelayMs);
  }
}

function isTransientFailure(error: unknown): boolean {
  return (
    error instanceof HttpNetworkError ||
    error instanceof HttpTimeoutError ||
    (error instanceof HttpStatusError && retryableStatusCodes.has(error.status))
  );
}

function parseRetryAfter(value: string | undefined, now: number): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }

  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

function validatePolicy(policy: HttpRetryPolicyOptions): void {
  if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1) {
    throw new RangeError("HTTP retry maxAttempts must be a positive integer.");
  }

  if (!Number.isFinite(policy.baseDelayMs) || policy.baseDelayMs < 0) {
    throw new RangeError("HTTP retry baseDelayMs must be a non-negative finite number.");
  }

  if (!Number.isFinite(policy.maxDelayMs) || policy.maxDelayMs < policy.baseDelayMs) {
    throw new RangeError("HTTP retry maxDelayMs must be finite and at least baseDelayMs.");
  }
}

async function wait(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted === true) {
    throw new HttpRequestCancelledError();
  }

  await new Promise<void>((resolve, reject) => {
    const complete = (): void => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    };
    const timeout = setTimeout(complete, delayMs);
    const cancel = (): void => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", cancel);
      reject(new HttpRequestCancelledError());
    };

    signal?.addEventListener("abort", cancel, { once: true });

    if (signal?.aborted === true) {
      cancel();
    }
  });
}
