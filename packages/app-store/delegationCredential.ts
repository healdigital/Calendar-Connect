import { CredentialRepository } from "@calcom/features/credentials/repositories/CredentialRepository";
import {
  buildNonDelegationCredential,
  buildNonDelegationCredentials,
  isDelegationCredential,
} from "@calcom/lib/delegationCredential";
import { prisma } from "@calcom/prisma";
import type { SelectedCalendar } from "@calcom/prisma/client";
import { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";
import type { CredentialForCalendarService, CredentialPayload } from "@calcom/types/Credential";

// Type definitions to replace imported ones
export type ServiceAccountKey = any;

interface DelegationCredential {
  id: string;
  workspacePlatform: {
    slug: string;
  };
  serviceAccountKey: ServiceAccountKey | null;
}

interface DelegationCredentialWithSensitiveServiceAccountKey extends DelegationCredential {
  serviceAccountKey: ServiceAccountKey;
}

interface User {
  email: string;
  id: number;
}

export async function getAllDelegationCredentialsForUserIncludeServiceAccountKey({
  user,
}: {
  user: { email: string; id: number };
}) {
  return [];
}

export async function getAllDelegationCredentialsForUser({ user }: { user: { email: string; id: number } }) {
  return [];
}

export async function getAllDelegatedCalendarCredentialsForUser({
  user,
}: {
  user: { email: string; id: number };
}) {
  return [];
}

export async function checkIfSuccessfullyConfiguredInWorkspace({
  delegationCredential,
  user,
}: {
  delegationCredential: DelegationCredentialWithSensitiveServiceAccountKey;
  user: User;
}) {
  return false;
}

export async function getAllDelegationCredentialsForUserByAppType({
  user,
  appType,
}: {
  user: User;
  appType: string;
}) {
  return [];
}

export async function getAllDelegationCredentialsForUserByAppSlug({
  user,
  appSlug,
}: {
  user: User;
  appSlug: string;
}) {
  return [];
}

type Host<TUser extends { id: number; email: string; credentials: CredentialPayload[] }> = {
  user: TUser;
};

export const buildAllCredentials = ({
  delegationCredentials,
  existingCredentials,
}: {
  delegationCredentials: any[];
  existingCredentials: CredentialPayload[];
}) => {
  return buildNonDelegationCredentials(existingCredentials) as unknown as CredentialForCalendarService[];
};

export async function enrichUsersWithDelegationCredentials<
  TUser extends { id: number; email: string; credentials: CredentialPayload[] },
>({ orgId, users }: { orgId: number | null; users: TUser[] }) {
  return users;
}

export const enrichHostsWithDelegationCredentials = async <
  THost extends Host<TUser>,
  TUser extends { id: number; email: string; credentials: CredentialPayload[] },
>({
  orgId,
  hosts,
}: {
  orgId: number | null;
  hosts: THost[];
}) => {
  return hosts;
};

export const enrichUserWithDelegationCredentialsIncludeServiceAccountKey = async <
  TUser extends { id: number; email: string; credentials: CredentialPayload[] },
>({
  user,
}: {
  user: TUser;
}) => {
  return user;
};

export const enrichUserWithDelegationCredentials = async <
  TUser extends { id: number; email: string; credentials: CredentialPayload[] },
>({
  user,
}: {
  user: TUser;
}) => {
  return user;
};

export async function enrichUserWithDelegationConferencingCredentialsWithoutOrgId<
  TUser extends { id: number; email: string; credentials: CredentialPayload[] },
>({ user }: { user: TUser }) {
  return user;
}

export async function getDelegationCredentialOrFindRegularCredential<
  TDelegationCredential extends { delegatedToId?: string | null },
>({
  id,
  delegationCredentials,
}: {
  id: {
    credentialId: number | null | undefined;
    delegationCredentialId: string | null | undefined;
  };
  delegationCredentials: TDelegationCredential[];
}) {
  return null;
}

export function getDelegationCredentialOrRegularCredential<
  TCredential extends { delegatedToId?: string | null; id: number },
>({
  credentials,
  id,
}: {
  credentials: TCredential[];
  id: { credentialId: number | null | undefined; delegationCredentialId: string | null | undefined };
}) {
  return (
    credentials.find((cred) => {
      if (id.credentialId) {
        return cred.id === id.credentialId;
      }
      return false;
    }) || null
  );
}

export function getFirstDelegationConferencingCredential({ credentials }: { credentials: any[] }) {
  return undefined;
}

export function getFirstDelegationConferencingCredentialAppLocation({ credentials }: { credentials: any[] }) {
  return null;
}

export async function findUniqueDelegationCalendarCredential({
  userId,
  delegationCredentialId,
}: {
  userId: number;
  delegationCredentialId: string;
}) {
  return null;
}

export async function getUsersCredentialsIncludeServiceAccountKey(user: Pick<User, "id" | "email">) {
  return [];
}

export async function getUsersCredentials(user: User) {
  return [];
}

export async function getCredentialForSelectedCalendar({
  credentialId,
  delegationCredentialId,
  userId,
}: Partial<SelectedCalendar>) {
  if (credentialId) {
    const credentialRepository = new CredentialRepository(prisma);
    const credential = await credentialRepository.findByIdWithDelegationCredential(credentialId);
    return credential ? buildNonDelegationCredential(credential) : undefined;
  }
  return undefined;
}
