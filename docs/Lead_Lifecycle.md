# FogForge — Lead Lifecycle + Flags

FogForge tracks leads end-to-end so admin can see:
- delivery success/failure
- response time
- outcomes
- provider behavior

This is essential for future V2 reclaiming rules and monetization.

---

## Core Lead Status (Single-value)
These represent the lead’s primary state in the system:

1. **created**
- Lead created by user via direct provider page or broadcast request.
- Stored in DB immediately.

2. **queued**
- Awaiting delivery rules (verification checks, delays, throttles).

3. **delivered**
- Successfully delivered via one or more channels (email, inbox).
- delivered_at set.

4. **delivery_failed**
- Attempted delivery but failed (email error, missing provider email, etc).
- delivery_error set.

5. **viewed**
- Provider viewed lead in inbox (if inbox is enabled).

6. **contacted**
- Provider took an action that indicates outreach (reply sent, click-to-call, email reply tracked, etc).

7. **resolved**
- Provider marks resolved, or customer confirms resolved, or admin resolves.

8. **expired**
- Lead aged out (e.g., 7 days) without resolution.

---

## Lead Flags (Multi-value)
Flags are additive “labels” used for automation, UI, and analytics.

- **hot**
- **unresponded**
- **escalated**
- **reassigned** (V2)
- **test** (admin-generated)
- **free_tier_delayed**
- **verification_required**
- **broadcast**
- **direct**
- **spam_suspected**
- **duplicate**
- **refund_risk** (future)

---

## Tracking Events (Append-only)
Even if status changes, event history should be kept for metrics.

Event examples:
- lead_created
- delivery_attempted
- delivery_succeeded
- delivery_failed
- viewed_in_inbox
- provider_replied
- provider_called
- provider_marked_resolved
- customer_confirmed_resolved
- reminder_sent

---

## SLA / Reminder Timers (Policy Layer)
Timers should differ for Paid vs Free.

Suggested default:
- Growth: reminder at 15m / 1h / 4h (optional)
- Starter: reminder at 1h / 4h / next day
- Free/Unverified: no aggressive reminders

(Do not punish yet; just track.)