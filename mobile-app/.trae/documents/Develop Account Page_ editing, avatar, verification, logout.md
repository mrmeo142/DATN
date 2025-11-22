## Overview
Implement a full-featured Account page under `app/(tabs)/account.jsx` allowing users to edit profile info (name, DOB, phone, email), change avatar, and logout. Integrate verification flows when changing email or phone, reusing the existing `verifyCode.jsx` screen and extending it as needed.

## UI Changes
- Keep existing background/overlay visual style for consistency.
- Add an avatar frame (circular) at top; tap to pick a new image and preview.
- Add editable inputs for `Full Name`, `DOB` (using `@react-native-community/datetimepicker`), `Phone`, `Email`.
- Add actions:
  - `Save Profile` (updates `fullname`, `dob`, `phone` — excludes email unless verified).
  - `Verify & Update Email` (starts email change verification flow).
  - `Verify & Update Phone` (starts phone change verification flow).
  - `Logout` button at bottom.
- Show `ActivityIndicator` while loading; show API error/success feedback.

## Data Flow & APIs
- Load profile via existing `GET /api/user/profile` with `Authorization: Bearer <jwt>`.
- Add helpers in `utils/api.js`:
  - `apiPatch(path, body, options)` for JSON PATCH/PUT.
  - `apiUpload(path, formData, options)` that sends `FormData` without forcing `Content-Type: application/json`.
- Server endpoints (assumptions; configurable):
  - Update profile (non-email/phone): `PATCH /api/user/profile` { fullname, dob, phone }.
  - Avatar upload: `POST /api/user/avatar` (multipart/form-data `file`). Returns new avatar URL.
  - Request email change: `POST /api/user/request-email-change` { email }.
  - Verify email change: `POST /api/user/verify-email-change` { email, code }.
  - Request phone change: `POST /api/user/request-phone-change` { phone }.
  - Verify phone change: `POST /api/user/verify-phone-change` { phone, code }.

## Verification Flows
- Extend `app/verifyCode.jsx` to support purposes:
  - `purpose === 'email-change'`: verify new email, then navigate back to account and reload profile.
  - `purpose === 'phone-change'`: verify new phone similarly.
- Navigation:
  - From Account page, after requesting a change, `router.push({ pathname: '/verifyCode', params: { purpose: 'email-change', email: newEmail } })` (or `phone-change`, `phone`).

## Avatar Handling
- Use `expo-image-picker` to select an image from library or camera.
- Show picked image in the avatar frame immediately.
- On `Save Avatar`, upload via `apiUpload('/api/user/avatar', formData, { headers: { Authorization } })`.
- After success, update local profile state with returned avatar URL.

## Logout
- Implement logout by deleting JWT via `SecureStore.deleteItemAsync('jwt')` and routing to `/loginScreen`.

## Dependencies
- Add `expo-image-picker` (and optionally `expo-image-manipulator` for sizing/cropping if needed).
- Reuse already-installed `@react-native-community/datetimepicker`.

## File Changes
- Update `app/(tabs)/account.jsx` to:
  - Render avatar and editable form, handle save/update actions, verification triggers, and logout.
- Update `utils/api.js` to add `apiPatch` and `apiUpload` helpers.
- Update `app/verifyCode.jsx` to handle `email-change` and `phone-change` purposes.

## Assumptions & Notes
- Endpoint names above are reasonable defaults; I’ll adapt to your backend if they differ.
- If avatar storage requires presigned URLs, I’ll switch upload to PUT against the provided URL.
- I will follow your existing styling and avoid introducing new UI libraries.

If this plan looks good, I’ll proceed to implement the UI, API helpers, verification additions, and wiring, then run the app to validate end‑to‑end.