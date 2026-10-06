# DESIGNHUB GLOBAL — Production SaaS Application

> **Tagline:** Create. Edit. Design. Convert. Download.  
> **Headline:** A New Global Standard for Simple Design & File Work.  
> **Official Domain:** [https://www.wearstay.com/](https://www.wearstay.com/)  
> **Integrated Signage Division:** NEON POWER Architectural Fabrication (+91 93549 44438)

---

## 🌟 Overview

**DESIGNHUB GLOBAL** is a full-stack digital creative and file-work platform built for beginners and professionals on mobile, tablet, and desktop. It integrates:
1. **Interactive Design Studio**: Editable canvas supporting text typography, image layers, shapes, rotation, opacity, and unit conversions (`mm`, `cm`, `inch`, `ft`, `m`).
2. **AI Voice & Natural Language Studio**: Natural language design commands in English, Hindi, and Urdu parsed into safe, structured JSON actions without arbitrary code execution.
3. **Universal File Converter**: Drag & drop file converter supporting client-side PNG, JPG, PDF, SVG, WebP with honest server-side hooks for proprietary vector formats (CDR, AI, EPS).
4. **Cloud Project Storage**: Full persistence to PostgreSQL / Supabase with project duplication, renaming, opening, and deletion across devices.
5. **Strict 2-Free-Export Gate**: Free Google/Email accounts receive 2 free exports before prompting for the $4.99/month Pro subscription or India UPI.
6. **NEON POWER Signage Order Wizard**: 9-step custom architectural fabrication inquiry flow with real-time unit calculation (sq.ft, sq.in, running inch), material multipliers, warranty tiers (1–50 yrs), delivery, installation, 18% GST, and 50% advance payment calculation.
7. **Protected Admin Dashboard**: Live order management, pricing rate editor, and system metrics restricted strictly to authorized administrative accounts (`ledsignadil@gmail.com`).

---

## 🏗️ Architecture & Tech Stack

- **Runtime & Backend:** Node.js + Express (`server.ts`) with Vite middlewares in development.
- **Frontend Engine:** HTML5 Canvas, SVG serialization, and jsPDF vector export.
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) policies and Google OAuth provider.
- **Payment Processing:** PayPal Pro Subscription (`$4.99/mo`), PayPal Webhook verification, and direct India UPI QR (`ledsignadil@oksbi`).
- **SEO & Social:** OpenGraph, Twitter Cards, Schema.org JSON-LD structured data, `robots.txt`, and XML sitemap for `wearstay.com`.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Start development server (Port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔐 Environment Variables (`.env`)

```ini
# Server Configuration
PORT=3000
NODE_ENV=production
APP_URL=https://www.wearstay.com

# 1. Supabase (Project Settings -> API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# 2. Administrative Accounts
ADMIN_EMAILS=ledsignadil@gmail.com

# 3. PayPal Configuration (developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret_key
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# 4. Optional AI & Tool APIs
GEMINI_API_KEY=your_gemini_api_key
BACKGROUND_REMOVAL_API_KEY=your_clipdrop_or_remove_bg_key
```

---

## 🗄️ Database Setup (Supabase)

1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Run the complete script in `supabase/schema.sql`.
3. This creates:
   - `profiles`: user accounts with auto-assigned admin role for `ledsignadil@gmail.com`.
   - `export_usage`: server-enforced quota counter.
   - `export_logs`: audit history of user exports.
   - `subscriptions`: Pro subscriber records.
   - `projects`: user design files, dimensions, and canvas JSON state.
   - `signage_orders`: physical fabrication orders queue.
   - `pricing_rules`: admin-editable rates for products and materials.
   - `payment_records`: webhook and transaction logs.
   - Automatic triggers and Row Level Security (RLS) policies.

---

## 🌐 GoDaddy DNS Configuration for wearstay.com

In your GoDaddy DNS records for **wearstay.com**:

| Type | Name | Value / Target | TTL |
|------|------|----------------|-----|
| **A** | `@` | Server IP Address (e.g. VPS or hosting static IP) | 600s |
| **CNAME** | `www` | `wearstay.com` (or Vercel / Render alias) | 1 hour |

---

## 📦 Production Deployment

### Option A: Standard Node.js / Docker / VPS (DigitalOcean, Render, Railway, Fly.io)

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

### Option B: Deploying with Vercel

1. Push repository to GitHub.
2. In Vercel, click **Add New Project** and select your repository.
3. Set **Framework Preset**: Vite.
4. Set **Build Command**: `npm run build` and **Output Directory**: `dist`.
5. Add environment variables from `.env`.
6. Add custom domain `wearstay.com` in Project Settings > Domains.

---

## 💼 Business & Contact Reference

- **Brand:** DESIGNHUB GLOBAL
- **Signage Division:** NEON POWER
- **Phone / WhatsApp:** +91 93549 44438
- **Official UPI ID:** `ledsignadil@oksbi`
- **PayPal Payment Link:** `https://www.paypal.com/ncp/payment/GN99BSA7E4L3Y`
- **Signage Advance:** 50%
- **GST:** 18%
