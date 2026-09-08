// [FORK-ONLY: single-account-limit] this instance only allows one account
// total. See CLAUDE.md fork sync conventions for why this logic lives here
// instead of inline in a shared route file.
//
// Called from the sync route's POST /api/sync/:id handler only when no row
// exists yet for the requested id (i.e. this would be a brand-new account,
// not an update to an existing one). Returns a reply body to send with
// status 403 if the instance already has an account, or null if claiming
// is allowed. `runner` is whatever has a `.get(sql, params)` in scope at the
// call site (the raw db handle on main, the active tx on beta).
//
// kv_store also holds non-account bookkeeping rows (e.g. beta's
// "migration:<name>" markers in server/database/setup.js) that are inserted
// without a password. Only rows with a password represent a real account, so
// the count must exclude password IS NULL or it over-counts and locks out
// the very first account.
export async function rejectIfSingleAccountLimitReached(runner, reply) {
    const { count } = await runner.get('SELECT COUNT(*) as count FROM kv_store WHERE password IS NOT NULL')
    if (Number(count) >= 1) {
        reply.status(403)
        return { error: 'This instance is limited to a single account. Delete the existing account first.' }
    }
    return null
}
