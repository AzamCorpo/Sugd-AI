# Security Specification

## Data Invariants
1. A user document `/users/{userId}` can only be created by the authenticated user `userId`.
2. A `username` string must be between 3 and 20 characters, alphanumeric and underscores only.
3. To reserve a username, the user must update `/usernames/{username}` with their `userId` atomically alongside the `/users/{userId}` record or enforce that the registry is written correctly.
4. Users cannot change their `isAdmin` flag to true on creation or update. Only admins can assign it (or we bootstrap an email via rules).
5. Only admins can list users. Users can only fetch their own profile.
6. The user must be verified (`request.auth.token.email_verified == true`) to write - wait, for Google Login this is true by default.

## The "Dirty Dozen" Payloads
1. Create user with mismatching UID in path.
2. Create user with `isAdmin: true` by non-admin.
3. Update own `isAdmin` flag to true.
4. Create username reservation with another user's UID.
5. Create user missing `username` field.
6. Create user with invalid username format.
7. Create username reservation without corresponding `userId` set correctly.
8. Read another user's private profile.
9. Delete own user document without cleaning up username (deletion not allowed in this simple spec).
10. Update username to a different one without reserving it in the registry (using `hasOnly()` checks).
11. Query `/users/` list as non-admin.
12. Exploit 1MB string for username ID.

## Master Source of Truth
* `users/{userId}` represents the profile. Admin access is checked by evaluating the boolean field `isAdmin` inside `/users/{userId}` or comparing it with our bootstrap admin email (e.g., azamashrapov2705@gmail.com).

## Bootstrapped Admin
The admin will be `azamashrapov2705@gmail.com`.
