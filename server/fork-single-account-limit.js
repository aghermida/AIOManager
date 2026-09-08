// [FORK-90001] Single-account limit: this instance only allows one account
// total. See CLAUDE.md fork sync conventions for why this logic lives here
// instead of inline in server/index.js.
//
// Called from the POST /api/sync/:id handler only when no row exists yet for
// the requested id (i.e. this would be a brand-new account, not an update to
// an existing one). Returns a reply body to send with status 403 if the
// instance already has an account, or null if claiming is allowed.
export async function rejectIfSingleAccountLimitReached(db, reply) {
    const { count } = await db.get('SELECT COUNT(*) as count FROM kv_store')
    if (Number(count) >= 1) {
        reply.status(403)
        return { error: 'This instance is limited to a single account. Delete the existing account first.' }
    }
    return null
}
