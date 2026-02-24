# Gamified Betting Platform 🎰

A production-ready, mobile-first betting web application featuring a highly gamified UI/UX similar to modern mobile games.

## 🌟 Key Features

### 👤 User Functionalities (Frontend & Backend)
- **Secure Authentication:** JWT-based stateless login system for rapid, database-light authentication.
- **Real-Time WebSockets Architecture:** Fully integrated `Socket.IO` system replacing heavy HTTP polling. Users instantly receive live `market-status` and `result-declared` events without refreshing.
- **Dynamic Dashboard:** Real-time visibility into active and closed markets driven by WebSocket events.
- **Real-Time Wallet:** Live balance tracking utilizing ACID-compliant transactions with row-level locking (prevents race conditions perfectly).
- **Gamified Betting Interface:**
  - **Bet Types Supported:** Single Digit (0-9), Jodi (00-99), and Panna (Single/Double/Triple 000-999).
  - **Smart Panna Engine:** High-tech "Radar" input that automatically sorts typed numbers based on mathematical sequence rules (e.g., typing '502' converts automatically to '250').
  - **Smart Suggestions:** Dynamic quick-pick preset buttons (Hot, New, Gold, Trending) that adapt based on user input.
  - **Stake Selection:** One-tap presets (₹100, ₹500, ₹10K, etc.) and a 'MAX' button for instant full-balance betting.
- **Immersive Execution Overlay:** GPay-style neon payment confirmation sequence. Processing HUD transforms into a massive glowing checkmark summarizing the exact bet and deduction securely.

### 🛡️ Admin Functionalities (Frontend & Backend)
- **Overview Dashboard:** Comprehensive real-time view of total bets placed today, total money volume (₹), count of active users, and status of all available markets.
- **Market Control:** Granular control panel to schedule automatic Open/Close timings for markets or manually override their status. (Status changes emit socket events instantly to all online users).
- **Live Monitoring:** Instantaneous WebSocket feed listening to `new-bet` events. Displays incoming bets live without querying the database via HTTP intervals. Features filtering by market and separating bets strictly by "Today" and "Yesterday."
- **Results Management:** Authorized capability to declare winning patterns for specific markets seamlessly. Instantly emits `result-declared` to force all connected clients to reload final statuses.
- **Daily Reset System:** Automated midnight Cron jobs to strictly isolate days, archiving previous bets, and seamlessly opening fresh sheets for new markets without downtime. (Manual trigger available for debugging).

---

### 🌟 Gamified User Interface Previews

Here is a glimpse of the engaging frontend experience built for users:

#### 1. Main Dashboard
![User Dashboard](marketHub.png)
*Modern, gamified "casino-style" hub showing live wallets, active markets, and quick navigation.*

#### 2. Smart Betting Interface
![Smart Betting Radar](marketbet.png)
*High-tech betting radar with Smart Panna sorting, intelligent quick-pick suggestions, and one-tap max stake features.*

---

## 📸 Admin Panel Previews

Here is a glimpse of the robust Admin Dashboard for MarketHub:

### 1. Overview Dashboard
![Overview](admin-overview.png)
*Real-time metrics tracking total volume, user activity, and market statuses.*

### 2. Market Control
![Market Control](admin-control.png)
*Configure exact open and close times for every active regional market.*

### 3. Results Management
![Results](admin-result.png)
*Declare confident results and view the history of recent winning numbers.*

### 4. Daily Reset
![Daily Reset](admin-daily.png)
*Cron job tracking and management interface for seamless day-switching.*

### 5. Live Monitoring
![Live Monitoring](admin-live.png)
*Raw, real-time feed tracking explicit user bets, amounts, and types minute-by-minute.*

---

## 🗄️ Database Architecture

Below is the entity-relationship diagram representing the core PostgreSQL schema used by the platform:

![Database Schema](supabase-schema-ptkeaosdjmrqsnlbxdyy.png)
*High-performance schema featuring ACID-compliant wallets, real-time bet tracking, and dynamic regional market schedules.*

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Supabase)

### 1. Database Setup
1. Create a PostgreSQL database.
2. Run the SQL script located in `backend/schema.sql` to initialize tables and initial markets.

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory (see `.env.example` for reference):
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/betting_db
JWT_SECRET=your_super_secret_key
```
Start the server:
```bash
npm start
# or 
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
---

## 🔑 Test Credentials 

To test the application locally or in a deployed staging environment, use the following dummy credentials:

### 👤 User Panel
- **Mobile Number:** `9999999999`
- **Password:** `123456`
*(Note: OTP is bypassed for test accounts in development or uses a static OTP depending on `.env` configuration)*

