# FogForge — Lead Distribution Rules (Direct vs Broadcast)

FogForge supports two lead entry paths:

1) **Direct Lead**: user selects a specific provider (e.g., “Houston AAA Grease Trap Cleaners”).
2) **Broadcast Lead**: user selects “anyone in this metro” and wants the first available provider.

Broadcast is a major conversion lever for paid plans.

---

## A) Direct Leads (User Picked Provider)

### Who is eligible?
- If provider is Verified + Starter/Growth/Pro: ✅ deliver immediately.
- If provider is Claimed but Unverified: ❌ do not fully deliver.
- If provider is Unclaimed: ❌ do not deliver; hold in escrow.

### What happens if provider is not eligible?
Lead goes to **escrow**:
- visible in Admin inbox immediately
- delivery_status = pending
- admin can outreach provider to claim/verify
- customer is NOT spammed with multiple providers

Escrow is leverage:
- “You were requested — claim + verify to unlock.”

---

## B) Broadcast Leads (Free-for-all within Metro)

Broadcast leads are designed to:
- help customers get service fast
- create value for verified providers
- convert providers into paid plans

### Broadcast Pool Eligibility (Per Metro)
Broadcast lead is offered only to providers that meet minimum rules:

**Minimum eligibility options (choose one policy):**
1) Strict (recommended early):
   - Verified + Paid only
2) Balanced:
   - Verified (free) + Paid
3) Aggressive acquisition:
   - Verified + Claimed (unverified) with restricted preview

Recommended default for you right now:
✅ **Verified providers only** (Free + Paid), with Paid prioritized.

---

## Broadcast Offer Model
Broadcast uses a controlled “offer window” so it’s not chaos.

### Step 1 — Create Broadcast Lead
- lead.flag includes broadcast
- metro_id required
- provider_id is null initially (or set when assigned)

### Step 2 — Offer Wave 1 (Paid priority)
Send the lead to a small set of providers first:
- Growth first, then Starter, then Verified-free
- Example:
  - 3 Growth providers get first 5 minutes
  - if no one accepts, expand pool

### Step 3 — Acceptance
A provider “accepts” the lead:
- lead.provider_id assigned
- delivery to that provider becomes exclusive
- all others lose access

### Step 4 — Timeouts
If nobody accepts within X minutes:
- expand to next wave
- or fall back to admin intervention

---

## Teaser Lead Policy (Non-paying Validation)
You asked for a way for providers to get leads occasionally without paying.

### Rules
- Verified-free providers can receive:
  - **1 broadcast lead per week** (per provider, per home metro)
- Or: **1 direct-lead unlock per week** from escrow (admin mediated)

### Constraints (avoid abuse)
- Require verification first (recommended)
- Teaser leads are:
  - delivered normally (email/inbox), BUT flagged `teaser`
  - not eligible for priority
  - do not include premium tools/automation

### Conversion triggers
After teaser delivery:
- show “You could have received 4 more leads this month on Growth”
- show response time and missed opportunities
- offer Growth trial / Starter default

---

## Unverified Provider Safety Rule
You asked: “Is it good practice to deliver leads to unverified businesses?”

Answer:
❌ Not full contact details.
✅ Best practice is escrow + verification gate.

Allowed preview for unverified (optional):
- First name + last initial
- masked email: j***@gmail.com
- masked phone: (***) ***-1234
- message text can be partially masked too

But default: **no delivery until verified**.