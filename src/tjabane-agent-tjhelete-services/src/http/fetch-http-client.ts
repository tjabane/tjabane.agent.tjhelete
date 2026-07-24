import {
  HttpBodyParseError,
  HttpNetworkError,
  HttpRequestCancelledError,
  HttpStatusError,
  HttpTimeoutError,
} from "./http-error.js";
import type { HttpClient, HttpRequestOptions, HttpResponse } from "./http-client.interface.js";

export class FetchHttpClient implements HttpClient {
  public constructor(private readonly fetchImplementation: typeof fetch = globalThis.fetch) {}

  public async request(options: HttpRequestOptions): Promise<HttpResponse> {
    this.validateOptions(options);

    if (options.signal?.aborted === true) {
      throw new HttpRequestCancelledError();
    }

    const abortController = new AbortController();
    let timedOut = false;
    let cancelledByCaller = false;
    const cancelRequest = (): void => {
      cancelledByCaller = true;
      abortController.abort();
    };
    const timeout =
      options.timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true;
            abortController.abort();
          }, options.timeoutMs);

    options.signal?.addEventListener("abort", cancelRequest, { once: true });

    try {
      const response = await this.fetchImplementation(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: abortController.signal,
      });
      const headers = Object.fromEntries(response.headers.entries());

      if (!response.ok) {
        throw new HttpStatusError(
          response.status,
          response.headers.get("retry-after") ?? undefined,
        );
      }

      return {
        status: response.status,
        body: await this.parseBody(response),
        headers,
      };
    } catch (error) {
      if (error instanceof HttpStatusError || error instanceof HttpBodyParseError) {
        throw error;
      }

      if (timedOut) {
        throw new HttpTimeoutError(options.timeoutMs!);
      }

      if (cancelledByCaller) {
        throw new HttpRequestCancelledError();
      }

      throw new HttpNetworkError({ cause: error });
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }

      options.signal?.removeEventListener("abort", cancelRequest);
    }
  }

  private validateOptions(options: HttpRequestOptions): void {
    if (
      options.timeoutMs !== undefined &&
      (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)
    ) {
      throw new RangeError("HTTP timeout must be a positive finite number.");
    }
  }

  private async parseBody(response: Response): Promise<unknown> {
    if (response.status === 204 || response.status === 205) {
      return null;
    }

    const text = await response.text();

    if (text.length === 0) {
      return null;
    }

    if (!response.headers.get("content-type")?.toLowerCase().includes("json")) {
      return text;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      throw new HttpBodyParseError({ cause: error });
    }
  }
}
