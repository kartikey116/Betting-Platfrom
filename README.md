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



1. The Header (Top Bar)
Navigation: A back arrow (<) to easily return to your main Dashboard.
Market Info: Displays the name of the active market you are betting in (e.g., "Laxmi Morning") and an indicator showing that the market is currently "OPEN".
Wallet Status: Shows your live, real-time Wallet Balance (e.g., ₹50,000) so you know exactly how much you have available before betting.
2. Bet Type Selector (Scrollable Tabs)
Just below the header, you select the category of your bet before entering numbers:

Single Digit: Pick exactly one number (0-9).
Jodi: Pick a two-digit sequence (00-99).
Single / Double / Triple Panna: Pick a three-digit sequence (000-999).
3. Target Prediction (The Radar Input)
This is the main input area where you type the number you want to bet on. It has a high-tech "Radar" style interface.

The "Smart Panna" Rule in Action: If you have a "Panna" tab selected, this input area acts as a Smart Engine. If you type the digits 5, then 0, then 2 (502), the engine instantly applies your custom sorting rule (1 < 2 < 3 ... 9 < 0) and automatically rearranges the text to show 250 on the screen!
4. Smart Suggestions
Instead of typing, you can tap these four glowing buttons (labeled Hot, New, Gold, Trending).

If you haven't typed anything yet, it suggests popular starting numbers based on your chosen Bet Type.
If you start typing (e.g., you type 2), these buttons dynamically update to suggest valid Pannas or Jodis that start with 2.
5. Stake Selection (Amount Options)
Here, you define how much money you are betting.

Quick-select buttons allow you to instantly tap ₹100, ₹500, ₹10K, etc.
A MAX button instantly selects your entire remaining wallet balance.
The total chosen amount highlights in blue and is summarized directly above the buttons.
6. Confirm Bet & The "GPay" Execution Overlay
Once you have entered a Number and selected a Stake, you press the blue CONFIRM BET button at the bottom. This triggers the immersive gamified sequence we just built:

Processing HUD: A full-screen dark overlay pops up. A spinning neon-blue radar shows that the server is currently verifying your bet layout, checking your wallet, and applying the Panna filters.
Payment Completed (GPay-style!): After a brief calculation, the spinning blue radar transforms into a glowing Green Checkmark.
Deduction Summary: Massive text displays the exact amount successfully deducted (e.g. ₹500), alongside a receipt detailing the "Target Code" you bet on and the "Deducted from Wallet" confirmation.
Auto-Dismiss: 2 seconds later, this overlay neatly disappears, and you'll see your Wallet Balance at the top of the screen perfectly updated to reflect the new amount!