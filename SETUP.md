# DESIGNHUB GLOBAL — PRODUCTION DEPLOYMENT & SETUP GUIDE

> **Website:** [https://wearstay.com/](https://wearstay.com/)  
> **Brand:** DESIGNHUB GLOBAL (Prepress & AI Design Studio)  
> **Signage Division:** NEON POWER Commercial Fabrication (+91 93549 44438)

---

## 1. 📦 DOWNLOAD COMPLETE PROJECT
Your entire ready-to-deploy project is packaged as a ZIP archive:
- **Direct Server Link:** `https://wearstay.com/api/download-project` (or click the **"⬇ Download Project (ZIP)"** button in the header).
- **Archive File Location:** `public/designhub-global-production.zip`

---

## 2. ⚡ QUICK START (LOCAL ENVIRONMENT)

```bash
# 1. Extract downloaded zip or clone repository
cd designhub-global

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env

# 4. Start Development Server (runs on Port 3000)
npm run dev

# 5. Build for Production
npm run build

# 6. Start Production Server
npm start
```

---

## 3. 🔑 REQUIRED ENVIRONMENT VARIABLES (`.env`)

Create a `.env` file in the project root:

```ini
PORT=3000
NODE_ENV=production
APP_URL=https://wearstay.com

# -------------------------------------------------------------
# 1. SUPABASE (Database & Google Authentication)
# -------------------------------------------------------------
# Supabase Dashboard -> Project Settings -> API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# -------------------------------------------------------------
# 2. ADMIN USER (Signage Orders & Rate Manager)
# -------------------------------------------------------------
ADMIN_EMAILS=ledsignadil@gmail.com

# -------------------------------------------------------------
# 3. PAYPAL PRO SUBSCRIPTION ($4.99/mo) & WEBHOOK
# -------------------------------------------------------------
# developer.paypal.com -> Apps & Credentials
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret_key
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# -------------------------------------------------------------
# 4. OPTIONAL AI & TOOL APIs
# -------------------------------------------------------------
GEMINI_API_KEY=your_google_gemini_api_key
BACKGROUND_REMOVAL_API_KEY=your_clipdrop_or_remove_bg_api_key
```

---

## 4. 🗄️ SUPABASE DATABASE SETUP (1-CLICK)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **SQL Editor** in the left sidebar.
3. Open `supabase/schema.sql` from this project, paste the SQL query, and click **Run**.
4. This instantly configures:
   - `profiles` table (with admin privileges auto-assigned to `ledsignadil@gmail.com`).
   - `export_usage` table (strictly enforcing 2 free exports per user).
   - `subscriptions` table ($4.99/mo Pro recurring status).
   - `projects` table (stores design files, physical canvas sizes, and JSON states).
   - `signage_orders` table (stores commercial orders and uploads).
   - `pricing_rules` table (dynamic rate editor for products and materials).
   - Automatic triggers & Row Level Security (RLS) policies.

---

## 5. 🔐 GOOGLE OAUTH SETUP

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create **OAuth 2.0 Client ID** (Type: Web application).
3. In **Authorized redirect URIs**, enter:
   `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
4. Copy your **Client ID** and **Client Secret**.
5. In your Supabase Dashboard, go to **Authentication** → **Providers** → **Google**:
   - Turn **ON** Google.
   - Paste Client ID & Client Secret.
   - Set Site URL to `https://wearstay.com`.

---

## 6. 💳 PAYPAL PRO ($4.99/MO) & WEBHOOK SETUP

1. Log in to [developer.paypal.com](https://developer.paypal.com).
2. Create a REST App (Live mode for production).
3. Under **Webhooks**, click **Add Webhook**:
   - **Webhook URL:** `https://wearstay.com/api/paypal/webhook`
   - **Event Types:**
     - `Billing subscriptions activated` (`BILLING.SUBSCRIPTION.ACTIVATED`)
     - `Payment sale completed` (`PAYMENT.SALE.COMPLETED`)
     - `Checkout order approved` (`CHECKOUT.ORDER.APPROVED`)
4. Copy the Webhook ID to `PAYPAL_WEBHOOK_ID` in `.env`.
5. Direct Live Pro Payment Button:
   `https://www.paypal.com/ncp/payment/GN99BSA7E4L3Y`

---

## 7. 🏷️ SIGNAGE PRODUCTS & RATE ENGINE (NEON POWER)

Current configured base rates (editable live by Admin):
- **Advertising Acrylic Letter + Logo + Light:** ₹80 / inch
- **Steel Letter:** ₹140 / inch
- **ACP Sign Board:** ₹650 / sq.ft
- **3D Sign Board:** ₹750 / sq.ft
- **Steel Sign Board:** ₹980 / sq.ft
- **LED / Glow Sign:** ₹700 / sq.ft
- **Backlit Architectural Board:** ₹700 / sq.ft
- **Name Plate (Acrylic):** ₹7 / sq.in
- **Name Plate (Metal SS):** ₹9 / sq.in

**Commercial Advance:** 50% advance via UPI (`ledsignadil@oksbi`) or PayPal.  
**GST Rate:** 18% automatically calculated in itemized quotation.  
**Phone:** +91 93549 44438

---

## 8. 🌐 GODADDY DNS CONFIGURATION FOR WEARSTAY.COM

In your GoDaddy DNS records for **wearstay.com**:

| Type | Name | Target / Value | TTL |
|------|------|----------------|-----|
| **A** | `@` | Your Server IP (e.g. VPS or hosting static IP) | 600s |
| **CNAME** | `www` | `wearstay.com` | 1 Hour |

---

## 9. 🚀 HOSTING DEPLOYMENT OPTIONS

### Option A: Standard Node.js VPS / Docker (DigitalOcean, Hetzner, AWS, Render)
```bash
npm install
npm run build
NODE_ENV=production npm start
```

### Option B: Deploying to Vercel
1. Push repository to GitHub.
2. Import project in Vercel.
3. Framework Preset: **Vite**.
4. Add environment variables from `.env`.
5. Connect custom domain `wearstay.com`.
