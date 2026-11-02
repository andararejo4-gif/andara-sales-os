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
- Account roles are protected rows in `user_roles`, never editable profile metadata; screen permissions follow the document matrix in a shared helper.
- Role workspaces store scoped records in `work_items` with RLS and authenticated server functions; existing sales examples remain explicitly marked demo until operational data is connected.
- Assign staff roles through trusted database operations only; accounts without a role receive no application access, and no first-user privilege bootstrap is allowed.
