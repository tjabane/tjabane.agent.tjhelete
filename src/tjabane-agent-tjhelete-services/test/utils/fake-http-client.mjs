export class FakeHttpClient {
  requests = [];

  constructor(responses) {
    this.responses = Array.isArray(responses) ? [...responses] : [responses];
  }

  async request(options) {
    this.requests.push(options);

    const response = this.responses.shift();

    if (response === undefined) {
      throw new Error("No fake HTTP response configured.");
    }

    return response;
  }
}
