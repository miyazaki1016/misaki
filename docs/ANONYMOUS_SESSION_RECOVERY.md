# Anonymous session recovery

## Behavior
Healthy anonymous sessions continue through the existing APIs. Expired and unverifiable temporary state remain distinct failures. Neither failure automatically deletes state, changes the original identity or renews its expiry.

After a failed state load, sending remains disabled. The user can explicitly choose to keep the old state and start an independent conversation, with a second confirmation. A full navigation creates a new anonymous auth context in a tab-local session-storage namespace. No original auth token, temporary token, pending request, memory or history is imported. Registered users cannot invoke this recovery operation.

The new context uses the existing chat, generation, canonical persistence and relationship logic. This is not a new memory foundation. Push ownership and notification registration changes are disabled in recovery contexts.

A restored response is not proof of a new generation. Acceptance must verify the new request, corresponding response, committed history and reload independently.

## Isolation and lifetime
Reloads in the same tab retain the recovery namespace. Original tabs retain their original namespace; independently recovered tabs use different namespaces. A duplicated tab can inherit its source namespace according to browser session-storage behavior. Existing revision checks reject stale writes. Anonymous roots are validated before returning replay tokens or receipts.

Closing a recovery tab may lose its session-storage credentials. Automatic cross-device recovery is not promised. Preserved namespaces are not automatically deleted and repeated recovery may accumulate local data and anonymous auth users. Existing healthy-session expiry behavior is unchanged; this change does not implement per-item memory retention.

## Validation
- Full Node regression: 340 passing runner cases, including imported existing test registrations.
- TypeScript and Next production build: pass.
- Synthetic state/API round trips: distinct new input, corresponding scripted response, committed pair and reload; no old-state prompt contamination.
- Actual chat component with controlled hooks/HTTP: 410/409 messages, disabled send, cancellation, explicit navigation, registered-user refusal and healthy state.
- Installed auth SDK with synthetic transport: isolated auth creation, reload, separate scopes, unchanged old credentials.
- Source-level privacy checks for chat/history/canonical/persona fallback logging: no raw response, conversation or arbitrary exception payloads in reviewed entry modules.

Not verified: live auth service, production data writes, live model responses, real multi-connection Postgres races, Safari/Chrome/in-app browser layout and storage/BFCache behavior. No live services are used by the added tests.

## CI and release
The existing PR workflow runs npm ci, npm test, TypeScript and Next build. No workflow, dependency, environment variable, migration or DB configuration changes are required. Main pushes can automatically deploy through the existing Vercel connection and trigger unrelated inventory/ledger workflows. Do not merge without explicit release approval and review of the exact head.

Before release, test old anonymous and registered contexts plus a separate recovery context on Safari, Chrome and an in-app browser. Test confirm/cancel, reload, back, duplicate tab, concurrent turns and auth switching. Failed/unverifiable legacy states must remain preserved.

For a live one-round-trip check, obtain separate authorization for an isolated synthetic anonymous user, authentication/root/receipt/relationship writes and one model/usage charge. Match request ID, new response, persistence and reload without exposing message contents or credentials. No new paid contract or API key is required by this implementation.

## Rollback
Record the then-current production deployment and commit before release. On a release-related failure, route traffic to that prior production deployment and revert only this PR in a new reviewed change. Do not reset DB, auth, cache or memory and do not auto-merge preserved recovery data into an original account.

The old build does not understand recovery namespaces. New recovery conversations may be inaccessible through that old UI after rollback even though their data remains; preserving credentials alone does not guarantee restore after tab closure or logout. Prefer a reviewed forward fix to restore access. Recheck Vercel production auto-assignment after rollback, as its behavior can change. No rollback action is executed by this document.
