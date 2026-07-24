export interface InvestecAccessTokenProvider {
  getAccessToken(): Promise<string>;
}
