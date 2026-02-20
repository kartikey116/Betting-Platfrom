-- schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  role VARCHAR(10) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS markets (
  id OID PRIMARY KEY, -- We'll use specific IDs, e.g., 1=Laxmi, 2=Shridevi, 3=Karnatak
  name VARCHAR(50) NOT NULL,
  open_time TIME NOT NULL, -- Format HH:MM:SS
  close_time TIME NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'declared'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  market_id OID REFERENCES markets(id) ON DELETE CASCADE,
  bet_type VARCHAR(20) NOT NULL, -- 'single_digit', 'jodi', 'single_panna', 'double_panna', 'triple_panna'
  selected_number VARCHAR(10) NOT NULL, -- e.g. "0", "45", "123"
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending', -- 'pending', 'won', 'lost'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  market_id OID REFERENCES markets(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  winning_number VARCHAR(10) NOT NULL, -- e.g. "123-45" (Panna-Jodi) or just final digit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(market_id, date)
);

-- Indexes for fast querying (e.g., finding how many users bet on 120 today)
CREATE INDEX idx_bets_market_date ON bets (market_id, created_at);
CREATE INDEX idx_bets_selected_number ON bets (selected_number);

-- Initial Data for Markets
INSERT INTO markets (id, name, open_time, close_time) VALUES
(1, 'Laxmi Morning', '09:00:00', '12:00:00'),
(2, 'Shridevi Morning', '13:00:00', '15:00:00'),
(3, 'Karnatak Day', '16:00:00', '19:00:00')
ON CONFLICT (id) DO NOTHING;