### 🛡️ Admin Panel
- **Email / ID:** `admin@markethub.com`
- **Password:** `admin123`

---

The application will be accessible at `http://localhost:3000` (Frontend) and `http://localhost:5000` (Backend).

---

## 🔒 API Security & Concurrency

### 1. Server-Side Market Time Validation Logic
To ensure a user cannot place a bet if the market time is closed, validation is enforced on the server-side, not just the client-side.

**Logic Applied:**
Before placing a bet, the backend checks:
- The market exists.
- The market is active.
- The current server time (Asia/Kolkata) is within the open and close window.
*If any condition fails, the backend strictly rejects the bet.*

**Node.js Backend Check:**
```javascript
const market = await db.query(`
SELECT *
FROM markets
WHERE id=$1
AND is_active=true
AND (NOW() AT TIME ZONE 'Asia/Kolkata')::time 
    BETWEEN open_time AND close_time
`, [marketId]);

if (!market.rows.length)
  return res.status(400).json({ error: "Market is closed" });
```
*Even if the frontend is bypassed or sends a fake request, the server blocks it.*

### 2. Concurrency Protection Logic (Double Bet Prevention)
**Problem:** What happens if a user bets twice quickly? (e.g., clicking 'Place Bet' twice very fast resulting in 2 simultaneous requests hitting the backend, potentially deducing the wallet twice or going negative).

**Solution Applied:**
We utilize **database transactions** combined with **row-level locking** (`FOR UPDATE`). Only one request can access the user's wallet row at a time.

**Transaction Logic (SQL representation):**
```sql
BEGIN;

-- Lock the wallet row exclusively for this transaction
SELECT wallet_balance
FROM users
WHERE id = userId
FOR UPDATE;

-- Check if there is enough balance
IF wallet_balance < betAmount THEN
   RAISE EXCEPTION 'Insufficient balance';
END IF;

-- Deduct balance
UPDATE users
SET wallet_balance = wallet_balance - betAmount
WHERE id = userId;

-- Insert the bet
INSERT INTO bets (...) VALUES (...);

COMMIT;
```
**Why This Works:**
The `FOR UPDATE` lock ensures that:
1. **Req1** hits and locks the row.
2. **Req2** hits but is forced to *wait*.
3. **Req1** finishes its transaction, updating the balance.
4. **Req2** gets the lock, rechecks the (now updated) balance, and if insufficient, cleanly fails. 
*This makes double deductions mathematically impossible.*

---

## 🏗 Scalability Approach (High Concurrency)

To support **100k+ simultaneous bets**, the architecture employs the following robust strategies:

1. **Database Connection Pooling:** 
   The `pg` library is configured with a high-capacity connection pool (`max: 50`) and strict timeouts to prevent exhausting database connections during traffic spikes (e.g. 1 minute before market closes).

2. **ACID Transactions & Row-Level Locking:**
   When a user places a bet, we lock their specific wallet balance row: `SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE`. This strictly prevents race conditions and negative wallet balances even if 50 requests hit simultaneously for the exact same user.

3. **Stateless JWT Authentication:** 
   Sessions are managed via JWT rather than database-backed sessions. This eliminates a database read-write cycle on every authenticated request, drastically reducing DB load.

4. **Rate Limiting:**
   `express-rate-limit` prevents DDoS by capping requests by IP to 1000 requests per 15-minute window.

5. **Socket.IO Event Driven Updates:**
   By replacing 5-second `setInterval` HTTP polling with a single persistent WebSocket connection per client, server load is reduced exponentially. The server selectively broadcasts events (`new-bet`, `market-status`) only when data mutations actually occur.

6. **Optimized Indexes:**
   Crucial exact-match columns (`selected_number`, `market_id`, `created_at`) have explicit B-Tree indexes in `schema.sql`, assuring O(log n) lookups for aggregate tasks like "How many users bet on 120 today?".

7. **Next Steps for 1M+ Scale:**
   - Appending Redis for caching market metadata (static timings) and Socket.IO adapters for multi-node messaging.
   - Establishing a queueing system (RabbitMQ/Kafka) for asynchronous bet processing and ledger writes instead of immediate synchronous inserts.

---

## 🎨 Gamified UX Strategy

- **Framer Motion Elements:** Modals and balances animate elegantly to give a "casino" feel (see `Wallet.jsx` rolling number effect).
- **Gamified Colors Theme:** Utilizing custom Neon styling directly in `tailwind.config.js` (`gameNeon`, `gameGold`, etc.) replacing standard dull UI templates.
- **Smart Logic Execution:** Core rules run gracefully in the front-end to eliminate server round-trips for validation (e.g. Smart filtering that converts "913" to "139" visually).
