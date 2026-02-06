import type { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { StudentsModule } from "./students/students.module";
import { UsersModule } from "./users/users.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { AtomsModule } from "@/modules/atoms/atoms.module";
import { OAuth2Module } from "@/modules/auth/oauth2/oauth2.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { CalUnifiedCalendarsModule } from "@/modules/cal-unified-calendars/cal-unified-calendars.module";
import { ConferencingModule } from "@/modules/conferencing/conferencing.module";
import { DestinationCalendarsModule } from "@/modules/destination-calendars/destination-calendars.module";
import { OAuthClientModule } from "@/modules/oauth-clients/oauth-client.module";
import { PlatformModule } from "@/modules/platform/platform.module";
import { RouterModule } from "@/modules/router/router.module";
import { StripeModule } from "@/modules/stripe/stripe.module";
import { TimezoneModule } from "@/modules/timezones/timezones.module";
import { VerifiedResourcesModule } from "@/modules/verified-resources/verified-resources.module";

@Module({
  imports: [
    OAuth2Module,
    OAuthClientModule,
    BillingModule,

    TimezoneModule,
    UsersModule,
    WebhooksModule,
    DestinationCalendarsModule,
    AtomsModule,
    StripeModule,
    ConferencingModule,
    CalUnifiedCalendarsModule,
    VerifiedResourcesModule,
    RouterModule,
    StudentsModule,
    PlatformModule,
  ],
})
export class EndpointsModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // TODO: apply ratelimits
  }
}
