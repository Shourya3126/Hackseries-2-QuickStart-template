# TrustSphere 🔐

> **Decentralized Campus Governance Platform**  
> Trustless. Transparent. Unstoppable.

A blockchain-powered ecosystem for educational institutions featuring secure voting, AI-powered complaints, attendance tracking, and verifiable certificates—all on the Algorand blockchain.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Blockchain Implementation Status](#blockchain-implementation-status)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Files for Review](#key-files-for-review)
- [Setup & Installation](#setup--installation)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Roadmap](#roadmap)

---

## 🌟 Overview

TrustSphere is a comprehensive campus governance solution that leverages **Algorand blockchain** to ensure transparency, security, and immutability in educational processes. The platform eliminates fraud, protects privacy, and empowers campus communities through decentralized technology.

### Why TrustSphere?

- 🗳️ **Tamper-proof voting** with one wallet = one vote enforcement
- 🤖 **AI-powered privacy** in complaint handling
- 🔒 **Cryptographic security** for all transactions
- ⚡ **Real-time updates** via WebSocket
- 📊 **Verifiable records** on public blockchain

---

## ✅ Features

### **Implemented Features** ✔️

#### 1. **Anonymous Voting System** 🗳️ (FULLY BLOCKCHAIN-INTEGRATED)
- ✅ Teacher can create elections with multiple candidates
- ✅ Students vote using Pera Wallet signature
- ✅ One wallet = one vote enforcement on blockchain
- ✅ Real-time results with auto-refresh (10s intervals)
- ✅ Vote choices hashed and stored on Algorand TestNet
- ✅ Transaction verification via AlgoExplorer
- ✅ Election management dashboard for teachers

**Blockchain Status:** ✅ **100% Complete**

#### 2. **AI-Powered Complaint System** 🤖 (PARTIALLY BLOCKCHAIN-INTEGRATED)
- ✅ Anonymous complaint submission with Pera Wallet
- ✅ AI-based PII removal (emails, phone numbers, names)
- ✅ ML-powered classification (Infrastructure, Academic, Hostel, Faculty, Other)
- ✅ Priority scoring algorithm
- ✅ Complaint hash stored on Algorand for tamper-evidence
- ✅ Complaint verification interface

**Blockchain Status:** ✅ **Complete** (Hash storage on-chain)

#### 3. **Authentication & Authorization** 🔐
- ✅ JWT-based authentication
- ✅ Role-based access control (Student, Teacher, Admin)
- ✅ Pera Wallet integration
- ✅ Secure session management

#### 4. **Real-time Infrastructure** ⚡
- ✅ Socket.io for live notifications
- ✅ QR code rotation system (backend ready)
- ✅ WebSocket connections for instant updates

#### 5. **UI/UX** 🎨
- ✅ Responsive design (mobile-first)
- ✅ Modern glassmorphic interface
- ✅ 3D particle animations
- ✅ Smooth transitions with Framer Motion

---

### **Partially Implemented Features** 🔄

#### 6. **Attendance Tracking** 📸 (BACKEND READY, FRONTEND INCOMPLETE)
- ✅ Backend: QR-based session creation
- ✅ Backend: Dynamic QR rotation every 60s
- ✅ Backend: Face liveness detection (stub)
- ✅ Backend: Geolocation verification
- ✅ Backend: Blockchain hash storage
- 🔄 **Frontend: Attendance marking UI (INCOMPLETE)**
- 🔄 **Frontend: Teacher dashboard for attendance (INCOMPLETE)**

**Blockchain Status:** ✅ Backend ready, ❌ Frontend missing

#### 7. **Certificate System** 🎓 (BACKEND READY, FRONTEND INCOMPLETE)
- ✅ Backend: Certificate generation API
- ✅ Backend: Blockchain anchoring for certificates
- ✅ Backend: QR-based verification endpoint
- 🔄 **Frontend: Certificate minting interface (INCOMPLETE)**
- 🔄 **Frontend: Certificate verification page (INCOMPLETE)**
- 🔄 **Frontend: Student certificate portal (INCOMPLETE)**

**Blockchain Status:** ✅ Backend ready, ❌ Frontend missing

---

## 🔗 Blockchain Implementation Status

### **✅ Fully Integrated with Algorand**

| Feature | Blockchain Component | Status | Transaction Type |
|---------|---------------------|--------|------------------|
| **Voting** | Vote recording | ✅ Complete | Payment txn with note |
| **Voting** | Voter registration | ✅ Complete | Wallet address tracking |
| **Voting** | Vote verification | ✅ Complete | On-chain proof |
| **Complaints** | Hash storage | ✅ Complete | Payment txn with hash |
| **Complaints** | Tamper detection | ✅ Complete | Hash comparison |

### **❌ Not Yet Integrated with Blockchain**

| Feature | Backend Status | Frontend Status | Blockchain Readiness |
|---------|---------------|-----------------|---------------------|
| **Attendance** | ✅ API Ready | ❌ UI Missing | ✅ Ready to integrate |
| **Certificates** | ✅ API Ready | ❌ UI Missing | ✅ Ready to integrate |

---

## 🛠️ Tech Stack

### **Frontend**
- ⚛️ **React 18** - Modern UI library
- 📘 **TypeScript** - Type-safe development
- ⚡ **Vite** - Lightning-fast build tool
- 🎨 **Tailwind CSS** - Utility-first styling
- 🎭 **shadcn/ui** - Beautiful component library
- 🔮 **Framer Motion** - Smooth animations
- 👛 **Pera Wallet Connect** - Algorand wallet integration

### **Backend**
- 🟢 **Node.js + Express** - RESTful API server
- 🔐 **JWT** - Authentication
- ✅ **Joi** - Request validation
- 🛡️ **Helmet** - Security headers
- 🚦 **express-rate-limit** - DDoS protection
- 📡 **Socket.io** - Real-time communication

### **Blockchain**
- 🅰️ **Algorand SDK (algosdk)** - Blockchain interaction
- 🌐 **AlgoNode API** - TestNet access (https://testnet-api.algonode.cloud)
- 🔗 **Transaction Signing** - Client-side wallet signing

### **AI/ML**
- 🤖 **Face Liveness Detection** - Anti-spoofing (stub/ML-ready)
- 🛡️ **PII Anonymizer** - Regex-based privacy
- 📊 **Complaint Classifier** - Keyword-based ML

### **Database**
- 📄 **Mock DB** - JSON file-based storage (`server/data/db.json`)
- 🗄️ **MongoDB** - Upgrade path prepared (models ready)

---

## 📁 Project Structure

```
Hackseries-2-QuickStart-template/
├── src/                              # Frontend source
│   ├── components/
│   │   ├── voting/                   # ⭐ VOTING COMPONENTS (COMPLETE)
│   │   │   ├── CreateElection.tsx    # Teacher creates elections
│   │   │   ├── VoteOnChain.tsx       # Student voting with blockchain
│   │   │   └── ElectionResults.tsx   # Real-time results dashboard
│   │   ├── complaint/                # ⭐ COMPLAINT COMPONENTS (COMPLETE)
│   │   │   ├── SubmitComplaint.tsx   # AI-powered anonymous complaints
│   │   │   └── ComplaintVerify.tsx   # Verify complaint on blockchain
│   │   ├── attendance/               # ⚠️ ATTENDANCE (INCOMPLETE)
│   │   │   ├── MarkAttendance.tsx    # (Needs completion)
│   │   │   └── AttendanceVerification.tsx
│   │   ├── certificate/              # ⚠️ CERTIFICATES (INCOMPLETE)
│   │   │   ├── MintCertificate.tsx   # (Needs completion)
│   │   │   └── CertificateVerify.tsx # (Needs completion)
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── StatCard.tsx
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   └── Navbar.tsx
│   │   └── ui/                       # shadcn components
│   ├── hooks/
│   │   ├── useAlgorand.ts            # ⭐ ALGORAND HOOK (KEY FILE)
│   │   └── use-toast.ts
│   ├── pages/
│   │   ├── Auth.tsx
│   │   ├── Index.tsx
│   │   └── dashboard/
│   │       ├── VotingPage.tsx        # Student voting page
│   │       ├── TeacherVotingPage.tsx # Teacher election management
│   │       ├── ComplaintsPage.tsx
│   │       └── CertificatesPage.tsx
│   ├── store/
│   │   └── useAppStore.ts            # Global state management
│   └── lib/
│       └── utils.ts
│
├── server/                           # Backend source
│   ├── index.js                      # ⭐ SERVER ENTRY POINT
│   ├── routes/
│   │   ├── voting.routes.js          # ⭐ VOTING ENDPOINTS (KEY FILE)
│   │   ├── complaint.routes.js       # ⭐ COMPLAINT ENDPOINTS (KEY FILE)
│   │   ├── chain.voting.routes.js    # ⭐ BLOCKCHAIN VOTING (KEY FILE)
│   │   ├── chain.complaint.routes.js # ⭐ BLOCKCHAIN COMPLAINTS (KEY FILE)
│   │   ├── attendance.routes.js      # Attendance API (backend ready)
│   │   ├── certificate.routes.js     # Certificate API (backend ready)
│   │   ├── chain.attendance.routes.js
│   │   ├── chain.certificate.routes.js
│   │   └── auth.routes.js
│   ├── services/
│   │   ├── algorand.service.js       # ⭐ ALGORAND SERVICE (CRITICAL)
│   │   └── ai.service.js             # ⭐ AI/ML SERVICES (KEY FILE)
│   ├── models/
│   │   ├── User.js
│   │   ├── Election.js               # ⭐ ELECTION MODEL
│   │   ├── Complaint.js              # ⭐ COMPLAINT MODEL
│   │   ├── Session.js                # Attendance session model
│   │   └── Certificate.js            # Certificate model
│   ├── middleware/
│   │   ├── auth.js                   # JWT + RBAC middleware
│   │   ├── validate.js               # Joi validation
│   │   └── rateLimiter.js
│   ├── utils/
│   │   └── mockDb.js                 # JSON database utility
│   └── data/
│       └── db.json                   # Data storage (runtime generated)
│
├── ELECTION_FEATURE_GUIDE.md         # ⭐ DETAILED VOTING DOCUMENTATION
├── Alokit_setup.md                   # Algorand setup guide
└── README.md                          # This file
```

---

## 🔍 Key Files for Review

### **🏆 Priority Files for Judges**

These files demonstrate the core blockchain integration and technical implementation:

#### **1. Blockchain Integration** ⭐⭐⭐

| File | Description | Why Important |
|------|-------------|---------------|
| `server/services/algorand.service.js` | **Core blockchain service** | Shows Algorand SDK usage, transaction creation, signing flow |
| `src/hooks/useAlgorand.ts` | **Frontend wallet hook** | Pera Wallet integration, transaction signing |
| `server/routes/chain.voting.routes.js` | **Blockchain voting API** | Unsigned txn preparation, signed txn submission |
| `server/routes/chain.complaint.routes.js` | **Blockchain complaint API** | Hash storage on Algorand |

#### **2. Voting System (100% Complete)** ⭐⭐⭐

| File | Description |
|------|-------------|
| `src/components/voting/CreateElection.tsx` | Teacher election creation UI |
| `src/components/voting/VoteOnChain.tsx` | Student voting with Pera Wallet |
| `src/components/voting/ElectionResults.tsx` | Real-time results dashboard |
| `server/routes/voting.routes.js` | Election CRUD API |
| `server/models/Election.js` | Election data model |

#### **3. AI-Powered Complaints (100% Complete)** ⭐⭐

| File | Description |
|------|-------------|
| `src/components/complaint/SubmitComplaint.tsx` | Anonymous complaint submission UI |
| `server/services/ai.service.js` | **AI/ML services** (PII removal, classification) |
| `server/routes/complaint.routes.js` | Complaint processing API |
| `server/models/Complaint.js` | Complaint data model |

#### **4. Authentication & Architecture** ⭐

| File | Description |
|------|-------------|
| `server/middleware/auth.js` | JWT + RBAC implementation |
| `server/index.js` | Server setup, Socket.io, routing |
| `src/store/useAppStore.ts` | Global state management |

#### **5. Documentation** ⭐

| File | Description |
|------|-------------|
| `ELECTION_FEATURE_GUIDE.md` | **Detailed voting feature documentation** |
| `README.md` | This comprehensive guide |

---

## 🚀 Setup & Installation

### **Prerequisites**

- **Node.js** (v18 or higher)
- **npm** or **bun**
- **Algorand wallet** (Pera Wallet mobile app)
- **Git**

### **Installation Steps**

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd Hackseries-2-QuickStart-template

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server
npm install
cd ..

# 4. Create environment file for backend
cd server
cp .env.example .env  # If exists, otherwise create manually

# 5. Configure environment variables (server/.env)
# Add the following:
PORT=5000
FRONTEND_URL=http://localhost:8080
JWT_SECRET=your-secret-key-here
NODE_ENV=development

# Algorand configuration (optional - uses public TestNet by default)
ALGO_SERVER=https://testnet-api.algonode.cloud
ALGO_PORT=443
ALGO_TOKEN=
# ALGO_MNEMONIC=your-25-word-mnemonic  # Only if you want custom account

# 6. Start development servers
npm run dev  # Starts both frontend and backend concurrently
```

### **Manual Start (Alternative)**

```bash
# Terminal 1 - Frontend (from project root)
npm run dev:client

# Terminal 2 - Backend (from project root)
npm run dev:server
```

### **Access the Application**

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## 📖 Usage Guide

### **For Students**

1. **Register/Login** at `/auth`
2. **Connect Pera Wallet** (install mobile app first)
3. **Dashboard** features:
   - **Vote** in active elections
   - **Submit complaints** anonymously
   - View certificates (partial)
   - Mark attendance (partial)

### **For Teachers**

1. **Login** with teacher account
2. **Dashboard** features:
   - **Create Elections** with multiple candidates
   - **View live results** with auto-refresh
   - Create attendance sessions (backend ready)
   - Issue certificates (backend ready)

### **For Administrators**

1. **Login** with admin account
2. **Dashboard** features:
   - User management
   - System analytics
   - All teacher + student features

### **Demo Accounts** (if seeded)

Check `server/scripts/admin.js` or `server/data/db.json` for demo credentials.

---

## 🏗️ Architecture

### **System Flow - Voting Example**

```
1. Teacher creates election
   └─> Stored in Mock DB

2. Student clicks "Vote"
   └─> Frontend validates selection

3. Frontend calls /api/chain/vote/unsigned
   └─> Backend generates Algorand transaction
   └─> Returns unsigned transaction bytes

4. Frontend calls signTransactions() via Pera Wallet
   └─> User approves in mobile app
   └─> Returns signed transaction

5. Frontend calls /api/chain/vote/submit
   └─> Backend submits to Algorand TestNet
   └─> Updates DB with vote count
   └─> Returns transaction ID

6. Vote confirmed on blockchain
   └─> Verifiable on AlgoExplorer
   └─> Results update in real-time via Socket.io
```

### **Data Flow**

```
Frontend (React) ←→ Backend (Express) ←→ Algorand TestNet
       ↓                    ↓                     ↓
   Pera Wallet         Mock DB              AlgoExplorer
   (User's phone)    (server/data/db.json)  (Public ledger)
```

---

## 🗺️ Roadmap

### **Phase 1: Complete Core Features** (Current Priority)

- [ ] **Attendance System**
  - [ ] Complete frontend attendance marking UI
  - [ ] Teacher attendance dashboard
  - [ ] Integrate face liveness detection
  - [ ] Connect blockchain verification

- [ ] **Certificate System**
  - [ ] Certificate minting interface
  - [ ] Student certificate portal
  - [ ] QR verification page
  - [ ] Blockchain anchoring UI

### **Phase 2: Enhancements**

- [ ] Migrate from Mock DB to MongoDB
- [ ] Deploy smart contracts on Algorand
- [ ] Advanced AI models (replace stubs)
- [ ] Analytics dashboard
- [ ] Export/report generation

### **Phase 3: Scaling**

- [ ] Multi-institutional support
- [ ] Native mobile app (React Native)
- [ ] Enhanced security (MFA, audit logs)
- [ ] DAO governance features

---

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests (if configured)
cd server
npm test
```

---

## 📊 Current Status Summary

| Module | Backend | Frontend | Blockchain | Status |
|--------|---------|----------|------------|--------|
| **Authentication** | ✅ 100% | ✅ 100% | N/A | ✅ Complete |
| **Voting** | ✅ 100% | ✅ 100% | ✅ 100% | ✅ **Complete** |
| **Complaints** | ✅ 100% | ✅ 100% | ✅ 100% | ✅ **Complete** |
| **Attendance** | ✅ 100% | ❌ 30% | ✅ Ready | 🔄 In Progress |
| **Certificates** | ✅ 100% | ❌ 20% | ✅ Ready | 🔄 In Progress |
| **Analytics** | ❌ 40% | ❌ 40% | N/A | 🔄 Planned |

**Overall Completion: ~70%**

---

## 🤝 Contributing

This project was developed for a hackathon. For improvements or issues, please create a pull request or issue.

---

## 📄 License

This project is open-source and available under the MIT License (or specify your license).

---

## 🙏 Acknowledgments

- **Algorand Foundation** - For the incredible blockchain platform
- **Pera Wallet** - For seamless wallet integration
- **shadcn/ui** - For beautiful UI components
- **Lovable.dev** - For initial project scaffolding

---

## 📞 Contact

For questions or demo requests, please contact the development team.

---

**Built with ❤️ for Hackspiration Team HackHive**
