import type { UserIdentityResolver } from "../contracts/identity.js";

export class StaticUserIdentityResolver implements UserIdentityResolver {
  public constructor(
    private readonly allowedExternalSenderId: string,
    private readonly internalUserId: string,
  ) {}

  public async resolve(channel: "whatsapp", externalSenderId: string): Promise<string | null> {
    return channel === "whatsapp" && externalSenderId === this.allowedExternalSenderId
      ? this.internalUserId
      : null;
  }
}
