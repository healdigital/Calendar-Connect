import { trpc } from "@calcom/trpc/react";
import { useSession } from "next-auth/react";

export default function useApp(appId: string, options?: { enabled?: boolean }) {
  const { status } = useSession();

  return trpc.viewer.apps.appById.useQuery(
    { appId },
    {
      enabled: status === "authenticated" && (options?.enabled ?? true),
    }
  );
}
