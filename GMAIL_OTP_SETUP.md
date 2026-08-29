# Gmail OTP and MongoDB Setup Guide

This guide explains how to properly configure the Online Voting System for production using a real Gmail SMTP transport and your own MongoDB Atlas database.

## 1. Google Gmail (App Password) Setup

To send real OTP emails, you cannot use your standard Gmail password. You must generate an App Password.

1. Go to your Google Account management page (myaccount.google.com).
2. Navigate to **Security**.
3. Under "How you sign in to Google," ensure **2-Step Verification** is turned ON.
4. Click on **2-Step Verification**, scroll to the bottom, and click **App passwords**.
5. Give it a name (e.g., "Online Voting System") and click **Create**.
6. Copy the 16-character password provided.

## 2. MongoDB Atlas Setup

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Go to **Database Access** and create a new database user. Keep the password secure.
3. Go to **Network Access** and whitelist your server's IP address (or `0.0.0.0/0` if deploying on a dynamic host like Render).
4. Click **Connect** on your cluster, choose "Connect your application", and copy the connection string.
5. Replace `<password>` in the connection string with the database user's password.

## 3. Environment Configuration

In the `backend/` directory, create your `.env` file based on `.env.example`:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/voting?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key

ADMIN_EMAIL=gpriyanka17052006@gmail.com
ADMIN_PASSWORD=your_secure_admin_password

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=gpriyanka17052006@gmail.com
SMTP_PASSWORD=your_16_character_app_password

FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

**CRITICAL WARNINGS:**
- NEVER commit your `.env` file to Git.
- NEVER put real passwords in `.env.example`.
- In production platforms (like Render or Heroku), add these directly into the provider's Environment Variables dashboard.

## 4. Initialization

Once the `.env` variables are active:

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Run the seed script to create your admin account:
   ```bash
   npm run seed
   ```
3. Start the application:
   ```bash
   npm start
   ```

You can now navigate to your frontend and verify that OTP registration sends live emails directly to users!
