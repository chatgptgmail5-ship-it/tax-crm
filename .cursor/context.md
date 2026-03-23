# Project Context

This is a tax-office management system.

Tech stack:
- Next.js (App Router)
- NextAuth authentication
- Prisma database
- React + TypeScript

User roles:
- admin
- clerk
- viewer

Permissions:

admin
- full access
- manage users

clerk
- can edit data
- cannot manage users

viewer
- read only
- cannot edit or create anything

Main system features:

Authentication
- login with email + password
- NextAuth credentials provider

User management
- admin can add / delete users
- user roles: admin / clerk / viewer

Clients management
- households
- children
- documents
- tax cases
- refunds

Security rules:

viewer
- cannot modify anything

clerk
- can modify client data
- cannot manage users

admin
- full permissions

Login page:

location:
app/login/page.tsx

Authentication handled with NextAuth.

Passwords are hashed with bcrypt.

Reset password logic:
Admin password required:
password2010