export interface InboundMessage {
  readonly channel: "whatsapp";
  readonly providerMessageId: string;
  readonly externalSenderId: string;
  readonly externalRecipientId: string;
  readonly text: string;
}

export interface InboundMessageService {
  handle(message: InboundMessage): Promise<string>;
}
