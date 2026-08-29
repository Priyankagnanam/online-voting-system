# Online Voting System

A full-stack web application for conducting secure online elections, built as a college project using the MERN stack.

## Features

### Voter
- Register with email verification (OTP)
- Secure login with JWT authentication
- View active elections and candidate details
- Cast votes with confirmation
- One-voter-one-vote enforcement (server + database level)
- Forgot password with OTP reset

### Admin
- Dashboard with stats (voters, elections, candidates, votes)
- Create, edit, delete elections
- Start/end elections
- Add, edit, delete candidates
- View and manage voters
- View election results with statistics
- Suspicious login alerts with risk scores

### Security
- bcrypt password hashing
- JWT authentication with 24h expiry
- Role-based authorization (voter/admin)
- Input validation on all endpoints
- Rate limiting on login and OTP endpoints
- Compound unique index prevents duplicate votes at DB level
- Rule-based suspicious login detection with risk scoring

## Tech Stack

**Frontend:** React.js, React Router, Axios, Vite

**Backend:** Node.js, Express.js, REST API

**Database:** MongoDB, Mongoose

**Auth:** JWT, bcryptjs, nodemailer (OTP)

## Project Structure

```
online-voting-system/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login, OTP, password reset
│   │   ├── electionController.js # Election CRUD
│   │   ├── candidateController.js # Candidate CRUD
│   │   ├── voteController.js   # Cast vote, get results
│   │   ├── voterController.js  # Voter-facing endpoints
│   │   └── adminController.js  # Admin stats, users, alerts
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── role.js             # Role-based access
│   │   ├── validate.js         # Input validation
│   │   └── rateLimiter.js      # Rate limiting
│   ├── models/
│   │   ├── User.js             # User with bcrypt hashing
│   │   ├── Election.js         # Election with status logic
│   │   ├── Candidate.js        # Candidate linked to election
│   │   ├── Vote.js             # Vote with unique constraint
│   │   ├── OTP.js              # OTP with TTL auto-delete
│   │   └── LoginAttempt.js     # Login tracking for risk detection
│   ├── routes/
│   │   ├── auth.js             # /api/auth/*
│   │   ├── elections.js        # /api/elections/*
│   │   ├── candidates.js       # /api/candidates/*
│   │   ├── votes.js            # /api/votes/*
│   │   ├── voter.js            # /api/voter/*
│   │   └── admin.js            # /api/admin/*
│   ├── services/
│   │   ├── email.js            # Nodemailer email service
│   │   └── riskDetection.js    # Risk scoring engine
│   ├── utils/
│   │   └── generateOTP.js      # Cryptographic OTP generation
│   ├── .env                    # Environment variables (not committed)
│   ├── .env.example            # Example environment file
│   ├── package.json
│   ├── seed.js                 # Creates first admin user
│   ├── server.js               # Express server entry point
│   └── test.js                 # API integration tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── ConfirmationModal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VerifyOTP.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── VoterDashboard.jsx
│   │   │   ├── ElectionDetails.jsx
│   │   │   ├── VoteConfirmation.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── ElectionManagement.jsx
│   │   │       ├── CandidateManagement.jsx
│   │   │       ├── VoterManagement.jsx
│   │   │       ├── Results.jsx
│   │   │       └── SecurityAlerts.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios instance with JWT interceptor
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── .gitignore
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (local installation or [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm

### 1. Clone and install

```bash
cd online-voting-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your production settings:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<your_username>:<your_password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_string_here

ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_PASSWORD=your_secure_password

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password

FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

**For Gmail OTP:** Enable Google 2FA and create an [App Password](https://myaccount.google.com/apppasswords). Use this 16-character password in `SMTP_PASSWORD`.
**For MongoDB Atlas:** Create a free cluster, whitelist `0.0.0.0/0` in Network Access, create a database user, and paste the connection string into `MONGODB_URI`.

### 3. Seed the admin user

```bash
cd backend
npm run seed
```

This securely creates or updates the admin user in the database using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file.

### 4. Start the application

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Open in browser

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /register | No | Register voter |
| POST | /verify-otp | No | Verify email OTP |
| POST | /login | No | Login (returns JWT) |
| POST | /forgot-password | No | Request password reset OTP |
| POST | /reset-password | No | Reset password with OTP |
| GET | /me | Yes | Get current user |

### Elections (`/api/elections`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | / | Yes | Any | List all elections |
| GET | /:id | Yes | Any | Election details + candidates + vote count |
| POST | / | Yes | Admin | Create election |
| PUT | /:id | Yes | Admin | Update election |
| DELETE | /:id | Yes | Admin | Delete election |
| PATCH | /:id/status | Yes | Admin | Change election status |

### Candidates (`/api/candidates`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | / | Yes | Any | List all candidates |
| GET | /by-election/:electionId | Yes | Any | Candidates for election |
| GET | /:id | Yes | Any | Single candidate |
| POST | / | Yes | Admin | Add candidate |
| PUT | /:id | Yes | Admin | Update candidate |
| DELETE | /:id | Yes | Admin | Delete candidate |

### Votes (`/api/votes`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | / | Yes | Voter | Cast vote |
| GET | /results/:electionId | Yes | Any | Get election results |

### Voter (`/api/voter`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | /active-elections | Yes | Voter | List active elections |
| GET | /stats | Yes | Voter | Dashboard stats |
| GET | /elections/:id | Yes | Voter | Election details + hasVoted |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | /dashboard | Yes | Admin | Dashboard stats |
| GET | /users | Yes | Admin | List all users |
| PATCH | /users/:id/verify | Yes | Admin | Toggle verification |
| DELETE | /users/:id | Yes | Admin | Delete voter |
| GET | /security-alerts | Yes | Admin | Suspicious login alerts |
| GET | /results | Yes | Admin | All election results |

## Testing

```bash
# Make sure MongoDB is running and server is started
cd backend
npm run seed    # first time only
npm run dev     # start server

# In another terminal:
npm test
```

## Risk Detection System

This is an AI-assisted/rule-based security feature (not a production-grade IDS).

**Signals scored:**
- Repeated failed logins in 5 minutes (+10 to +40)
- High failure rate in 1 hour (+15 to +30)
- High attempt frequency (+10 to +20)
- Failed login (+5)
- Unusual login time, midnight to 5am (+10)

**Risk levels:**
- 0-30: Normal
- 31-60: Review
- 61-100: Suspicious

Admins can view flagged logins in the Security Alerts page.

## Development Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- OTPs are hashed with bcrypt and auto-deleted by MongoDB TTL index
- The Vote model uses a compound unique index `{voterId, electionId}` for one-voter-one-vote at the database level
- JWT tokens expire after 24 hours
- Rate limits: 10 login attempts per 15 minutes, 5 OTP requests per 10 minutes
- Frontend proxies API calls via Vite dev server configuration

## License

This is a college project for educational purposes.
