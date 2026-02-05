import { OAuthService as BaseOAuthService } from "@calcom/platform-libraries";
import { Injectable } from "@nestjs/common";
import { PrismaAccessCodeRepository } from "@/lib/repositories/prisma-access-code.repository";
import { PrismaOAuthClientRepository } from "@/lib/repositories/prisma-oauth-client.repository";
import { PrismaTeamRepository } from "@/lib/repositories/prisma-team.repository";

@Injectable()
export class OAuthService extends BaseOAuthService {
  constructor(
    accessCodeRepository: PrismaAccessCodeRepository,
    oAuthClientRepository: PrismaOAuthClientRepository,
    teamsRepository: PrismaTeamRepository
  ) {
    super({
      accessCodeRepository: accessCodeRepository,
      oAuthClientRepository: oAuthClientRepository,
      teamsRepository: teamsRepository,
    });
  }
}
