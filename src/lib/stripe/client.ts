import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export async function createConnectedAccount(email: string) {
  return stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
  });
}

export async function createAccountLink(accountId: string, baseUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/onboarding/stripe/refresh`,
    return_url: `${baseUrl}/onboarding/stripe/return`,
    type: "account_onboarding",
  });
}
