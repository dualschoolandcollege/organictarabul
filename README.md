# Organic Tarabul Firebase E-commerce

This is a complete React + Firebase e-commerce website with:

- Bengali product cards
- Firebase Email/Password login and registration
- Email verification after registration
- Guest checkout without login
- Required customer mobile number
- Optional customer name and address
- Product detail page with same-page order summary and submission
- Admin dashboard
- Category creation
- Product card creation
- Multiple image upload
- Product image URL support
- Video file upload
- Product video link support
- Multiple package/price options per product
- Admin order management
- Firebase Realtime Database seed JSON
- Firebase Realtime Database rules
- Firebase Storage rules

## 1. Install

```bash
npm install
npm run dev
```

## 2. Firebase Console setup

Enable these Firebase products:

1. Authentication > Sign-in method > Email/Password
2. Realtime Database
3. Storage
4. Hosting, if you want to deploy

Your Firebase config is already placed in `src/firebase.js`.

## 3. Import database JSON

Open Firebase Console:

Realtime Database > three-dot menu > Import JSON

Upload:

```text
firebase/seed-database.json
```

Important: replace this key first:

```json
"REPLACE_WITH_YOUR_FIREBASE_AUTH_UID": true
```

with your real Firebase Auth UID after creating/registering your admin account.

## 4. Add database rules

Realtime Database > Rules

Paste the content from:

```text
firebase/database.rules.json
```

## 5. Add storage rules

Storage > Rules

Paste the content from:

```text
firebase/storage.rules
```

Storage rules require a Firebase Auth custom claim:

```text
admin: true
```

This is intentional. Firebase Storage rules cannot safely read your Realtime Database `/admins` list. Do not weaken the rule in production.

## 6. Create the first admin

1. Register from the website using your email/password.
2. Verify your email.
3. Go to Firebase Console > Authentication > Users.
4. Copy your UID.
5. Replace `REPLACE_WITH_YOUR_FIREBASE_AUTH_UID` in the seed JSON, or manually add:

```json
admins: {
  "YOUR_UID": true
}
```

6. For Storage upload permission, set the custom claim using the script below.

## 7. Set admin custom claim

Go to:

Firebase Console > Project settings > Service accounts > Generate new private key

Save the downloaded file as:

```text
scripts/serviceAccountKey.json
```

Then run:

```bash
node scripts/setAdminClaim.cjs YOUR_FIREBASE_AUTH_UID
```

Sign out and sign in again after running the script.

## 8. Build

```bash
npm run build
```

## 9. Deploy with Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase use organictarabul
firebase deploy
```

## 10. Database schema

Main paths:

```text
settings
admins
users
categories
products
orders
```

A guest order is saved under:

```text
orders/{orderId}
```

Only mobile number is required. Name and address can be empty.

## 11. Important production warnings

Guest checkout means anybody can submit an order. The rules validate the order shape and mobile number, but this does not stop spam. For production, add Firebase App Check, rate limiting through Cloud Functions, or SMS OTP verification.

The Firebase web API key is not a secret, but your security rules are critical. Never leave Realtime Database or Storage open with public write access.
