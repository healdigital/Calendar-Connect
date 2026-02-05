import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { StudentProfileView } from "~/modules/onboarding/student-profile/student-profile-view";

const StudentProfilePage = async () => {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });

  if (!session?.user?.id) {
    return redirect("/auth/login");
  }

  // Optional: check if user already has a student profile?
  // We can handle that in the view or here via pre-fetching. for now, assuming edit/create is fine.

  return <StudentProfileView />;
};

export default StudentProfilePage;
