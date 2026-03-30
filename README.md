<div align="center">
  <img src="https://raw.githubusercontent.com/nithishgoud1912/SwiftStock/main/public/favicon.ico" alt="SwiftStock Logo" width="80" />
  
  # SwiftStock ⚡
  
  **Inventory Management with *Zero Lag*.**

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)

  <p align="center">
    A minimalist, dashboard-first SaaS built for modern teams. <br />
    Ditch bloated spreadsheets and slow ERPs. Manage stock, automate alerts, and track transactions instantly.
  </p>
</div>

---

## 🛑 The Problem
Traditional Enterprise Resource Planning (ERP) systems are slow, bloated with features you don't need, and require weeks of training. On the other hand, managing inventory in Excel spreadsheets leads to human error, lost data, and zero real-time collaboration.

## 💡 The SwiftStock Solution
SwiftStock is a lightweight, high-performance inventory management system tailored for growing businesses. We stripped away the complexity to give you exactly what you need: **speed, accuracy, and ease of use.**

<br/>

## ✨ Key Value Propositions

🚀 **Dashboard-First Design**
Stop clicking through endless menus. Everything you need—from live stock levels to recent transactions and critical low-stock alerts—is accessible from a unified, modern dashboard. 

⚡ **The "Zero-Lag" Experience**
Powered by Next.js App Router and TanStack Query, stock adjustments happen instantly using optimistic UI updates. No loading spinners. No waiting. 

🔔 **Smart Automated Alerts**
Never run out of your best-selling items again. Set custom low-stock thresholds per item. When stock dips, SwiftStock instantly triggers email digests (via Resend) and Developer Webhooks.

🛡️ **Multi-Tenant & Role-Based Access**
Built from day one for teams. Robust multi-tenancy ensures complete data isolation. Role-Based Access Control (RBAC) guarantees that only Admins can delete products, while Members can request stock adjustments for approval.

<br/>

## 🏗️ The "Anti-Gravity" Tech Stack

We engineered SwiftStock for maximum velocity and type safety:

- **Frontend:** Next.js 15 (App Router), React Server Components, Tailwind CSS, Shadcn UI
- **Backend:** Next.js Server Actions, Node.js
- **Database:** PostgreSQL (Hosted on Supabase) accessed via Prisma ORM
- **Authentication & Orgs:** Clerk (Secure, multi-tenant auth)
- **State Management:** Zustand (Client UI State) & TanStack Query (Server State Cache)
- **Security:** Upstash Redis (Global API Rate Limiting)
- **Communications:** Resend API (Transactional Emails) & Custom Webhook Dispatcher

<br/>

## 🚦 Getting Started for Developers

Want to run SwiftStock locally? It takes less than 5 minutes.

### 1. Clone & Install
```bash
git clone https://github.com/nithishgoud1912/SwiftStock.git
cd SwiftStock
npm install
```

### 2. Environment Variables
Create a `.env` file at the root. You will need API keys for Clerk, Supabase (Postgres), Upstash Redis, and Resend.
```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
WEBHOOK_SIGNUP_SECRET=whsec_...

# Upstash Rate Limiting
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="token..."

# Resend Emails
RESEND_API_KEY="re_..."
```

### 3. Database Setup
Push the Prisma schema to your Postgres database and generate the client:
```bash
npm run prisma:generate
npm run prisma:push
```

### 4. Launch
```bash
npm run dev
```
Visit `http://localhost:3000` to see the app running.

<br/>

## 📈 Future Roadmap

- [ ] **Mobile App Synchronization:** Native mobile views for barcode scanning in the warehouse.
- [ ] **Advanced Analytics:** Predictive AI modeling for seasonal stock trends.
- [ ] **Accounting Integrations:** Seamless sync with QuickBooks and Xero.

---
<p align="center">
  Built with ❤️ for modern businesses.
</p>
