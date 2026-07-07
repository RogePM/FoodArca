# 🍎 Food Arca

**Modern Inventory Management for High-Volume Food Pantries.**

Food Arca is a comprehensive SaaS platform designed to streamline operations for food banks and pantries. It combines real-time inventory tracking, multi-location organization routing, and automated alerts into a unified, easy-to-use dashboard.

Built with **Next.js 16**, it leverages a 100% **Supabase (PostgreSQL)** database architecture to offer robust authentication, scalable real-time data storage, and seamless subscription billing via Stripe.

---

## ✨ Key Features

### 📦 Inventory Management
* **Real-time Tracking:** Monitor stock levels, expiration dates, and categories across multiple devices simultaneously.
* **Barcode Scanning:** Integrated scanner for quick item lookups, additions, and continuous distribution checkouts.
* **Smart Alerts:** Automated notifications for low stock and expiring items.
* **Bulk Ingestion:** Fast multi-item ingestion with automatic category matching and catalog normalization.

### 🚚 Distribution & Routing
* **Fast Grab-and-Go Mode:** Streamlined anonymous checkout process for rapid food distributions without bottlenecking lines.
* **Multi-Location Routing:** Seamlessly manage inventory across multiple facilities and warehouse sites.
* **Real-time Sync:** Instant updates across all volunteer tablets and phones on the distribution floor.

### ⚙️ Organization & Billing
* **Multi-Tenancy:** Switch between different pantry organizations easily.
* **Role-Based Access:** Secure permissions for admins and volunteers.
* **Subscription Management:** Integrated Stripe billing for Regional and Enterprise tiers.

---

## 🛠 Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
* **Authentication:** [Supabase Auth](https://supabase.com/) (OAuth & Email)
* **Database:** **PostgreSQL (Supabase)** for user auth, organizations, catalog items, and inventory batches.
* **Payments:** [Stripe](https://stripe.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/RogePM/FoodArca.git
cd FoodArca
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following keys:

```env
# Supabase (Auth & Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Billing)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
RESEND_API_KEY=your_resend_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 📂 Project Structure

* **`/app`**: Next.js App Router pages, marketing route group, and API routes.
* **`/components`**: Modular UI components organized by feature (`/pages/inventory`, `/pages/add-items`, `/pages/distribution`).
* **`/lib`**: Utilities, category mapping, constants, and database types.
* **`/utils`**: Supabase SSR and client configuration.

---

## 📄 License

This project is proprietary software. All rights reserved.
