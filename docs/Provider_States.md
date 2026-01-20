# FogForge — Provider States (Per Metro)

FogForge treats provider status as **per-metro**. A provider may be Verified/Paid in one metro and Unverified in another.

This enables fair lead handling, clean monetization, and avoids punishing providers in low-demand metros.

---

## Key Definitions

- **Provider**: a business entity record in FogForge.
- **Claim**: provider requests access to manage their listing.
- **Verification**: provider proves they are a legitimate business (documents + review).
- **Home Metro**: the provider’s primary metro. Plans include **one** home metro.
- **Add-on Metro**: additional metros unlocked via paid add-on.

---

## States (Per Metro)

### 1) Unclaimed (Imported Listing)
**Meaning:** Provider exists in the directory but no one has claimed/verified it.

**Public:**
- Listing is visible (if published).
- Provider is not labeled “unverified” publicly.

**Admin:**
- Admin can see: Unclaimed status, import source, verification status = none.

**Lead Handling:**
- **Direct-to-provider lead** (user selects a specific provider): captured and held in escrow (see Lead Distribution Rules).
- **Broadcast lead** (user selects “anyone in this metro”): sent to the broadcast pool (see rules), but unclaimed providers do not receive direct delivery unless they have a delivery route configured.

**Monetization Leverage:**
- Admin may outreach: “You were requested. Claim + verify to receive leads.”

---

### 2) Claimed, Unverified
**Meaning:** Someone is attempting to claim the provider listing but has not passed verification.

**Public:**
- No “unverified” badge publicly.
- Listing remains visible.

**Access:**
- Limited provider panel (if you choose to implement later).
- No sensitive lead data.

**Lead Handling:**
- Leads may be **previewed** in limited form (no full contact info) or held in escrow.
- Delivery may be delayed and/or restricted.

**Goal:**
- Drive verification completion.

---

### 3) Verified (Free)
**Meaning:** Provider has passed verification for the metro, but is not paying.

**Public:**
- Verified badge may be shown (optional; you can keep it for paid only if desired).

**Access:**
- Provider inbox access can be limited or disabled depending on plan strategy.
- The minimum: provider can be eligible for controlled “teaser” leads to prove value.

**Lead Handling:**
- Eligible for “verification reward” / “teaser” leads under strict limits.
- Full delivery still may require at least Starter, depending on your final policy.

---

### 4) Verified + Starter (Paid)
**Meaning:** Verified provider paying Starter tier for their home metro.

**Lead Handling:**
- Full delivery for direct leads (subject to plan rules).
- Eligible for broadcast leads with standard priority.

---

### 5) Verified + Growth (Paid, Default)
**Meaning:** Verified provider paying Growth tier.

**Lead Handling:**
- Fastest and most complete lead delivery.
- Highest priority in broadcast pool.
- Full inbox + tracking metrics.

---

### 6) Verified + Pro (Paid, Multi-Metro)
**Meaning:** Verified provider operating across multiple metros/regions.

**Lead Handling:**
- Multi-metro coverage + add-on metros included (custom).
- Priority rules configurable.

---

## Home Metro Rule
Each provider selects ONE home metro during verification/onboarding:
- Starter/Growth apply to home metro only.
- Add-on metros can be purchased later.

This prevents early complexity and ensures pricing is fair.

---

## Verification Gate (Safety Rule)
FogForge does **not** provide full lead contact details to unverified entities.

Unverified providers may receive:
- No delivery (escrow only), OR
- Limited preview (first name + initial, masked email/phone), OR
- Delayed delivery only after manual admin approval.

Default recommendation (safe + simple):
✅ **Full delivery only after verification.**