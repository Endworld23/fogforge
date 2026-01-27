import "server-only";

import { Resend } from "resend";

type ClaimNotificationInput = {
  requesterEmail: string;
  requesterName?: string | null;
  providerName: string;
  status: "submitted" | "approved" | "rejected";
};

type ClaimNotificationResult = {
  ok: boolean;
  message: string;
};

const MAX_ERROR_LENGTH = 500;

function trimErrorMessage(message: string) {
  return message.length > MAX_ERROR_LENGTH ? `${message.slice(0, MAX_ERROR_LENGTH)}...` : message;
}

export async function sendClaimNotification(
  input: ClaimNotificationInput
): Promise<ClaimNotificationResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const fromEmail = process.env.LEADS_FROM_EMAIL?.trim() ?? "";

  if (!resendApiKey || !fromEmail) {
    const configMessage = "Missing Resend configuration for claim notifications.";
    console.info(configMessage);
    return { ok: false, message: configMessage };
  }

  const requesterName = input.requesterName?.trim() || "there";
  const providerName = input.providerName.trim() || "this business";

  let subject = "We received your claim request";
  let bodyLines = [
    `Hi ${requesterName},`,
    "",
    `We received your claim request for ${providerName}.`,
    "",
    "What happens next:",
    "- Our team reviews the request and verifies ownership.",
    "- We will email you once a decision is made.",
    "",
    "— Fogforge",
  ];

  if (input.status === "approved") {
    subject = "Your claim request was approved";
    bodyLines = [
      `Hi ${requesterName},`,
      "",
      `Good news — your claim request for ${providerName} has been approved.`,
      "",
      "You can now access your provider dashboard and update your listing.",
      "",
      "— Fogforge",
    ];
  }

  if (input.status === "rejected") {
    subject = "Your claim request was not approved";
    bodyLines = [
      `Hi ${requesterName},`,
      "",
      `We reviewed your claim request for ${providerName}.`,
      "",
      "At this time we could not approve the request. If you believe this is a mistake, reply to this email with more details.",
      "",
      "— Fogforge",
    ];
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: fromEmail,
      to: input.requesterEmail,
      subject,
      text: bodyLines.join("\n"),
    });
  } catch (error) {
    const failureMessage =
      error instanceof Error ? trimErrorMessage(error.message) : "Claim notification failed.";
    console.info(failureMessage);
    return { ok: false, message: failureMessage };
  }

  return { ok: true, message: "Claim notification sent." };
}
