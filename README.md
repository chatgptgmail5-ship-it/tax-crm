# Tax CRM — Web Application

Modern web application for the Tax Advisor CRM, converted from Microsoft Access. Runs locally on your office computer—no cloud, no monthly costs.

## Tech Stack

- **Next.js 14** (App Router)
- **NextAuth** (login & user management)
- **Prisma** (ORM)
- **SQLite** (file-based database—no server)
- **Tailwind CSS**
- **TypeScript**

## First-Time Setup (Your Office Computer)

1. **Install Node.js** (if not installed)  
   Download from [nodejs.org](https://nodejs.org/) (LTS).

2. **Install dependencies**
   ```bash
   cd tax-crm
   npm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `NEXTAUTH_SECRET` — generate one with:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - For local use only: `NEXTAUTH_URL="http://localhost:3000"`

4. **Initialize database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the app**
   ```bash
   npm run dev
   ```

6. **Create your admin account**
   - Open [http://localhost:3000/setup](http://localhost:3000/setup)
   - Enter your name, email, and password
   - You’re the first admin; only you can add other users

7. **Sign in** at [http://localhost:3000](http://localhost:3000)

---

## Running for Daily Use

**On your own computer (same machine):**
```bash
npm run start
```
Then open [http://localhost:3000](http://localhost:3000)

**For other office computers (over your network):**
1. Find your computer’s IP (e.g. `ipconfig` on Windows → IPv4 address)
2. In `.env`, set `NEXTAUTH_URL="http://YOUR_IP:3000"` (e.g. `http://192.168.1.100:3000`)
3. Run:
   ```bash
   npm run start:network
   ```
4. On this computer: [http://localhost:3000](http://localhost:3000)
5. On other PCs: `http://YOUR_IP:3000` (replace with your actual IP)

---

## Adding More Users (Employees)

1. Sign in as admin
2. Go to **Users** in the sidebar
3. Click **Add user**, enter email, name, and a temporary password
4. Share the login URL and credentials with the employee (they should change the password later if you add that feature)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (hot reload) |
| `npm run build` | Build for production |
| `npm run start` | Production server (local only) |
| `npm run start:network` | Production server (accessible from office network) |
| `npm run db:push` | Apply schema to database |
| `npm run db:seed` | Seed lookup data (statuses, documents) |
| `npm run db:generate` | Regenerate Prisma client |

---

## Privacy & Security

- **Data stays local** — SQLite database file on your computer
- **Login required** — Only users you create can access
- **No cloud** — Runs on your office computer/server
- **No monthly costs** — Uses your own hardware

---

## Features

- **Dashboard** — Overview and recent clients/refunds
- **Clients** — Full CRUD, search, assign agent/clerk
- **Refunds** — Tax refund records per client/year, status tracking
- **Agents** — Referral partners with commission rates
- **Clerks** — Staff members
- **Document Types** — Lookup for client document tracking
- **Users** (admin only) — Add or remove users who can sign in
