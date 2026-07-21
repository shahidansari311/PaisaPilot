import { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        personName TEXT,
        personPhone TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        accountId TEXT NOT NULL,
        categoryId TEXT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        categoryId TEXT,
        amount REAL NOT NULL,
        period TEXT NOT NULL,
        month TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS borrow_records (
        id TEXT PRIMARY KEY NOT NULL,
        person TEXT NOT NULL,
        amount REAL NOT NULL,
        dueDate TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lend_records (
        id TEXT PRIMARY KEY NOT NULL,
        person TEXT NOT NULL,
        amount REAL NOT NULL,
        dueDate TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL DEFAULT 0,
        targetDate TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS split_groups (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS split_participants (
        id TEXT PRIMARY KEY NOT NULL,
        groupId TEXT NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (groupId) REFERENCES split_groups (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS split_expenses (
        id TEXT PRIMARY KEY NOT NULL,
        groupId TEXT NOT NULL,
        paidBy TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        description TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (groupId) REFERENCES split_groups (id) ON DELETE CASCADE,
        FOREIGN KEY (paidBy) REFERENCES split_participants (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS split_shares (
        expenseId TEXT NOT NULL,
        participantId TEXT NOT NULL,
        owedAmount REAL NOT NULL,
        PRIMARY KEY (expenseId, participantId),
        FOREIGN KEY (expenseId) REFERENCES split_expenses (id) ON DELETE CASCADE,
        FOREIGN KEY (participantId) REFERENCES split_participants (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS roommate_ledgers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roommate_entries (
        id TEXT PRIMARY KEY NOT NULL,
        ledgerId TEXT NOT NULL,
        paidBy TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        isPaid INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (ledgerId) REFERENCES roommate_ledgers (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(strftime('%Y-%m', date));
      CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
      CREATE INDEX IF NOT EXISTS idx_borrow_status ON borrow_records(status);
      CREATE INDEX IF NOT EXISTS idx_lend_status ON lend_records(status);
      CREATE INDEX IF NOT EXISTS idx_roommate_entries_ledger ON roommate_entries(ledgerId);
    `);

    // Migrations (safe to run on existing installs)
    try { await db.execAsync('ALTER TABLE budgets ADD COLUMN month TEXT'); } catch {}
    try { await db.execAsync('ALTER TABLE borrow_records ADD COLUMN phone TEXT'); } catch {}
    try { await db.execAsync('ALTER TABLE lend_records ADD COLUMN phone TEXT'); } catch {}

    // Profile/settings key-value store
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    // Auto-create hidden default wallet (used by all transactions)
    await db.runAsync(
      `INSERT OR IGNORE INTO accounts (id, name, type, balance, createdAt) VALUES (?, ?, ?, ?, ?)`,
      ['default-wallet', 'My Wallet', 'Cash', 0, new Date().toISOString()]
    );

    // Seed practical student categories if none exist
    const catCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    if ((catCount?.count ?? 0) === 0) {
      await db.execAsync(`
        INSERT INTO categories (id, name, icon, color, type, createdAt) VALUES
          ('cat-food',       'Food',          'coffee',       '#F43F5E', 'expense', datetime('now')),
          ('cat-transport',  'Transport',     'car',          '#F59E0B', 'expense', datetime('now')),
          ('cat-shopping',   'Shopping',      'bag',          '#8B5CF6', 'expense', datetime('now')),
          ('cat-education',  'Education',     'book',         '#3B82F6', 'expense', datetime('now')),
          ('cat-health',     'Health',        'heart',        '#10B981', 'expense', datetime('now')),
          ('cat-bills',      'Bills',         'file',         '#64748B', 'expense', datetime('now')),
          ('cat-fun',        'Fun & Outings', 'smile',        '#EC4899', 'expense', datetime('now')),
          ('cat-other-exp',  'Other',         'more',         '#94A3B8', 'expense', datetime('now')),
          ('cat-salary',     'Salary',        'briefcase',    '#10B981', 'income',  datetime('now')),
          ('cat-freelance',  'Freelance',     'laptop',       '#8B5CF6', 'income',  datetime('now')),
          ('cat-gift',       'Gift / Pocket', 'gift',         '#F59E0B', 'income',  datetime('now')),
          ('cat-other-inc',  'Other Income',  'more',         '#94A3B8', 'income',  datetime('now'));
      `);
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
