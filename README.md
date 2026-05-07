# Organic Tarabul Firebase E-commerce v2 Premium

This is the upgraded no-Firebase-Storage version. It is designed for Firebase Spark/free usage with media handled by public image/video URLs.

## New features

- Premium redesigned home page
- Highlighted `Organic Tarabul` brand
- Shareable product campaign links such as `/product/PRODUCT_ID/product-slug`
- Product image slideshow
- Multiple package cards visible at once
- Each package can have its own image
- Free delivery highlighted on every card and product page
- Editable products
- Editable categories
- Editable website name, hero content, WhatsApp number/message, and footer
- Floating WhatsApp button controlled by admin
- Registered customers can see their own order status
- Admin can update order status: pending, confirmed, processing, shipped, delivered, cancelled
- Admin dashboard can add more admins by Firebase Auth UID
- Professional footer with developer credit: `Dual School And College`
- No Firebase Storage dependency

## Run locally

```bash
npm install
npm run dev
```

If PowerShell blocks npm:

```bash
npm.cmd install
npm.cmd run dev
```

## Firebase setup

Enable:

```text
Authentication > Sign-in method > Email/Password
```

Use Realtime Database.

Import:

```text
firebase/seed-database.json
```

Publish rules from:

```text
firebase/database.rules.json
```

## Admin setup

1. Register from the website.
2. Verify your email.
3. Go to Firebase Console > Authentication > Users.
4. Copy your User UID.
5. Add this in Realtime Database:

```json
"admins": {
  "YOUR_UID_HERE": true
}
```

6. Logout and login again.
7. The Admin button will appear.

## Product media setup

This version does not upload images to Firebase Storage.

Use public direct image URLs:

```text
https://example.com/product.jpg
https://example.com/product.webp
```

For product videos, use YouTube links:

```text
https://www.youtube.com/watch?v=VIDEO_ID
```

Do not put Base64 images inside Realtime Database.

## Customer order status

Only registered and logged-in customers can see order status in `আমার অর্ডার`.

Guest customers can place orders, but they cannot later track the order from an account because there is no verified account identity attached to the order.
