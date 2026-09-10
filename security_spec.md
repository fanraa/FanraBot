# Firestore Security Rules Specification

## 1. Data Invariants

- **BotConfig (`configs/main`)**: Ensures the layout of global config is strict and can only be set or read by authorized administrative services or validated client structures.
- **Session (`configs/session`)**: Connection tokens and state fields for Baileys can only be written by system server controllers and verified owners.
- **Analytics (`configs/analytics`)**: Metric states must consist of strict numeric formats incremented logically by backend workers.
- **Command (`commands/{commandId}`)**: Only formatted custom names starting with valid slash (e.g., `'/'`) or special symbols and verified fields are legal.
- **Provider (`providers/{providerId}`)**: Valid API keys or status identifiers cannot be empty or malformed.
- **User (`users/{email}`)**: Accounts require emails that match their ID key precisely. Password crypt hashes are never exposed directly to external unsigned queries.
- **Otp (`otp_requests/{email}`)**: Verification attempts must scale down securely with bounded attempts (<= 5).

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads intended to bypass security logic, which must be strictly rejected by the security rules:

1. **Self-Assigned Admin User Role**: `{ "role": "admin", "email": "attacker@hack.com" }` to `users/attacker@hack.com`.
2. **Missing Invariant Credentials**: `{ "username": "Hacker" }` to `users/missing@hack.com` (missing mandatory `passwordHash` and `isVerified`).
3. **Invalid Email Key Registration mismatch**: Registering email data `{ "email": "target@victim.com", "username": "attacker" }` under `users/attacker@hack.com`.
4. **Denial of Wallet ID (Giant ID Poisoning)**: Document creation of `commands/` with an ID containing > 128 characters or special symbols like `$$%^`.
5. **Session Injection State bypass**: Inserting `{ "creds": {}, "injectedState": "hacked" }` under `configs/session`.
6. **Provider Key Theft read attempt**: Unauthenticated user trying to read `providers/gemini`.
7. **Bypassing Invalidation Limits (Expired OTP)**: Creating OTP with `expiredAt` of `9999999999999` to keep the code immortal.
8. **Negative OTP Verification attempts count**: Setting `attempts: -1` to allow infinite attempts.
9. **String Poisoning in Analytics (Memory exhaustion)**: Writing a 2MB giant string into `pesanTerkirim` in `configs/analytics`.
10. **Shadow state modification on Config**: Attempting to alter only `systemPrompt` without required `ownerNumber` and `botName` under `configs/main`.
11. **Malicious Slash Command Path injection**: Setting custom command name to `"<script>alert(1)</script>"`.
12. **Public Unsigned Read for User Data list**: Querying/listing all documents in `users/` collection without filtering by specific authenticated email.

---

## 3. The Test Spec Representation

Below is the structure of the validation logic. We will test these invariants and block the Dirty Dozen payloads inside `firestore.rules`.
