import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { AmbassadorManagement } from "@calcom/features/thotis/components/AmbassadorManagement";
import { getTranslation } from "@calcom/lib/server/i18n";
import { UserPermissionRole } from "@calcom/prisma/enums";
import Shell from "@calcom/ui/Shell";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AmbassadorsPage() {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });

  if (session?.user?.role !== UserPermissionRole.ADMIN) {
    redirect("/");
  }

  const t = await getTranslation(session?.user?.locale ?? "fr", "common");

  return (
    <Shell title={t("thotis_admin_page_title")} description={t("thotis_admin_page_description")}>
      <AmbassadorManagement />
    </Shell>
  );
}
