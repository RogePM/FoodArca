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
