import { useLocale } from "@calcom/lib/hooks/useLocale";
import { useSession } from "next-auth/react";
import type { Dispatch } from "react";
import type { UserTableAction } from "./types";

interface Props {
  dispatch: Dispatch<UserTableAction>;
}

export function InviteMemberModal(props: Props) {
  const { data: session } = useSession();
  const { t } = useLocale();

  const orgId = session?.user.org?.id;

  if (!orgId) return null;

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
      {t("inviting_members_not_available")}
      <button className="ml-2 underline" onClick={() => props.dispatch({ type: "CLOSE_MODAL" })}>
        {t("close")}
      </button>
    </div>
  );
}
