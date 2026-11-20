# Firestore Security Specification (Workspace Key Isolation + Eight Pillars)

## 1. Data Invariants
1. Top-level `/workspaces` collection forbids `list` (`allow list: if false`) so workspace IDs cannot be enumerated or scraped.
2. Every document under `/workspaces/{workspaceId}/...` requires `workspaceId` matching `^[a-zA-Z0-9_\\-]+$` with length `6..128`, and `workspaceId` + `createdAt` are strictly immutable after creation.
3. All `createdAt` and `updatedAt` timestamps MUST equal `request.time` (server timestamp).
4. All document IDs (`settingId`, `studentId`, `sessionId`, `metaId`, `classKey`) must satisfy `^[a-zA-Z0-9_\\-]+$` and length `1..128`.
5. String, number, and list fields enforce strict types and size limits; unknown/shadow fields are rejected via `keys().hasAll(...)`, `keys().hasOnly(...)`, and `affectedKeys().hasOnly(...)`.
6. Every `allow list` checks `existing().workspaceId == workspaceId`.

## 2. Hardened Attack Checks (Must All Return PERMISSION_DENIED)
1. **Top-level workspace enumeration**: `list` on `/workspaces`.
2. **Root catch-all read/write**: any path outside `/workspaces/{workspaceId}/...`.
3. **Workspace ID mismatch on create**: creating under `/workspaces/ws_a/students/s1` with `workspaceId: "ws_b"`.
4. **Short/weak workspace ID**: `workspaceId` shorter than 6 characters (`"abc"`).
5. **Shadow field injection on create**: adding extra field `isAdmin: true`.
6. **Shadow field injection on update**: `affectedKeys` containing undeclared field.
7. **Workspace mutation on update**: changing `workspaceId`.
8. **Immutable `createdAt` tampering**: changing `createdAt` on update.
9. **Client-forged timestamp**: passing client string instead of `request.time`.
10. **ID poisoning**: document ID longer than 128 chars or containing `.` or `/`.
11. **Out-of-range scores / KKTP**: `dailyScore: 999` or `kktp: -10`.
12. **Cross-workspace list query**: querying documents whose `workspaceId != workspaceId`.
