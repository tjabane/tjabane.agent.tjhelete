export interface UserIdentityResolver {
  resolve(channel: "whatsapp", externalSenderId: string): Promise<string | null>;
}
