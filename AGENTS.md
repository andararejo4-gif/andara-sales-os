<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All private screens live under the integration-compatible `_authenticated` layout; `/` and `/auth` are public login surfaces to prevent SSR session redirects.
- Account roles and staff hierarchy are protected rows in `user_roles`, never editable profile metadata; shared permissions and RLS enforce the document matrix plus explicit revision overrides.
- Role workspaces store scoped records in `work_items` with RLS and authenticated server functions; existing sales examples remain explicitly marked demo until operational data is connected.
- Assign staff roles through trusted database operations only; accounts without a role receive no application access, and no first-user privilege bootstrap is allowed.
- Operational revision data uses scoped projects, sales leads, transactions, activities, AI video publication records and calendar events; demo sales records never contribute to live totals or exports.
- Calendar reminders are durable in-app notifications generated idempotently by an authenticated managed scheduled callback using Asia/Jakarta dates.
- IT maintenance exposes authorized application records and audit logs only, never service credentials or arbitrary SQL execution.
- Lead mutations use authenticated transactional database RPCs with scoped authorization; IT submits immutable change requests approved by a scoped SM and applies each once to prevent approval bypass.
- Operational lead screens, commission summaries, KPI records and social analytics links read persisted scoped records; account roles stay separate from user-editable biodata to prevent privilege escalation.
