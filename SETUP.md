# DESIGNHUB GLOBAL — PRODUCTION DEPLOYMENT & SETUP GUIDE

> **Website:** [https://wearstay.com/](https://wearstay.com/)  
> **Brand:** DESIGNHUB GLOBAL (Prepress, AI Studio & Architectural Signage)  
> **Commercial Division:** NEON POWER Commercial Signage Fabrication  
> **Support Phone / WhatsApp:** +91 93549 44438  
> **Business Email:** ledsignadil@gmail.com  
> **Verified UPI ID:** ledsignadil@oksbi  

---

## 1. ARCHITECTURE & PRODUCTION HIGHLIGHTS

DESIGNHUB GLOBAL has been upgraded from a browser-only demo into a production-grade full-stack web application:

1. **Google Authentication (Firebase Auth):** Real popup/redirect Google sign-in. Saves user profile (UID, display name, email, avatar) in Firestore `users/{uid}`.
2. **Primary Database (Firebase Firestore):** Persistent collections for `users`, `orders`, `quotations`, `projects`, `payments`, `leads`, and `site_config`.
3. **Cloud File Storage (Firebase Storage):** Customer logo uploads, vector artwork, and blueprints are securely stored in Firebase Storage buckets under `order_attachments/{orderId}/` and user folders.
4. **Customer Dashboard:** Real-time visibility of quotation drafts, previous orders, order statuses (`Received`, `In Production`, `Quality Check`, `Dispatched`, `Installed`), payment status (`Advance Pending`, `Verified`, `Advance Paid`), and saved canvas designs.
5. **Fixed Live Quotation Engine:** Corrected all state-assignment bugs where `total` and `advance` were previously disconnected from state. Multi-unit CAD calculations (`mm`, `inch`, `cm`, `ft`, `m`) with live GST 18%, 50% advance, and balance calculations.
6. **Production Payment Flow:**
   - **India UPI:** Live dynamic QR code and 1-tap deep link generated with exact 50% advance deposit. Instant UTR / transaction submission form updates Firestore status to `pending_verification`.
   - **PayPal:** Secure automated USD checkout with transaction capture and status syncing in Firestore.
7. **Role-Based Admin Panel:** Restricted to `ledsignadil@gmail.com` with order management, payment status verification, customer leads view, dynamic pricing editor, and CSV export.
8. **SEO, GA4 & AdSense:**
   - Single production domain configuration variable: `PRODUCTION_DOMAIN`.
   - Schema.org structured data (Organization, LocalBusiness, WebSite, Service, FAQPage).
   - Sitemap (`/sitemap.xml`) and robots (`/robots.txt`).
   - Clear placeholder for Google Search Console verification token (`GOOGLE_SEARCH_CONSOLE_CODE`).
   - Google AdSense integration zones (`ca-pub-XXXXXXXXXXXXXXXX`) separated from action buttons.
   - Compliant legal pages: Privacy Policy (`/privacy.html`), Terms (`/terms.html`), Cookie Policy (`/cookie-policy.html`).

---

## 2. STEP-BY-STEP FIREBASE SETUP

Your project has been provisioned and configured with Firebase:
- **Project ID:** `hybrid-dolphin-418212`
- **Firestore Database ID:** `ai-studio-remixremixcustom-ee618c06-9585-4322-9a93-6a4e92aca694`
- **Storage Bucket:** `hybrid-dolphin-418212.firebasestorage.app`

### Step A: Enable Google Sign-In in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/) and open project **`hybrid-dolphin-418212`**.
2. Click **Build** &rarr; **Authentication** in the left menu.
3. Open the **Sign-in method** tab and click **Google**.
4. Enable the provider, select your project support email (`ledsignadil@gmail.com`), and save.
5. In **Authorized Domains**, verify that your custom production domain (e.g. `wearstay.com`, `localhost`) is added.

### Step B: Security Rules
- **Firestore Rules:** Already generated and deployed in `firestore.rules`.
  - Customers can read and create their own orders, quotations, and projects.
  - Customers cannot alter `orderStatus` or `paymentStatus`.
  - Admin (`ledsignadil@gmail.com`) has complete administrative access.
- **Storage Rules:** Stored in `storage.rules`.
  - Allows authenticated uploads under 20MB.

---

## 3. DOMAIN CONFIGURATION (CRITICAL)

To deploy on a new domain or change `https://wearstay.com/`:
1. In `index.html`, update the configuration block:
   ```html
   <script>
     window.PRODUCTION_DOMAIN = "https://your-custom-domain.com";
     window.VITE_GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
     window.ADSENSE_PUB_ID = "ca-pub-XXXXXXXXXXXXXXXX";
   </script>
   ```
2. In `.env`:
   ```ini
   PRODUCTION_DOMAIN=https://your-custom-domain.com
   APP_URL=https://your-custom-domain.com
   ```
3. In `public/robots.txt` & `public/sitemap.xml`, replace the URL with your domain.

---

## 4. GOOGLE ANALYTICS 4 (GA4) SETUP

1. Go to [Google Analytics](https://analytics.google.com/) &rarr; **Admin** &rarr; **Data Streams**.
2. Create a Web stream for your domain.
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`).
4. Replace `G-XXXXXXXXXX` in `index.html` or set `VITE_GA_MEASUREMENT_ID` in `.env`.
5. Events tracked automatically:
   - `page_view`
   - `login`
   - `generate_lead`
   - `quote_started` & `quote_completed`
   - `file_upload`
   - `file_conversion`
   - `project_saved`
   - `checkout_started`
   - `payment_started`, `payment_success`, `payment_failed`
   - `whatsapp_click`

---

## 5. GOOGLE SEARCH CONSOLE VERIFICATION

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add your property (e.g., `https://wearstay.com/`).
3. Choose the **HTML Tag** verification method.
4. Copy your verification token (e.g., `dB7...8xQ`).
5. In `index.html`, replace:
   ```html
   <meta name="google-site-verification" content="GOOGLE_SEARCH_CONSOLE_VERIFICATION_TOKEN">
   ```
   with your token:
   ```html
   <meta name="google-site-verification" content="dB7...8xQ">
   ```
6. Click **Verify** in Search Console.

---

## 6. GOOGLE ADSENSE INTEGRATION

1. Obtain your approved AdSense Publisher ID (e.g., `ca-pub-1234567890123456`).
2. Update `window.ADSENSE_PUB_ID` in `index.html`.
3. In `index.html`, paste your AdSense script in `<head>`:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
4. Insert your `<ins class="adsbygoogle" ...></ins>` tags into the designated `.ad-slot` sections.

---

## 7. BUILD & RUN COMMANDS

```bash
# 1. Install dependencies
npm install

# 2. Build production assets
npm run build

# 3. Start production server on Port 3000
npm start
```
The server will start on port 3000, serving your frontend bundle with real Firebase authentication, Firestore synchronization, UPI QR generation, and PayPal payment handling.
