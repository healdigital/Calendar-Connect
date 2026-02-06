export const getOrgFullOrigin = () => "";
export const subdomainSuffix = () => "";

export class OrganizationRepository {
  constructor(...args: any[]) {}
  async findById(...args: any[]): Promise<any> { return null; }
  async findByIds(...args: any[]): Promise<any[]> { return []; }
  async findBySlug(...args: any[]) { return null; }
}

export class OrganizationMembershipService {
  constructor(...args: any[]) {}
  async getMembership(...args: any[]) { return null; }
  async shouldAutoAccept(...args: any[]) { return false; }
}

export class PlatformBillingRepository {
  constructor(...args: any[]) {}
  async findByTeamId(...args: any[]) { return null; }
}

export interface IBillingProviderService {
  createSubscriptionUsageRecord(...args: any[]): Promise<any>;
}

export class PlatformOrganizationBillingSyncTasker {
  constructor(...args: any[]) {}
}
export class PlatformOrganizationBillingTaskService {
  constructor(...args: any[]) {}
}
export class PlatformOrganizationBillingTasker {
  constructor(...args: any[]) {}
  async rescheduleUsageIncrement(...args: any[]) {}
  async incrementUsage(...args: any[]) {}
  async cancelUsageIncrement(...args: any[]) {}
}
export class PlatformOrganizationBillingTriggerTasker {
  constructor(...args: any[]) {}
}

export class TeamService {
  static async removeMembers(...args: any[]) {}
  static async createInvite(...args: any[]) {}
}
