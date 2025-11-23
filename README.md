# Helix - Dietary Management System

## Overview
Helix is a comprehensive platform connecting clients with dietitians for personalized health plans.

## Quick Start (Preview Mode)
By default, this application runs in **Preview Mode** (Mock Data). 
1. Open the project in your browser.
2. Login as Admin (`admin@helix.com`) or Client (`alice@example.com`).
3. No backend server is required for Preview Mode.

---

## Full Stack Setup (Local Development)

To run the application with the real Node.js/Express backend and MongoDB:

### 1. Prerequisites
*   Node.js (v16+)
*   MongoDB (Running locally on port 27017)

### 2. Backend Setup
Navigate to the backend folder (created from the provided code) or create it:
```bash
mkdir backend
cd backend
npm init -y
npm install express mongoose socket.io cors jsonwebtoken dotenv
```
Save `server.js` and `models.js` into this folder.

Run the server:
```bash
node server.js
```
Server runs on `http://localhost:5000`.

### 3. Frontend Configuration
Open `services/api.ts` and change the configuration flag:

```typescript
// services/api.ts
const USE_MOCK_DATA = false; // Set to false to use real backend
```

### 4. Run Frontend
If running locally with Vite/CRA:
```bash
npm install
npm start
```

## Features
*   **Role-Based Access**: Admin and Client dashboards.
*   **Gemini AI Integration**: Generates task lists from doctor notes.
*   **Real-time Chat**: Socket.IO powered messaging.
*   **Task Tracking**: Daily meal and activity tracking.
