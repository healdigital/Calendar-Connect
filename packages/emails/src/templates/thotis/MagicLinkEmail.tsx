import { ThotisBaseEmail } from "./ThotisBaseEmail";

export const MagicLinkEmail = (props: {
  magicLink: string;
  actionType?: string; // "LOGIN", "CANCEL", "RESCHEDULE", etc.
  recipientName?: string;
}) => {
  const isLogin = !props.actionType || props.actionType === "LOGIN";
  const title = isLogin ? "Connexion à votre espace Thotis" : "Action demandée sur votre session Thotis";
  const subtitle = isLogin
    ? "Cliquez sur le lien ci-dessous pour accéder à votre espace."
    : "Cliquez ci-dessous pour confirmer votre action.";
  const buttonText = isLogin ? "Accéder à mon espace" : "Confirmer l'action";

  return (
    <ThotisBaseEmail subject={title} title={title} subtitle={subtitle} headerType="checkCircle">
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <a
          href={props.magicLink}
          style={{
            backgroundColor: "#FF6B35", // Thotis Orange
            color: "#FFFFFF",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            fontFamily: "Montserrat, Inter, Roboto, sans-serif",
            fontSize: "16px",
            display: "inline-block",
          }}>
          {buttonText}
        </a>
      </div>
      <div style={{ textAlign: "center", color: "#666", fontSize: "14px" }}>
        <p>Ce lien expirera dans 15 minutes.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
      </div>
    </ThotisBaseEmail>
  );
};
