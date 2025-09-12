const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Database connection
const pool = new Pool({
  user: process.env.USER || 'enriquetuckett', // Use environment variable or fallback
  host: 'localhost',
  database: 'transactions',
  password: '', // No password for local setup
  port: 5432,
});

// Test database connection and initialize users table
pool.connect()
  .then(async () => {
    console.log('Connected to PostgreSQL database');
    
    // Create users table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add user_id column to all tables if they don't exist
      try {
        // Transactions table
        await pool.query(`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
        `);
        
        // Budgets table
        await pool.query(`
          ALTER TABLE budgets 
          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
        `);
        
        // Sub-budgets table
        await pool.query(`
          ALTER TABLE sub_budgets 
          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
        `);
        
        // Categories table
        await pool.query(`
          ALTER TABLE categories 
          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
        `);
        
        await pool.query(`
          ALTER TABLE categories 
          ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE
        `);
        
        // Account types table
        await pool.query(`
          ALTER TABLE account_types 
          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
        `);
        
        // User settings table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_settings (
            id SERIAL PRIMARY KEY,
            setting_key VARCHAR(255) NOT NULL,
            setting_value TEXT,
            user_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await pool.query(`
          ALTER TABLE user_settings 
          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
        `);
        
        // Update unique constraints to include user_id for proper isolation
        try {
          await pool.query(`
            ALTER TABLE budgets 
            DROP CONSTRAINT IF EXISTS budgets_month_category_key
          `);
        } catch (err) {
          console.log('Old budgets constraint might not exist, continuing...');
        }
        
        try {
          await pool.query(`
            ALTER TABLE budgets 
            ADD CONSTRAINT budgets_month_category_user_key UNIQUE (month, category, user_id)
          `);
        } catch (err) {
          console.log('Budgets constraint already exists or failed to create:', err.message);
        }
        
        try {
          await pool.query(`
            ALTER TABLE sub_budgets 
            DROP CONSTRAINT IF EXISTS sub_budgets_month_parent_category_sub_category_key
          `);
        } catch (err) {
          console.log('Old sub_budgets constraint might not exist, continuing...');
        }
        
        try {
          await pool.query(`
            ALTER TABLE sub_budgets 
            ADD CONSTRAINT sub_budgets_month_parent_sub_user_key UNIQUE (month, parent_category, sub_category, user_id)
          `);
        } catch (err) {
          console.log('Sub_budgets constraint already exists or failed to create:', err.message);
        }
        
        try {
          await pool.query(`
            ALTER TABLE categories 
            DROP CONSTRAINT IF EXISTS categories_name_key
          `);
        } catch (err) {
          console.log('Old categories constraint might not exist, continuing...');
        }
        
        try {
          await pool.query(`
            ALTER TABLE categories 
            ADD CONSTRAINT categories_name_user_key UNIQUE (name, user_id)
          `);
        } catch (err) {
          console.log('Categories constraint already exists or failed to create:', err.message);
        }
        
        try {
          await pool.query(`
            ALTER TABLE account_types 
            DROP CONSTRAINT IF EXISTS account_types_name_key
          `);
        } catch (err) {
          console.log('Old account_types constraint might not exist, continuing...');
        }
        
        try {
          await pool.query(`
            ALTER TABLE account_types 
            ADD CONSTRAINT account_types_name_user_key UNIQUE (name, user_id)
          `);
        } catch (err) {
          console.log('Account_types constraint already exists or failed to create:', err.message);
        }
        
        try {
          await pool.query(`
            ALTER TABLE user_settings 
            DROP CONSTRAINT IF EXISTS user_settings_setting_key_key
          `);
        } catch (err) {
          console.log('Old user_settings constraint might not exist, continuing...');
        }
        
        try {
          await pool.query(`
            ALTER TABLE user_settings 
            ADD CONSTRAINT user_settings_key_user_key UNIQUE (setting_key, user_id)
          `);
        } catch (err) {
          console.log('User_settings constraint already exists or failed to create:', err.message);
        }
        
      } catch (err) {
        // Columns or constraints might already exist, ignore errors
        console.log('Database migration completed with some warnings:', err.message);
      }

      // Create your user account if it doesn't exist
      const userAccount = await pool.query('SELECT * FROM users WHERE username = $1', ['etuckett']);
      if (userAccount.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('ubfaKi3v', 10);
        const result = await pool.query(
          'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
          ['etuckett', hashedPassword]
        );
        const userId = result.rows[0].id;
        
        // Migrate existing data to your account
        await pool.query('UPDATE transactions SET user_id = $1 WHERE user_id IS NULL', [userId]);
        await pool.query('UPDATE budgets SET user_id = $1 WHERE user_id IS NULL', [userId]);
        await pool.query('UPDATE sub_budgets SET user_id = $1 WHERE user_id IS NULL', [userId]);
        await pool.query('UPDATE categories SET user_id = $1 WHERE user_id IS NULL', [userId]);
        await pool.query('UPDATE account_types SET user_id = $1 WHERE user_id IS NULL', [userId]);
        await pool.query('UPDATE user_settings SET user_id = $1 WHERE user_id IS NULL', [userId]);
        
        console.log('User account created: username=etuckett');
        console.log('Existing data migrated to your account');
      }
      
      // Create default categories if they don't exist
      const defaultCategories = ['Income', 'Other'];
      for (const categoryName of defaultCategories) {
        const existing = await pool.query('SELECT * FROM categories WHERE name = $1 AND is_default = TRUE', [categoryName]);
        if (existing.rows.length === 0) {
          await pool.query(
            'INSERT INTO categories (name, is_default, updated_at) VALUES ($1, TRUE, CURRENT_TIMESTAMP) ON CONFLICT (name) DO UPDATE SET is_default = TRUE',
            [categoryName]
          );
        }
      }
      console.log('Default categories ensured');

      // Remove demo user if it exists
      await pool.query('DELETE FROM users WHERE username = $1', ['demo']);
      console.log('Demo user removed');
    } catch (err) {
      console.error('Error setting up users table:', err);
    }
  })
  .catch(err => console.error('Database connection error:', err));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user in database
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      userId: user.id,
      username: user.username,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if username already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const newUser = result.rows[0];
    res.status(201).json({
      userId: newUser.id,
      username: newUser.username,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verify user still exists
    const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.id,
      username: user.username,
      message: 'Token valid'
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password (protected route)
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    // Get user from database
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedNewPassword, req.user.userId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Get all transactions (protected route)
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID (protected route)
app.get('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create new transaction (protected route)
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { date, amount, description, category, subcategory, account, transaction_type } = req.body;
    
    // Validate required fields
    if (!date || !amount || !account) {
      return res.status(400).json({ error: 'Date, amount, and account are required' });
    }
    
    // Determine transaction type if not provided
    const type = transaction_type || (amount < 0 ? 'expense' : 'income');
    
    const result = await pool.query(
      'INSERT INTO transactions (date, amount, description, category, subcategory, account, transaction_type, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [date, amount, description || '', category || '', subcategory || null, account, type, req.user.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction (protected route)
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, amount, description, category, subcategory, account, transaction_type } = req.body;
    
    // Validate required fields
    if (!date || !amount || !account) {
      return res.status(400).json({ error: 'Date, amount, and account are required' });
    }
    
    // Determine transaction type if not provided
    const type = transaction_type || (amount < 0 ? 'expense' : 'income');
    
    const result = await pool.query(
      'UPDATE transactions SET date = $1, amount = $2, description = $3, category = $4, subcategory = $5, account = $6, transaction_type = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND user_id = $9 RETURNING *',
      [date, amount, description || '', category || '', subcategory || null, account, type, id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction (protected route)
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully', transaction: result.rows[0] });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Bulk import transactions (for CSV uploads)
app.post('/api/transactions/bulk', authenticateToken, async (req, res) => {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions array is required' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertedTransactions = [];
      
      for (const transaction of transactions) {
        const { date, amount, description, category, subcategory, account, transaction_type } = transaction;
        
        // Validate required fields
        if (!date || !amount || !account) {
          throw new Error('Date, amount, and account are required for all transactions');
        }
        
        // Determine transaction type if not provided
        const type = transaction_type || (amount < 0 ? 'expense' : 'income');
        
        const result = await client.query(
          'INSERT INTO transactions (date, amount, description, category, subcategory, account, transaction_type, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [date, amount, description || '', category || '', subcategory || null, account, type, req.user.userId]
        );
        
        insertedTransactions.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json({ 
        message: `Successfully imported ${insertedTransactions.length} transactions`,
        transactions: insertedTransactions 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error bulk importing transactions:', error);
    res.status(500).json({ error: 'Failed to import transactions: ' + error.message });
  }
});

// BUDGET ENDPOINTS

// Get all budgets for a specific month (protected route)
app.get('/api/budgets/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    const result = await pool.query('SELECT * FROM budgets WHERE month = $1 AND user_id = $2', [month, req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Get all budgets (all months) (protected route)
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budgets WHERE user_id = $1 ORDER BY month DESC, category', [req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create or update budget (protected route)
app.put('/api/budgets/:month/:category', authenticateToken, async (req, res) => {
  try {
    const { month, category } = req.params;
    const { amount } = req.body;
    
    if (!amount && amount !== 0) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    // Check if budget already exists for this user
    const existingBudget = await pool.query(
      'SELECT * FROM budgets WHERE month = $1 AND category = $2 AND user_id = $3',
      [month, category, req.user.userId]
    );
    
    let result;
    if (existingBudget.rows.length > 0) {
      // Update existing budget
      result = await pool.query(
        'UPDATE budgets SET amount = $1, updated_at = CURRENT_TIMESTAMP WHERE month = $2 AND category = $3 AND user_id = $4 RETURNING *',
        [amount, month, category, req.user.userId]
      );
    } else {
      // Insert new budget
      result = await pool.query(
        'INSERT INTO budgets (month, category, amount, user_id, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
        [month, category, amount, req.user.userId]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete budget (protected route)
app.delete('/api/budgets/:month/:category', authenticateToken, async (req, res) => {
  try {
    const { month, category } = req.params;
    const result = await pool.query(
      'DELETE FROM budgets WHERE month = $1 AND category = $2 AND user_id = $3 RETURNING *',
      [month, category, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully', budget: result.rows[0] });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// SUB-BUDGET ENDPOINTS

// Get all sub-budgets for a specific month (protected route)
app.get('/api/sub-budgets/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    const result = await pool.query('SELECT * FROM sub_budgets WHERE month = $1 AND user_id = $2', [month, req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sub-budgets:', error);
    res.status(500).json({ error: 'Failed to fetch sub-budgets' });
  }
});

// Get all sub-budgets (all months) (protected route)
app.get('/api/sub-budgets', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sub_budgets WHERE user_id = $1 ORDER BY month DESC, parent_category, sub_category', [req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all sub-budgets:', error);
    res.status(500).json({ error: 'Failed to fetch sub-budgets' });
  }
});

// Create or update sub-budget (protected route)
app.put('/api/sub-budgets/:month/:parentCategory/:subCategory', authenticateToken, async (req, res) => {
  try {
    const { month, parentCategory, subCategory } = req.params;
    const { amount } = req.body;
    
    if (!amount && amount !== 0) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    // Check if sub-budget already exists for this user
    const existingSubBudget = await pool.query(
      'SELECT * FROM sub_budgets WHERE month = $1 AND parent_category = $2 AND sub_category = $3 AND user_id = $4',
      [month, parentCategory, subCategory, req.user.userId]
    );
    
    let result;
    if (existingSubBudget.rows.length > 0) {
      // Update existing sub-budget
      result = await pool.query(
        'UPDATE sub_budgets SET amount = $1, updated_at = CURRENT_TIMESTAMP WHERE month = $2 AND parent_category = $3 AND sub_category = $4 AND user_id = $5 RETURNING *',
        [amount, month, parentCategory, subCategory, req.user.userId]
      );
    } else {
      // Insert new sub-budget
      result = await pool.query(
        'INSERT INTO sub_budgets (month, parent_category, sub_category, amount, user_id, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *',
        [month, parentCategory, subCategory, amount, req.user.userId]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating sub-budget:', error);
    res.status(500).json({ error: 'Failed to update sub-budget' });
  }
});

// Delete sub-budget (protected route)
app.delete('/api/sub-budgets/:month/:parentCategory/:subCategory', authenticateToken, async (req, res) => {
  try {
    const { month, parentCategory, subCategory } = req.params;
    const result = await pool.query(
      'DELETE FROM sub_budgets WHERE month = $1 AND parent_category = $2 AND sub_category = $3 AND user_id = $4 RETURNING *',
      [month, parentCategory, subCategory, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-budget not found' });
    }
    
    res.json({ message: 'Sub-budget deleted successfully', subBudget: result.rows[0] });
  } catch (error) {
    console.error('Error deleting sub-budget:', error);
    res.status(500).json({ error: 'Failed to delete sub-budget' });
  }
});

// Bulk operations for budgets (protected route)
app.post('/api/budgets/bulk', authenticateToken, async (req, res) => {
  try {
    const { budgets } = req.body;
    
    if (!budgets || !Array.isArray(budgets)) {
      return res.status(400).json({ error: 'Budgets array is required' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      
      for (const budget of budgets) {
        const { month, category, amount } = budget;
        
        if (!month || !category || (!amount && amount !== 0)) {
          throw new Error('Month, category, and amount are required for all budgets');
        }
        
        // Check if budget already exists for this user
        const existingBudget = await client.query(
          'SELECT * FROM budgets WHERE month = $1 AND category = $2 AND user_id = $3',
          [month, category, req.user.userId]
        );
        
        let result;
        if (existingBudget.rows.length > 0) {
          // Update existing budget
          result = await client.query(
            'UPDATE budgets SET amount = $1, updated_at = CURRENT_TIMESTAMP WHERE month = $2 AND category = $3 AND user_id = $4 RETURNING *',
            [amount, month, category, req.user.userId]
          );
        } else {
          // Insert new budget
          result = await client.query(
            'INSERT INTO budgets (month, category, amount, user_id, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
            [month, category, amount, req.user.userId]
          );
        }
        
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json({ 
        message: `Successfully saved ${results.length} budgets`,
        budgets: results 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error bulk saving budgets:', error);
    res.status(500).json({ error: 'Failed to save budgets: ' + error.message });
  }
});

// CATEGORIES ENDPOINTS

// Get all categories (protected route)
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    // Get both default categories (shared) and user-specific categories
    const result = await pool.query(
      'SELECT * FROM categories WHERE is_default = TRUE OR user_id = $1 ORDER BY is_default DESC, name', 
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category (protected route)
app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO categories (name, user_id, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *',
      [name.trim(), req.user.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Category already exists' });
    } else {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// Delete category (protected route)
app.delete('/api/categories/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    
    // Prevent deletion of core categories
    if (['Other', 'Income'].includes(name)) {
      return res.status(400).json({ error: `Cannot delete the "${name}" category` });
    }
    
    const result = await pool.query('DELETE FROM categories WHERE name = $1 AND user_id = $2 RETURNING *', [name, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully', category: result.rows[0] });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// USER SETTINGS ENDPOINTS

// Get all settings (protected route)
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.userId]);
    const settings = {};
    result.rows.forEach(row => {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch (e) {
        settings[row.setting_key] = row.setting_value;
      }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get specific setting
app.get('/api/settings/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.userId;
    const result = await pool.query('SELECT setting_value FROM user_settings WHERE setting_key = $1 AND user_id = $2', [key, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    let value;
    try {
      value = JSON.parse(result.rows[0].setting_value);
    } catch (e) {
      value = result.rows[0].setting_value;
    }
    
    res.json({ [key]: value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Set/update setting
app.put('/api/settings/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user.userId;
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Check if setting already exists for this user
    const existingSetting = await pool.query(
      'SELECT * FROM user_settings WHERE setting_key = $1 AND user_id = $2',
      [key, userId]
    );
    
    let result;
    if (existingSetting.rows.length > 0) {
      // Update existing setting
      result = await pool.query(
        'UPDATE user_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2 AND user_id = $3 RETURNING *',
        [stringValue, key, userId]
      );
    } else {
      // Insert new setting
      result = await pool.query(
        'INSERT INTO user_settings (setting_key, setting_value, user_id, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
        [key, stringValue, userId]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Delete setting
app.delete('/api/settings/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.userId;
    const result = await pool.query('DELETE FROM user_settings WHERE setting_key = $1 AND user_id = $2 RETURNING *', [key, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ message: 'Setting deleted successfully', setting: result.rows[0] });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Account Types endpoints
// Get all account types (protected route)
app.get('/api/account-types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM account_types WHERE user_id = $1 ORDER BY name', [req.user.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching account types:', err);
    res.status(500).json({ error: 'Failed to fetch account types' });
  }
});

// Create new account type (protected route)
app.post('/api/account-types', authenticateToken, async (req, res) => {
  try {
    const { name, account_behavior = 'asset' } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Account type name is required' });
    }

    if (account_behavior && !['asset', 'liability'].includes(account_behavior)) {
      return res.status(400).json({ error: 'Account behavior must be either "asset" or "liability"' });
    }
    
    const result = await pool.query(
      'INSERT INTO account_types (name, account_behavior, user_id, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
      [name.trim(), account_behavior, req.user.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Account type name already exists' });
    } else {
      console.error('Error creating account type:', err);
      res.status(500).json({ error: 'Failed to create account type' });
    }
  }
});

// Delete account type
// Update account type name (protected route)
app.put('/api/account-types/:oldName', authenticateToken, async (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;
    
    if (!newName || typeof newName !== 'string') {
      return res.status(400).json({ error: 'New account type name is required' });
    }
    
    const trimmedNewName = newName.trim();
    if (trimmedNewName === oldName) {
      return res.status(400).json({ error: 'New name must be different from current name' });
    }
    
    // Use transaction to ensure atomicity
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the account type name with user isolation
      const accountTypeResult = await client.query(
        'UPDATE account_types SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2 AND user_id = $3 RETURNING *',
        [trimmedNewName, oldName, req.user.userId]
      );
      
      if (accountTypeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Account type not found' });
      }
      
      // Update all transactions that use this account type (with user isolation)
      await client.query(
        'UPDATE transactions SET account = $1 WHERE account = $2 AND user_id = $3',
        [trimmedNewName, oldName, req.user.userId]
      );
      
      await client.query('COMMIT');
      res.json({ 
        message: 'Account type updated successfully',
        accountType: accountTypeResult.rows[0]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Error updating account type:', err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'An account type with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update account type' });
    }
  }
});

// Update account type behavior (protected route)
app.put('/api/account-types/:name/behavior', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    const { account_behavior } = req.body;
    
    if (!account_behavior || !['asset', 'liability'].includes(account_behavior)) {
      return res.status(400).json({ error: 'Account behavior must be either "asset" or "liability"' });
    }
    
    const result = await pool.query(
      'UPDATE account_types SET account_behavior = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2 AND user_id = $3 RETURNING *',
      [account_behavior, name, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account type not found' });
    }
    
    res.json({ 
      message: 'Account behavior updated successfully',
      accountType: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error updating account behavior:', err);
    res.status(500).json({ error: 'Failed to update account behavior' });
  }
});

// Delete account type (protected route)
app.delete('/api/account-types/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    
    // Check if account type is being used by transactions (with user isolation)
    const transactionCheck = await pool.query('SELECT COUNT(*) FROM transactions WHERE account = $1 AND user_id = $2', [name, req.user.userId]);
    const transactionCount = parseInt(transactionCheck.rows[0].count);
    
    if (transactionCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete account type "${name}" because it is used by ${transactionCount} transaction(s)` 
      });
    }
    
    const result = await pool.query('DELETE FROM account_types WHERE name = $1 AND user_id = $2 RETURNING *', [name, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account type not found' });
    }
    
    res.json({ message: 'Account type deleted successfully', accountType: result.rows[0] });
  } catch (err) {
    console.error('Error deleting account type:', err);
    res.status(500).json({ error: 'Failed to delete account type' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;