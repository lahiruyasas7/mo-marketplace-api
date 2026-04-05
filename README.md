# MO Marketplace – Full Stack Engineer Assessment
## Overview

This project is a full-stack marketplace application built as part of a technical assessment. It demonstrates product management with variants, JWT authentication, and a functional frontend with a Quick Buy flow.

## Tech Stack

### Backend

1. NestJS
2. TypeORM
3. PostgreSQL
4. JWT Authentication
5. AWS S3 (image storage)
6. Swagger (API documentation)

### Frontend

1. React (Vite + TypeScript)
2. React Router
3. React Hook Form + Zod
4. React-Query
5. Zustand
6. Tailwindcss
7. Shadcn

## Deployment

1. Frontend: Vercel
2. Backend: Railway
3. Database: Neon (PostgreSQL)

## Repositories
1. Frontend: https://github.com/lahiruyasas7/mo-marketplace-frontend.git
2. Backend: https://github.com/lahiruyasas7/mo-marketplace-api.git

## Live Demo
url: https://mo-marketplace-frontend.vercel.app/

## Demo Video
https://drive.google.com/file/d/1mKSHXkzuBhyJzzpuF9f0ytddTJomjJh0/view?usp=sharing

## Features
## Backend

1. JWT http only cookies authentication
2. Product with variants
3. Automatic combination_key generation (e.g. red-M-cotton)
4. Prevent duplicate variant combinations
5. DTO validation using class-validator
6. Swagger API documentation

## Frontend

1. Product creation page
2. Product listing page
3. Product detail page
4. Variant selection
5. Quick Buy flow
6. User login and Register page

## Edge Cases Handled

1. Duplicate variant combinations → prevented in backend
2. Out-of-stock variants → disabled in UI
3. Invalid inputs → validated in both frontend and backend

## Architecture & Key Decisions
1. Used NestJS modular architecture for scalability
2. Separated Product and Variant entities
3. Generated combination_key to enforce uniqueness
4. Used AWS S3 for image storage instead of local uploads
5. Used Neon DB for cloud PostgreSQL hosting
6. Used Railway & Vercel for quick deployment

## Trade-offs
1. Simplified authentication (JWT only, no OAuth)
2. Used TypeORM migrations for schema management

## Setup Instructions (Local Development)
### Prerequisites
1. Node.js (v20+)
2. npm (v9+)
3. PostgreSQL (v15+)

## 1. Clone Repositories
1. git clone https://github.com/your-username/mo-marketplace-api
2. git clone https://github.com/your-username/mo-marketplace-web

## 2. Backend Setup
- cd mo-marketplace-api
- npm install
-  Create PostgreSQL Database

- Create a database named: **mo-marketplace-db**

- Configure Environment Variables

- create aws s3 bucket

### Create a .env file in backend root:

- NODE_ENV=development
- APP_PORT=3000
- DB_HOST=localhost
- DB_PORT=5432
- DB_USERNAME=postgres
- DB_PASSWORD=your-password
- DB_NAME=mo-marketplace-db
- DB_SYNCHRONIZE=false
- DB_LOGGING=true
- DB_REJECT_UNAUTHORIZED=false
- DB_MAX_CONNECTIONS=100
- DB_SSL_ENABLED=false

- FRONTEND_URL=http://localhost:5173

JWT_ACCESS_SECRET=b3b60bf4f3ff021a30b1d6c96724db0b38eb2b10ce1f52d219170f6cb50729c22e4dc8e3ab2b35861325cb3d2bb2e679cd9dab4c2f56ed7fe39e3fb63c3ca2a8
JWT_REFRESH_SECRET=f9051456bb284391f4659e4ad71ce3b21bba62ca7655c2692e2457c57538f0f0398f68247bba4d5916f2c84e75cf0eb02bbb95a88b2f491fc4eac14c7e557236

- ACCESS_TOKEN_EXPIRY=15min; #15min
- REFRESH_TOKEN_EXPIRY_DAYS=7; #7 days

- AWS_REGION=ap-southeast-1
- AWS_ACCESS_KEY_ID=your-aws-access-key
- AWS_SECRET_ACCESS_KEY=your-aws-secret
- AWS_BUCKET_NAME=your-aws-bucket-name

### Run Migrations
- npm run migration:generate
- npm run migration:run

### Start Backend
- npm run start:dev
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/v1/docs


## 3. Frontend Setup
- cd mo-marketplace-frontend
- npm install
- create .env file in root and value
- VITE_APP_API_URL=http://localhost:3000/api/v1
- npm run dev

App: http://localhost:5173

Developed by Lahiru Karuanthilaka