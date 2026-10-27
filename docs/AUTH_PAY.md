# Emogame — Auth, cloud save, payments, chat safety

## Auth (guest by default)
- Default: **guest** local save (`EGSave` v4+).
- Link / login: **VK ID**, **OK**, **Yandex ID**, **Telegram Login**, **TikTok Login**.
- Client: `EGAuth` (`www/js/core/auth.js`) + `Platform.auth` bridges.
  - Android: `AppBridge` `vkLogin` / `yaLogin` / `tgLogin` / `ttLogin` / `okAvail`.
  - VK Mini Apps / OK: session from launch params (already signed-in); linking extras via ID SDK.
  - Web demo: stub login sets `displayName` + `linked[]` (no real OAuth until keys wired).
- Account screen: `SCR.account` — bind providers, phone verify, free-chat sub. **Never show user email in UI.** Persist only `displayName`, `provider`, `linked[]`, `verified`, `phoneMasked`. `email` stripped in `EGAuth._apply` and save migration v4.
- Cloud save: after link, `Net.register` + `Net.sync` / `progress` HMAC → game_backend `/v2`.

## Phone verification (RF)
User-to-user **free chat** (non-preset) requires:
1. Paid subscription flag `S.sub.freeChat` (product `sub_freechat`)
2. **Verified account** via phone through VK ID / Yandex / Telegram (`EGAuth.verifyPhone` → native OTP)

Preset phrase chat stays free for everyone (whitelist from `content/chat.json`).

## Chat safety
- Presets only unless `EGAuth.canFreeChat()`.
- `EGChatMod`: profanity filter, report, block → `S.mod.reports` / `S.mod.blocks` synced for admin queue.
- Upsell card in chat: «Свободный чат» → account (sub + verify).

## Payments
| Surface | Method |
|---------|--------|
| VK Mini Apps | `VKWebAppShowOrderBox` / votes |
| OK | OK payments via VK bridge (`vk_client=ok`) |
| Fotostrana | FS billing (`fs_id`) |
| Android | **RuStore Pay** (`RuStore.purchase` / `AppBridge.purchase`) primary; **YooKassa** (`YooKassa.checkout` / `B.yookassa`) fallback |
| Web demo | YooKassa stub returns success for QA |

Catalog: gems/coins packs + `sub_freechat`. Prices from backend shop / RC when present; Android defaults in `Platform.pay.items`. Suite keystore for RuStore AAB/APK.

## Admin
- Moderation queue for reports (game_backend admin title).
- No PII email on player-facing surfaces; support tools use opaque `player_id`.
