# Security Specification - Team of the Season

## Data Invariants
1. A vote must have exactly 11 player slots filled in the lineup.
2. A vote must have 1 coach ID.
3. Each user can submit at most one vote (enforced by using userId as doc ID or checking existing). *Actually, let's use userId as doc ID to make it simple: one vote per user.*
4. `userId` in the data must match `request.auth.uid`.
5. `createdAt` must be `request.time`.

## The "Dirty Dozen" Payloads
1. **Unauthorized Vote**: Vote without being signed in.
2. **Identity Spoofing**: Signed in as User A, but setting `userId` to User B.
3. **Ghost Field**: Adding `isAdmin: true` to the vote document.
4. **Incomplete Lineup**: Submitting only 5 players.
5. **Missing Coach**: Submitting without a coach.
6. **Future Date**: Setting `createdAt` to a future timestamp.
7. **Bypassing Doc ID**: Trying to create a document with an arbitrary ID that doesn't match `userId` (if we enforce userId as docId).
8. **Malicious ID**: Using a 1MB string as a document ID.
9. **Resource Exhaustion**: Sending a massive 1MB string for `voterName`.
10. **Type Poisoning**: Sending an integer for `coachId`.
11. **Update Hijack**: Attempting to update another user's vote.
12. **Delete Attack**: Attempting to delete the `votes` collection.

## Test Cases (Implicit)
- Create with valid data: ALLOW
- Create with wrong `userId`: DENY
- Create without auth: DENY
- Update `createdAt`: DENY (immortal field)
- Update `userId`: DENY (immortal field)
- Update by non-owner: DENY
- Delete by non-owner: DENY
