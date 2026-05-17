# Agrinovia Security Specification

## Data Invariants
1. A farm must belong to a valid user and have a name.
2. An AI report must belong to the user who triggers the analysis.
3. Users cannot change their own `uid` or `email` after registration.
4. Sensor data is associated with a farm.

## The "Dirty Dozen" Payloads

1. **Identity Theft (Create User)**: Attempt to create a user profile with a `uid` different from the auth UID.
2. **Identity Theft (Update User)**: Attempt to change the `uid` of an existing user profile.
3. **Privilege Escalation**: A non-admin user attempting to set their role to `admin`.
4. **Farm Hijacking**: Attempt to create a farm for another user by setting `ownerId` to someone else's UID.
5. **Orphaned Session**: Attempt to create a drone session for a non-existent farm.
6. **Shadow Field Injection**: Attempt to create a farm with a `isVerified: true` field not in the schema.
7. **Temporal Fraud**: Attempt to set `createdAt` to a past or future date instead of `request.time`.
8. **ID Poisoning**: Attempt to use a 2MB string as a document ID for a farm.
9. **PII Leakage**: Authenticated User A attempting to `get` the profile of User B.
10. **Query Scraping**: Authenticated User A attempting to `list` all farms without a filter.
11. **State Warp**: Attempt to update an AI report from 'completed' back to 'pending'.
12. **Massive Payload**: Attempt to inject 1MB of junk text into the `notes` field of a drone session.

## Test Runner (Logic Simulation)

*Verified against the following proposed rules.*
