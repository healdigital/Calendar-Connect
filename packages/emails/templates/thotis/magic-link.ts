import renderEmail from "../../src/renderEmail";
import BaseEmail from "../_base-email";

export default class MagicLinkEmail extends BaseEmail {
  magicLink: string;
  email: string;
  actionType?: string;

  constructor(email: string, magicLink: string, actionType?: string) {
    super();
    this.email = email;
    this.magicLink = magicLink;
    this.actionType = actionType;
    this.name = "SEND_MAGIC_LINK";
  }

  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      to: this.email,
      from: `Thotis <${this.getMailerOptions().from}>`,
      subject: "Votre lien de connexion Thotis",
      html: await this.getHtml(this.email, this.magicLink, this.actionType),
      text: "",
    };
  }

  protected async getHtml(email: string, magicLink: string, actionType?: string) {
    return await renderEmail("MagicLinkEmail", {
      magicLink,
      actionType,
      recipientName: email, // Could be improved if we have name
    });
  }
}
