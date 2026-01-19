# Problem → Feature Mapping

This section explicitly maps the NGO operational problems to concrete platform features.

## Lack of transparency
- **Feature:** Donor dashboard (read-only) + exportable impact CSV
- **How it helps:** Donors can independently validate aggregate metrics without relying on manual narratives.

## Weak impact reporting
- **Feature:** Impact snapshot metrics (training, opportunities, placements), export endpoint, audit logging of exports
- **How it helps:** Standardizes reporting and reduces spreadsheet drift.

## Poor donor trust
- **Feature:** Read-only donor role, immutable audit trail for key actions (exports, user creation, status changes)
- **How it helps:** Demonstrates governance and control.

## Fragmented training systems
- **Feature:** Central training modules, items, file storage, and completion tracking per talent
- **How it helps:** Eliminates multiple tools and enables consistent progress data.

## Manual tracking of talent
- **Feature:** LinkedIn-style talent profile (skills, experience, education) with structured tables + searchable index
- **How it helps:** Replaces ad-hoc documents and enables filtering for placements.

## Poor employer engagement
- **Feature:** Company portal for posting opportunities, viewing applications, and messaging
- **How it helps:** Lowers friction and increases responsiveness.

## No audit trail
- **Feature:** `audit_events` with actor, action, entity, timestamp, and metadata
- **How it helps:** Enables reviews, accountability, and compliance investigations.

## Weak monitoring & evaluation
- **Feature:** Training completion metrics + application status pipeline
- **How it helps:** Supports M&E with measurable indicators.

## Low programme scalability
- **Feature:** Role-based access control, normalized data model, central dashboards
- **How it helps:** Enables controlled growth without manual processes.

## Poor stakeholder communication
- **Feature:** Structured messaging with guardrails (who can message whom)
- **How it helps:** Keeps communication inside the programme context.
