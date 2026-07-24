export class ProviderResponseValidationError extends Error {
  public constructor(message: string) {
    super(`Provider response validation failed: ${message}`);
    this.name = "ProviderResponseValidationError";
  }
}
