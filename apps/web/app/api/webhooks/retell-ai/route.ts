import process from "node:process";
import { PrismaAgentRepository } from "@calcom/features/calAIPhone/repositories/PrismaAgentRepository";
import { PrismaPhoneNumberRepository } from "@calcom/features/calAIPhone/repositories/PrismaPhoneNumberRepository";
// import { CreditService } from "@calcom/features/ee/billing/credit-service";
import logger from "@calcom/lib/logger";
import { safeStringify } from "@calcom/lib/safeStringify";
import { prisma } from "@calcom/prisma";

async function chargeCreditsForCall({
  userId,
  teamId,
  callCost,
  callId,
  callDuration,
}: {
  userId?: number;
  teamId?: number;
  callCost: number;
  callId: string;
  callDuration: number;
}) {
  log.info("Credits charging is disabled in this version.", {
    userId,
    teamId,
    callCost,
    callId,
    duration: callDuration,
  });
  return {
    success: true,
    message: "Credits charging skipped (disabled)",
  };
}

async function handleCallAnalyzed(callData: RetellCallData) {
  const { from_number, call_id, call_cost, call_type, agent_id } = callData;

  if (
    !call_cost ||
    typeof call_cost.total_duration_seconds !== "number" ||
    !Number.isFinite(call_cost.total_duration_seconds) ||
    call_cost.total_duration_seconds <= 0
  ) {
    log.info(
      `Invalid or missing call_cost.total_duration_seconds for call ${call_id}: ${safeStringify(call_cost)}`
    );
    return {
      success: true,
      message: `Invalid or missing call_cost.total_duration_seconds for call ${call_id}`,
    };
  }

  let userId: number | undefined;
  let teamId: number | undefined;

  // Handle web calls vs phone calls
  if (call_type === "web_call" || !from_number) {
    if (!agent_id) {
      log.error(`Web call ${call_id} missing agent_id, cannot charge credits`);
      return {
        success: false,
        message: `Web call ${call_id} missing agent_id, cannot charge credits`,
      };
    }

    const agentRepo = new PrismaAgentRepository(prisma);
    const agent = await agentRepo.findByProviderAgentId({
      providerAgentId: agent_id,
    });

    if (!agent) {
      log.error(`No agent found for providerAgentId ${agent_id}, call ${call_id}`);
      return {
        success: false,
        message: `No agent found for providerAgentId ${agent_id}, call ${call_id}`,
      };
    }

    userId = agent.userId ?? undefined;
    teamId = agent.team?.parentId ?? agent.teamId ?? undefined;

    log.info(`Processing web call ${call_id} for agent ${agent_id}, user ${userId}, team ${teamId}`);
  } else {
    const phoneNumberRepo = new PrismaPhoneNumberRepository(prisma);
    const phoneNumber = await phoneNumberRepo.findByPhoneNumber({
      phoneNumber: from_number,
    });

    if (!phoneNumber) {
      const msg = `No phone number found for ${from_number}, call ${call_id}`;
      log.error(msg);
      return { success: false, message: msg };
    }

    userId = phoneNumber.userId ?? undefined;
    teamId = phoneNumber.team?.parentId ?? phoneNumber.teamId ?? undefined;

    log.info(`Processing phone call ${call_id} from ${from_number}, user ${userId}, team ${teamId}`);
  }

  if (!userId && !teamId) {
    log.error(`Call ${call_id} has no associated user or team`);
    return {
      success: false,
      message: `Call ${call_id} has no associated user or team`,
    };
  }

  return await chargeCreditsForCall({
    userId,
    teamId,
    callCost: call_cost.combined_cost || 0,
    callId: call_id,
    callDuration: call_cost.total_duration_seconds,
  });
}

/**
 * Retell AI Webhook Handler
 *
 * Setup Instructions:
 * 1. Add this webhook URL to your Retell AI dashboard: https://yourdomain.com/api/webhooks/retell-ai
 * 2. Ensure your domain is accessible from the internet (for local development, use ngrok or similar)
 * 3. Set the RETELL_AI_KEY environment variable with your Retell API key (must have webhook badge)
 *
 * This webhook will:
 * - Verify webhook signature for security
 * - Receive call_analyzed events from Retell AI
 * - Charge credits based on the call cost from the user's or team's credit balance
 * - Log all transactions for audit purposes
 */
async function handler(request: NextRequest) {
  const rawBody = await request.text();
  const body = JSON.parse(rawBody);

  // Verify webhook signature
  const signature = request.headers.get("x-retell-signature");
  const apiKey = process.env.RETELL_AI_KEY;

  if (!signature || !apiKey) {
    log.error("Missing signature or API key for webhook verification");
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Missing signature or API key",
      },
      { status: 401 }
    );
  }

  if (!Retell.verify(rawBody, apiKey, signature)) {
    log.error("Invalid webhook signature");
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid signature",
      },
      { status: 401 }
    );
  }

  if (body.event !== "call_analyzed") {
    return NextResponse.json(
      {
        success: true,
        message: `No handling for ${body.event} for call ${body.call?.call_id ?? "unknown"}`,
      },
      { status: 200 }
    );
  }

  try {
    const payload = RetellWebhookSchema.parse(body);
    const callData = payload.call;

    // Skip inbound calls (only for phone calls, web calls don't have direction)
    if (callData.direction === "inbound") {
      return NextResponse.json(
        {
          success: true,
          message: `Inbound calls are not charged or supported for now. Ignoring call ${callData.call_id}`,
        },
        { status: 200 }
      );
    }

    log.info(`Received Retell AI webhook: ${payload.event} for call ${callData.call_id}`, {
      call_id: callData.call_id,
    });

    const result = await handleCallAnalyzed(callData);

    return NextResponse.json(
      {
        success: result?.success ?? true,
        message: result?.message ?? `Processed ${payload.event} for call ${callData.call_id}`,
      },
      { status: 200 }
    );
  } catch (error) {
    log.error("Error processing Retell AI webhook:", safeStringify(error));
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      // we need to return 200 to retell ai to avoid retries
      { status: 200 }
    );
  }
}

export const POST = defaultResponderForAppDir(handler);
