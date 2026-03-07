# EstateFlow - Property Management App

## Overview
A full-stack property management application for tracking rental properties, tenants, expenses, tasks, and rent payments.

## Architecture
- **Frontend**: React + TypeScript with Vite, TailwindCSS, shadcn/ui components, Wouter routing, TanStack Query
- **Backend**: Express.js (Node.js) with TypeScript via tsx
- **Database**: PostgreSQL via Drizzle ORM
- **Session**: express-session with memorystore

## Project Structure
- `client/` - React frontend (Vite root)
- `server/` - Express backend (index.ts, routes.ts, storage.ts, db.ts, vite.ts, static.ts)
- `shared/` - Shared types, schema (Drizzle), and API route definitions
- `script/` - Build scripts

## Key Features
- Property portfolio dashboard with revenue/expense tracking
- Property detail pages with notes, expenses, photos, and tenant info
- Rent payment tracking (monthly toggle per property)
- Task management linked to properties
- Seed data auto-populates on first run

## Running the App
- **Dev**: `npm run dev` (starts Express + Vite dev server on port 5000)
- **Build**: `npm run build`
- **Production**: `npm run start`
- **DB schema push**: `npm run db:push`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (set via Replit DB integration)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - development | production
