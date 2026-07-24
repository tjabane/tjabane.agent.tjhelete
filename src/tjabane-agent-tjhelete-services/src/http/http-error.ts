export abstract class HttpError extends Error {
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class HttpStatusError extends HttpError {
  public constructor(
    public readonly status: number,
    public readonly retryAfter?: string,
  ) {
    super(`HTTP request failed with status ${status}.`);
  }
}

export class HttpNetworkError extends HttpError {
  public constructor(options?: ErrorOptions) {
    super("HTTP request failed before receiving a response.", options);
  }
}

export class HttpTimeoutError extends HttpError {
  public constructor(public readonly timeoutMs: number) {
    super(`HTTP request timed out after ${timeoutMs} ms.`);
  }
}

export class HttpRequestCancelledError extends HttpError {
  public constructor() {
    super("HTTP request was cancelled by the caller.");
  }
}

export class HttpBodyParseError extends HttpError {
  public constructor(options?: ErrorOptions) {
    super("HTTP response declared JSON but contained an invalid body.", options);
  }
}
