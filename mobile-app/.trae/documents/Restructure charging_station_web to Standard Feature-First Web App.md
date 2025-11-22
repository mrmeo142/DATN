## Overview
I will upgrade `app/(tabs)/account.jsx` into a full-featured account management page where users can:
1) View and update profile fields (name, DOB, phone, email),
2) Change avatar by tapping the avatar frame,
3) Verify changes for email and phone via code entry,
4) Logout safely (clear token, navigate to login).
The UI will match the app’s existing background/overlay style and follow the patterns used in Home/History.

## Data & APIs
- Load current profile: `GET /api/user/profile` with `Authorization: Bearer <jwt>` (already used).
- Update profile: `PUT /api/user/profile` with body `{ fullname, dob, phone, email }` (date as ISO string).
- Start verification (email/phone change): `POST /api/user/verify/start` with `{ type: 'email'|'phone', value: string }`.
- Confirm verification: `POST /api/user/verify/confirm` with `{ type, code }`.
- Upload avatar: `POST /api/user/avatar` with `FormData` containing `file`.
- Logout: clear `SecureStore('jwt')`, route to `/(tabs)/home` or `/loginScreen`.

## API Client Adjustment
- `utils/api.js` currently sets `Content-Type: application/json` by default. For `FormData` uploads we will add an `apiUpload(path, formData, options?)` that calls `fetch` without the default JSON header so boundary is set automatically.
- All other JSON calls continue through `apiGet`/`apiPost`.

## UI/UX Details
- Avatar frame at top:
  - Shows current avatar if available; otherwise a placeholder initial.
  - Tap to change: open image picker, preview, then upload.
- Profile form fields:
  - `Full Name` (text), `DOB` (date picker), `Phone` (number), `Email` (email).
  - Save button submits changes.
- Email/Phone verification:
  - When either field is changed and user taps `Verify`, open a modal to enter code.
  - After successful verification, mark the field as verified and allow saving.
- Feedback:
  - Loading indicators for fetch/upload.
  - Inline validation messages for phone/email formats.
  - Success/error toasts/alerts on actions.
- Logout button at bottom; styled consistent with primary/secondary buttons.

## Dependencies
- Add `expo-image-picker` (compatible with Expo SDK 54) to select avatar image.
- Use `@react-native-community/datetimepicker` (already present) for DOB selection.

## State & Flow
1. On mount: load profile to prefill form.
2. Edit name/DOB freely; edit email/phone requires passing validation.
3. Tap `Verify` next to email/phone → send code, open modal; submit code to confirm.
4. Tap avatar to pick image → show preview → upload via `apiUpload` → refresh avatar.
5. Save: `PUT /api/user/profile` with updated fields.
6. Logout clears token and navigates to login.

## Validation Rules
- Name: non-empty, min length 2.
- DOB: valid date; optional depending on backend requirements.
- Email: uses `isValidEmail` logic similar to `verifyCode.jsx`.
- Phone: `isValidPhone` (10 digits), reusing logic from `verifyCode.jsx`.

## Implementation Steps
1. Extend `account.jsx` with local state for fields, avatar, loading, verification state.
2. Build UI: avatar frame, inputs, date picker, Verify buttons, modal for code, Save and Logout.
3. Wire image picker; implement `apiUpload` in `utils/api.js` for avatar.
4. Hook up verification start/confirm endpoints; guard Save until verified when email/phone changed.
5. Persist changes via PUT; reload profile.
6. Implement logout using `SecureStore.deleteItemAsync('jwt')` and route to `/loginScreen`.

## Verification
- Manual test flows:
  - Load profile; edit basic fields and save.
  - Change email/phone, send code, confirm, then save.
  - Change avatar and ensure it updates.
  - Logout and re-login.
- Web preview to validate UI layout.

## Deliverables
- Updated `account.jsx` with complete UI/logic.
- `utils/api.js` extended with `apiUpload` for avatar.
- Minimal validation helpers reusing existing patterns.
- No secrets committed; headers only pass token from `SecureStore`.

## Notes
- If your backend endpoints differ, I will adapt the paths and payloads accordingly during implementation. Confirm to proceed and I’ll implement the changes end-to-end.