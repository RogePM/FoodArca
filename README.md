# 🍎 Food Arca

**Modern Inventory & Client Management for Food Pantries.**

Food Arca is a comprehensive SaaS platform designed to streamline operations for food banks and pantries. It combines real-time inventory tracking, client distribution management, and automated alerts into a unified, easy-to-use dashboard.

Built with **Next.js 14**, it leverages a hybrid database architecture (Supabase + MongoDB) to offer robust authentication, scalable data storage, and seamless subscription billing via Stripe.

---

## ✨ Key Features

### 📦 Inventory Management

* **Real-time Tracking:** Monitor stock levels, expiration dates, and categories.
* **Barcode Scanning:** Integrated scanner for quick item lookups and additions.
* **Smart Alerts:** Automated notifications for low stock and expiring items.

### 👥 Client & Distribution

* **Family Tracking:** Manage client profiles, family sizes, and visit history.
* **Digital Distribution:** streamlined "checkout" process for logging food distributions.
* **Limits & Quotas:** Enforce visit limits based on pantry rules.

### ⚙️ Organization & Billing

* **Multi-Tenancy:** Switch between different pantry organizations easily.
* **Role-Based Access:** Secure permissions for admins and volunteers.
* **Subscription Management:** Integrated Stripe billing for Pilot vs. Pro tiers.

---

## 🛠 Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
* **Authentication:** [Supabase Auth](https://supabase.com/)
* **Databases:**
* **PostgreSQL (Supabase):** User auth, organizations, and relational data.
* **MongoDB:** High-volume inventory and distribution logs.


* **Payments:** [Stripe](https://stripe.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/food-arca.git
cd food-arca

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following keys:

```env
# Supabase (Auth & Core Data)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MongoDB (Inventory Data)
MONGODB_URI=your_mongodb_connection_string

# Stripe (Billing)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

```

### 4. Run the Development Server

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

Here is a quick overview of the top-level directory structure:

* **`/app`**: Next.js App Router pages and API routes.
* **`/api`**: Backend endpoints (Notifications, Barcode, Stripe, etc.).
* **`/dashboard`**: Protected main application views.
* **`/auth`**: Authentication handlers.


* **`/components`**: Reusable UI components.
* **`/layout`**: Sidebar, TopBar, and layout wrappers.
* **`/pages`**: Specific views for Inventory, Clients, and Settings.
* **`/ui`**: Base UI elements (Buttons, Inputs, Modals).


* **`/lib`**: Backend utilities.
* `db.js`: MongoDB connection logic.
* `models/`: Mongoose schemas (FoodItem, Client, etc.).


* **`/utils`**: Helper functions and Supabase client generators.

---

## 🔔 Notification System

Food Arca features an intelligent notification center located in the TopBar. It aggregates critical alerts from multiple sources:

1. **Inventory Health:** Warns when items are expiring (MongDB).
2. **Usage Limits:** Alerts when client or item quotas are reached (Supabase).
3. **Billing Status:** Prompts for upgrades when subscription tiers are exceeded.

---

## 📄 License

This project is proprietary software. All rights reserved.


When moving from a local mobile testing environment using tools like Ngrok back to production, keeping a clean deployment checklist prevents authentication loops and server errors.

The configuration adjustments required to transition back to the live site at `https://foodarca.com` are structured below by platform.

### 1. Environment Variables (`.env.local` or Hosting Platform)

During testing, configuration strings are often modified locally. Production environments (like Vercel, Netlify, or AWS) manage these via an environment dashboard, but verifying consistency is critical.

* **`NEXT_PUBLIC_SITE_URL`**:
* **Change back to:** `https://foodarca.com`
* **Why:** This variable acts as the primary absolute fallback origin throughout your application layout and server-side utilities when constructing redirection paths.


* **Local Server Flag:**
* If the local initialization script was amended to bind globally (e.g., `npm run dev -- -H 0.0.0.0`), no action is necessary for deployment. Production build configurations automatically optimize binding hooks depending on the host container.



### 2. Supabase Authentication Configuration

The Supabase security layer strictly audits oncoming origins post-authentication. The dashboard parameters must point explicitly to production coordinates.

* **Site URL Setup:**
* **Navigate to:** Supabase Dashboard > Authentication > URL Configuration.
* **Change "Site URL" to:** `https://foodarca.com`
* **Why:** If an internal authentication method panics or defaults during an explicit OAuth routing hook, it automatically routes the traffic back to this fallback anchor.


* **Redirect URLs Whitelist:**
* **Verify presence of:** `https://foodarca.com/` or `https://foodarca.com/auth/callback`
* **Optional Cleanup:** For stricter security architecture, remove the transient Ngrok links (e.g., `https://*.ngrok-free.app/`) and explicit local network IPs (e.g., `http://192.168.0.82:3000/`) from the allowed list so production instances reject arbitrary external endpoints.



### 3. Codebase Architecture Review

The codebase handles routing dynamically through browser headers, ensuring stability across local and remote instances without structural reversions.

* **Auth Callback Route (`app/auth/callback/route.js`):**
* **Keep as-is:** The implementation parsing request headers (`x-forwarded-host` and `x-forwarded-proto`) adapts automatically to live environments. When deployed, it reads the production proxy headers instead of local development contexts, accurately mapping redirects dynamically.


* **Frontend Auth Components (`use-auth-action.js`):**
* **Keep as-is:** The choice to use `window.location.origin` safely detects whether a user triggers authentication from a production browser tab or a developer context, ensuring proper callback construction globally.



### 4. External OAuth Providers (Google Cloud Console)

If you are utilizing a standard Supabase setup, Google OAuth securely redirects directly to your internal Supabase database endpoint (`https://[your-project-id].supabase.co/auth/v1/callback`), which handles subsequent redirection tokens safely.

* If you manually added specific local domains or custom callbacks inside the **Google Cloud Console Credentials** window rather than letting Supabase act as the proxy intermediary, ensure `https://foodarca.com` is configured inside the "Authorized JavaScript origins" section.