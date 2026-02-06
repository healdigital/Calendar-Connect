import { encryptServiceAccountKey } from "@calcom/platform-libraries";
import {
  addDelegationCredential,
  type TServiceAccountKeySchema,
  toggleDelegationCredentialEnabled,
} from "@calcom/platform-libraries/app-store";
import type { DelegationCredential, Prisma, User } from "@calcom/prisma/client";
import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bull";
import { AppConfig } from "@/config/type";
import { CalendarsTasker } from "@/lib/services/tasker/calendars-tasker.service";
import { CreateDelegationCredentialInput } from "@/modules/organizations/delegation-credentials/inputs/create-delegation-credential.input";
import {
  GoogleServiceAccountKeyInput,
  MicrosoftServiceAccountKeyInput,
} from "@/modules/organizations/delegation-credentials/inputs/service-account-key.input";
import { UpdateDelegationCredentialInput } from "@/modules/organizations/delegation-credentials/inputs/update-delegation-credential.input";
import { OrganizationsDelegationCredentialRepository } from "@/modules/organizations/delegation-credentials/organizations-delegation-credential.repository";

type DelegationCredentialWithWorkspacePlatform = {
  workspacePlatform: {
    name: string;
    id: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    description: string;
    defaultServiceAccountKey: Prisma.JsonValue;
  };
} & {
  id: string;
  organizationId: number;
  serviceAccountKey: Prisma.JsonValue;
  enabled: boolean;
  lastEnabledAt: Date | null;
  lastDisabledAt: Date | null;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
  workspacePlatformId: number;
};

@Injectable()
export class OrganizationsDelegationCredentialService {
  private logger = new Logger("OrganizationsDelegationCredentialService");

  constructor(
    private readonly organizationsDelegationCredentialRepository: OrganizationsDelegationCredentialRepository,
    private readonly calendarsTasker: CalendarsTasker,
    private readonly configService: ConfigService<AppConfig>
  ) {}
  async createDelegationCredential(
    orgId: number,
    delegatedServiceAccountUser: User,
    body: CreateDelegationCredentialInput
  ): Promise<Partial<Omit<DelegationCredential, "serviceAccountKey">> | null | undefined> {
    const delegationCredential = await addDelegationCredential({
      input: body,
      ctx: { user: { id: delegatedServiceAccountUser.id, organizationId: orgId } },
    });
    return delegationCredential;
  }

  async updateDelegationCredential(
    orgId: number,
    delegationCredentialId: string,
    delegatedServiceAccountUser: User,
    body: UpdateDelegationCredentialInput
  ): Promise<DelegationCredentialWithWorkspacePlatform> {
    let delegationCredential =
      await this.organizationsDelegationCredentialRepository.findByIdWithWorkspacePlatform(
        delegationCredentialId
      );

    if (!delegationCredential) {
      throw new NotFoundException(`DelegationCredential with id ${delegationCredentialId} not found`);
    }

    if (body.serviceAccountKey !== undefined) {
      const updatedDelegationCredential = await this.updateDelegationCredentialServiceAccountKey(
        delegationCredential.id,
        body.serviceAccountKey
      );
      delegationCredential = updatedDelegationCredential ?? delegationCredential;
    }

    if (body.enabled !== undefined) {
      await this.updateDelegationCredentialEnabled(
        orgId,
        delegationCredentialId,
        delegatedServiceAccountUser,
        body.enabled
      );
    }

    // once delegation credentials are enabled, slowly set all the destination calendars of delegated users
    if (body.enabled === true && delegationCredential.enabled === false) {
      await this.ensureDefaultCalendars(orgId, delegationCredential.domain);
    }

    return { ...delegationCredential, enabled: body?.enabled ?? delegationCredential.enabled };
  }

  async ensureDefaultCalendars(orgId: number, domain: string): Promise<void> {
    this.logger.warn("ensureDefaultCalendars is disabled in OSS");
  }

  async ensureDefaultCalendarsForUser(orgId: number, userId: number, userEmail: string): Promise<void> {
    this.logger.warn("ensureDefaultCalendarsForUser is disabled in OSS");
  }

  async updateDelegationCredentialEnabled(
    orgId: number,
    delegationCredentialId: string,
    delegatedServiceAccountUser: User,
    enabled: boolean
  ): Promise<Partial<Omit<DelegationCredential, "serviceAccountKey">> | null | undefined> {
    const handlerUser = {
      id: delegatedServiceAccountUser.id,
      email: delegatedServiceAccountUser.email,
      organizationId: orgId,
    };
    const handlerBody = { id: delegationCredentialId, enabled };
    const delegationCredential = await toggleDelegationCredentialEnabled(handlerUser, handlerBody);
    return delegationCredential;
  }

  async updateDelegationCredentialServiceAccountKey(
    delegationCredentialId: string,
    serviceAccountKey: GoogleServiceAccountKeyInput | MicrosoftServiceAccountKeyInput
  ): Promise<DelegationCredentialWithWorkspacePlatform> {
    // First encrypt the service account key
    const encryptedServiceAccountKey = encryptServiceAccountKey(
      serviceAccountKey as TServiceAccountKeySchema
    );
    const prismaJsonValue = JSON.parse(JSON.stringify(encryptedServiceAccountKey));

    const delegationCredential =
      await this.organizationsDelegationCredentialRepository.updateIncludeWorkspacePlatform(
        delegationCredentialId,
        {
          serviceAccountKey: prismaJsonValue,
          enabled: false,
        }
      );
    return delegationCredential;
  }
}
