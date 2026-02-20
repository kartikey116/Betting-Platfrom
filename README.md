# Gamified Betting Platform 🎰

A production-ready, mobile-first betting web application featuring a highly gamified UI/UX similar to modern mobile games.

## Quick Start (Local Development)

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
```
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

The application will be accessible at `http://localhost:3000` (Frontend) and `http://localhost:5000` (Backend).

## Scalability Approach (High Concurrency)

To support **100k simultaneous bets**, the architecture employs the following strategies:

1. **Database Connection Pooling**: 
   The `pg` library is configured with a high-capacity connection pool (`max: 50`) and strict timeouts to prevent exhausting database connections during traffic spikes (e.g. 1 minute before market closes).

2. **ACID Transactions with Row-Level Locking:**
   When a user places a bet, we lock their specific wallet balance row: `SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE`. This strictly prevents race conditions and negative wallet balances even if 50 requests hit simultaneously for the same user.

3. **Stateless JWT Authentication**: 
   Sessions are managed via JWT rather than database-backed sessions. This eliminates a database read-write cycle on every authenticated request, drastically reducing DB load.

4. **Rate Limiting**:
   `express-rate-limit` prevents DDoS by capping requests by IP to 1000 requests per 15-minute window.

5. **Optimized Indexes**:
   Crucial exact-match columns (`selected_number`, `market_id`, `created_at`) have explicit B-Tree indexes in `schema.sql`, assuring O(log n) lookups for aggregate tasks like "How many users bet on 120 today?".

6. **Next Steps for 1M+ Scale**:
   - Introduce Redis for caching market metadata (static timings).
   - Use a queueing system (RabbitMQ/Kafka) for asynchronous bet processing and ledger writes instead of immediate synchronous inserts.

## Gamified UX Strategy

- **Framer Motion Elements**: Modals and balances animate elegantly to give a "casino" feel (see `Wallet.jsx` rolling number effect).
- **Gamified Colors Theme**: Utilizing custom Neon styling directly in `tailwind.config.js` (`gameNeon`, `gameGold`, etc.) replacing standard dull UI templates.
- **Smart Panna Algorithm**: Auto-completion logic is baked directly into the frontend which respects the sorting math rule `1 < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 0` to suggest the best bets intelligently.
