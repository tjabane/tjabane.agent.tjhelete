export class ModelProviderError extends Error {
  public constructor(options: ErrorOptions = {}) {
    super("The model provider request failed.", options);
    this.name = "ModelProviderError";
  }
}

export class ModelProviderResponseValidationError extends ModelProviderError {
  public constructor() {
    super();
    this.name = "ModelProviderResponseValidationError";
  }
}
