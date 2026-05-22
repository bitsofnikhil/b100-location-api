# B100 Location Intelligence API Platform

## Project Overview
This capstone project is a B2B Location Intelligence API Platform that provides structured access to Indian location data such as states, districts, sub-districts, and villages.

## Problem Statement
Businesses need accurate Indian location data for address forms, KYC systems, logistics platforms, delivery apps, and dropdown menus. Manually maintaining this data is difficult and error-prone.

## Solution
This project imports the provided All India Villages Master List dataset into a normalized PostgreSQL database and exposes secure REST APIs using API key and API secret authentication.

## Tech Stack
- Node.js
- Express.js
- PostgreSQL
- Supabase
- Prisma ORM
- Thunder Client

## Features
- Secure API key and secret authentication
- PostgreSQL database integration
- Dataset import from Excel files
- Normalized relational database design
- State, district, sub-district, and village APIs
- Village search API

## API Endpoints
- POST `/admin/clients`
- GET `/api/v1/states`
- GET `/api/v1/districts`
- GET `/api/v1/sub-districts`
- GET `/api/v1/villages`
- GET `/api/v1/search?q=`

## Dataset
The project uses the provided All India Villages Master List dataset. For demonstration, a sample set of records was imported into PostgreSQL.

## How to Run

```bash
cd backend
npm install
npm run dev