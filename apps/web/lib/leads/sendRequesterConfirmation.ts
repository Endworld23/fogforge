import "server-only";

import { Resend } from "resend";

type RequesterConfirmationInput = {
  requesterName: string;
  requesterEmail: string;
  metroName?: string | null;
  metroState?: string | null;
  providerName?: string | null;
};

type RequesterConfirmationResult = {
  ok: boolean;
  message: string;
};

const MAX_ERROR_LENGTH = 500;

function trimErrorMessage(message: string) {
  return message.length > MAX_ERROR_LENGTH ? `${message.slice(0, MAX_ERROR_LENGTH)}...` : message;
}

export async function sendRequesterConfirmation(
  input: RequesterConfirmationInput
): Promise<RequesterConfirmationResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const fromEmail = process.env.LEADS_FROM_EMAIL?.trim() ?? "";

  if (!resendApiKey || !fromEmail) {
    const configMessage = "Missing Resend configuration for requester confirmation.";
    console.info(configMessage);
    return { ok: false, message: configMessage };
  }

  const requesterName = input.requesterName.trim() || "there";
  const metroLabel =
    input.metroName && input.metroState
      ? `${input.metroName}, ${input.metroState}`
      : input.metroName ?? "your area";
  const providerLabel = input.providerName ? ` from ${input.providerName}` : "";

  const subject = "We received your quote request";
  const bodyLines = [
    `Hi ${requesterName},`,
    "",
    `Thanks for your request${providerLabel}. We’re reviewing it now.`,
    "",
    "What happens next:",
    `- We match your request to available providers in ${metroLabel}.`,
    "- A provider will reach out with availability and next steps.",
    "- You can compare options and choose the best fit.",
    "",
    "If you need to add details, just reply to this email.",
    "",
    "— Fogforge",
  ];

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
      error instanceof Error ? trimErrorMessage(error.message) : "Requester confirmation failed.";
    console.info(failureMessage);
    return { ok: false, message: failureMessage };
  }

  return { ok: true, message: "Requester confirmation sent." };
}
