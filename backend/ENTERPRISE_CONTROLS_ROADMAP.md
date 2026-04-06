# Enterprise Controls Roadmap

This document captures the next security, compliance, and integration capabilities for the platform, with a practical implementation order that fits the current backend.

## Current Baseline

The backend already provides:

- JWT authentication with refresh tokens
- Email verification and password reset OTP flows
- Role-based access control for `student`, `instructor`, and `admin`
- Protected attachment download endpoints
- Audit log and platform settings modules

This milestone adds a finer-grained permission layer on top of roles:

- Effective permissions are now derived from role defaults plus user-specific overrides
- Users support `permissionMode` (`inherit` or `override`) and `customPermissions`
- Authenticated request context now includes effective permissions
- Admins can update per-user permission assignments through `PATCH /api/v1/users/:id/permissions`
- Admin tooling can load permission metadata through `GET /api/v1/users/permissions/catalog`
- Permission changes now create explicit audit records in addition to generic request logging

## Recommended Delivery Order

### 1. Role Permission Granularity

Status: foundation added

What is in place now:

- Shared permission catalog in [permissions.ts](/c:/Users/BURKA/Desktop/OEMSP/backend/src/authorization/permissions.ts)
- Permission-aware auth middleware in [auth.middleware.ts](/c:/Users/BURKA/Desktop/OEMSP/backend/src/middleware/auth.middleware.ts)
- Permission assignment support in [user.service.ts](/c:/Users/BURKA/Desktop/OEMSP/backend/src/services/user.service.ts)
- Permission catalog endpoint for admin tooling
- Permission-based access to audit logs
- Explicit audit entries for permission changes

Next steps:

- Move more admin-only routes from coarse role checks to permission checks
- Create seeded permission presets for support, finance, compliance, and content-ops staff

### 2. Data Protection (GDPR-Style Controls)

Recommended backend additions:

- `PrivacyRequest` model for access, export, deletion, and rectification requests
- Consent and marketing-preference history on the `User` model
- Retention policy service for expiring stale personal data and deleted accounts
- Personal data export job that bundles profile, enrollments, payments, certificates, and activity history
- Admin workflow endpoints for request review, fulfillment, and audit logging

Suggested routes:

- `POST /api/v1/privacy/requests`
- `GET /api/v1/privacy/requests/me`
- `GET /api/v1/privacy/requests`
- `PATCH /api/v1/privacy/requests/:id`
- `POST /api/v1/privacy/export`

### 3. Secure Authentication

#### OAuth / Google Login

Recommended approach:

- Add Google OAuth as an additional identity provider, not a replacement for password login
- Store provider links on the user account (`providers.google.subject`, email sync metadata, last provider login)
- Require verified Google email matches before account linking
- Keep local account recovery available for admin accounts

Suggested routes:

- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`
- `POST /api/v1/auth/providers/google/link`
- `DELETE /api/v1/auth/providers/google/link`

#### 2FA

Recommended approach:

- Start with TOTP app-based 2FA for admins and instructors
- Store encrypted TOTP secret, backup codes, and `twoFactorEnabledAt`
- Add a second login step after password or OAuth success
- Require 2FA for permission-sensitive actions such as permission changes, refunds, and platform settings

Suggested routes:

- `POST /api/v1/auth/2fa/setup`
- `POST /api/v1/auth/2fa/verify`
- `POST /api/v1/auth/2fa/enable`
- `POST /api/v1/auth/2fa/disable`
- `POST /api/v1/auth/2fa/challenge`

### 4. Content Protection

Important constraint:

No web LMS can fully prevent piracy once content is displayed to an authenticated user. The practical goal is deterrence, controlled distribution, and better traceability.

Recommended controls:

- Signed, short-lived download URLs
- Per-enrollment watermarking for PDFs, slide decks, and video overlays
- Stream video via segmented delivery instead of raw file links
- Disable attachment downloads for lesson types that should be stream-only
- Record download and playback events for anomaly detection
- Add policy flags per lesson or attachment (`allowDownload`, `watermarkRequired`, `streamOnly`)

### 5. Public API for Integrations

Recommended scope:

- API keys with hashed storage, scopes, last-used timestamps, and revocation
- Separate rate limits and audit logs for external integrations
- Versioned routes under `/api/public/v1`
- Read-only scope first, then carefully add write operations

Suggested models:

- `ApiClient`
- `ApiKey`
- `ApiRequestLog`

Example scopes:

- `courses.read`
- `enrollments.read`
- `users.read`
- `webhooks.manage`

### 6. Webhooks

Recommended approach:

- Event subscription registry with endpoint URL, signing secret, enabled events, retry policy, and delivery status
- HMAC signing for each webhook payload
- Queue-based delivery with retries and dead-letter tracking
- Replay support for failed deliveries

Suggested events:

- `user.created`
- `user.updated`
- `enrollment.created`
- `payment.succeeded`
- `payment.refunded`
- `certificate.issued`
- `course.published`

Suggested models:

- `WebhookEndpoint`
- `WebhookDelivery`

### 7. LMS Standards Support (SCORM, xAPI)

Recommended order:

1. xAPI statement generation for internal tracking
2. xAPI statement forwarding to external LRS systems
3. SCORM package import and launch support

Recommended notes:

- xAPI fits modern analytics and external learning record stores better than SCORM alone
- SCORM import support should begin with packaging, metadata extraction, launch URL management, and completion tracking
- Full SCORM runtime support is larger than a basic file-import feature and should be treated as its own project slice

Likely additions:

- `LearningObject` or `ScormPackage` model
- xAPI statement service and outbound connector
- Launch session tokens for SCORM content

## Suggested Phases

### Phase 1

- Permission catalog endpoint
- Audit logging for permission changes
- API key models and public API read scopes

### Phase 2

- Webhook registry and signed deliveries
- Privacy request workflows and export jobs
- TOTP 2FA for admins

### Phase 3

- Google OAuth linking and login
- Stream-only content policies and watermarking
- xAPI statement generation

### Phase 4

- SCORM import and launch support
- Advanced piracy detection and suspicious-access alerts
- Automated retention and deletion policies

## Implementation Notes

- Permission assignment should remain admin-only even though permission checks are now supported broadly. This prevents delegated staff from granting themselves new capabilities.
- Permission changes should invalidate active sessions or force token refresh for immediate effect across devices.
- GDPR-style deletion must be policy-aware because payments, audit logs, and certificates may need partial retention for legal or fraud-prevention reasons.
- Public API, webhooks, and LMS-standard features should all use the same audit logging and permission foundation.
