# Lead Lifecycle V1

This proposal defines the minimal lead lifecycle fields for V1, how they map to a simple derived state, and which UI flows read/write them. It also notes future automation hooks for V2.

## Fields to add (public.leads)

Add the following fields to `public.leads`:

- `viewed_at` (timestamptz, nullable)
- `last_contacted_at` (timestamptz, nullable)
- `resolved_at` (timestamptz, nullable)
- `resolution_status` (text, nullable; enum-like values)
- `escalated_at` (timestamptz, nullable)
- `escalation_reason` (text, nullable)
- `follow_up_at` (timestamptz, nullable)
- `next_action` (text, nullable)

## Field meanings

- `viewed_at`: first time an admin or provider opens the lead detail.
- `last_contacted_at`: most recent provider/admin outreach to the lead.
- `resolved_at`: when the lead is considered done (won/lost/closed).
- `resolution_status`: outcome label (`won`, `lost`, `closed`, `spam`).
- `escalated_at`: when a lead is flagged for admin attention.
- `escalation_reason`: short reason for escalation (e.g., `no_response`, `billing`, `quality`).
- `follow_up_at`: next planned follow-up timestamp.
- `next_action`: short freeform note for the next step (e.g., `call Tuesday`, `send quote`).

## Derived state (V1)

The UI should present a simple derived state based on the fields above:

| Derived state | Criteria |
| --- | --- |
| NEW | `viewed_at` is null and `resolved_at` is null and `escalated_at` is null |
| VIEWED | `viewed_at` is set, `last_contacted_at` is null, `resolved_at` is null, `escalated_at` is null |
| CONTACTED | `last_contacted_at` is set, `resolved_at` is null, `escalated_at` is null |
| RESOLVED | `resolved_at` is set |
| ESCALATED | `escalated_at` is set and `resolved_at` is null |

Notes:
- ESCALATED overrides NEW/VIEWED/CONTACTED while unresolved.
- RESOLVED always wins if `resolved_at` is set.

## UI read/write (V1)

Admin UI:
- Lead list: display derived state using the rules above.
- Lead detail: when opened, set `viewed_at` if null.
- Admin actions: allow setting `last_contacted_at`, `resolved_at`, `resolution_status`, `escalated_at`, `escalation_reason`, `follow_up_at`, `next_action`.

Provider UI:
- Lead list: display derived state and `follow_up_at`.
- Lead detail: when opened, set `viewed_at` if null.
- Provider actions: set `last_contacted_at`, `resolved_at`, `resolution_status`, and `follow_up_at`.

## V2 automation hooks

Future automation can use these fields without changing schema:

- Reminders: if `follow_up_at` is past due and `resolved_at` is null, notify provider.
- Reclaim: if `viewed_at` is null for N days after delivery, flag `escalated_at` and set `escalation_reason='no_view'`.
- Escalation: if `last_contacted_at` is older than N days and `resolved_at` is null, flag for admin.
- SLA tracking: compute time-to-first-view and time-to-contact using `viewed_at` and `last_contacted_at`.
