# Tax CRM — Setup Steps (Do These in Order)

## Step 1: Install Node.js (if you haven't)

1. Go to https://nodejs.org/
2. Download the **LTS** version
3. Run the installer, accept defaults
4. **Close and reopen Cursor** (so it picks up Node.js)

---

## Step 2: Open Terminal in Cursor

1. Press **Ctrl + `** (backtick) to open the terminal
2. Or: menu **Terminal → New Terminal**

---

## Step 3: Run Setup Commands (one at a time)

Copy and paste each command, then press **Enter**. Wait for it to finish before running the next.

```bash
cd c:\Users\EliP\Desktop\access-convert\tax-crm
```

```bash
npm install
```

```bash
npm run db:push
```

```bash
npm run db:seed
```

---

## Step 4: Start the App

```bash
npm run dev
```

You should see: `Local: http://localhost:3000`

---

## Step 5: Create Your Admin Account

1. In your browser, open: **http://localhost:3000/setup**
2. Enter your name, email, and a password (at least 6 characters)
3. Click **Create admin account**

---

## Step 6: Sign In

1. Open **http://localhost:3000**
2. Enter the email and password you just created
3. Click **Sign in**

---

## Done

You’re in. Use **Users** in the sidebar (when signed in as admin) to add other people.

To stop the app: press **Ctrl + C** in the terminal.
