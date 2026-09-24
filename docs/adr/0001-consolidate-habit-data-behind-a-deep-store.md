---
status: accepted
---

# Keep Habit UI State Direct in Zustand

The local-first UI needs immediate updates while IndexedDB remains the durable source of data. Concurrent Day changes and Habit deletion can overlap, and failed writes must not overwrite newer user intent.

UI modules select Habit state directly from Zustand, and stable named actions are the mutation interface. IndexedDB remains authoritative for persisted data. Day changes are optimistic, while Habit creation, editing, and deletion update Zustand only after persistence succeeds. Day persistence and Habit deletion are serialized per Habit; Habit edits remain outside that queue.

## Consequences

- Components do not maintain separate copies of Habit data.
- Day changes feel immediate but require rollback handling.
- Mutation coordination is centralized in the Habit entity's action layer.
- The action layer must preserve newer intent when earlier operations fail.
