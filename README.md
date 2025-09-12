# Personal Finance App

A comprehensive personal finance tracking application built with React and Node.js, featuring transaction management, budgeting, CSV import, and multi-language support.

## Features

### 📊 Transaction Management
- Add, edit, and delete transactions
- Filter by date ranges, accounts, and categories
- Search functionality across transaction descriptions
- Transaction categorization with subcategories
- Bulk CSV import with duplicate detection
- Support for income and expense tracking

### 💰 Budget Management
- Monthly budget planning by category
- Sub-budget support for detailed categorization
- Budget vs. actual spending comparisons
- Copy budgets from previous months
- Rollover unused budget to next month
- Visual budget progress indicators

### 📈 Analytics & Reporting
- Monthly spending summaries
- Category-wise expense breakdowns
- Interactive charts and visualizations
- Income vs. expense tracking
- Account balance monitoring

### 🔧 Data Management
- Custom account types management
- CSV file import/export
- Duplicate transaction detection
- Data backup and migration
- PostgreSQL database persistence

### 🌍 Multi-language Support
- English and Spanish language options
- Localized currency formatting
- Date formatting per locale

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **PapaParse** - CSV processing
- **Tailwind CSS** - Styling (configured)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **PostgreSQL** - Database
- **CORS** - Cross-origin resource sharing

## Getting Started

### Prerequisites
- Node.js 16+ 
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Test2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb transactions
   
   # The application will create tables automatically on first run
   ```

4. **Configure database connection**
   Update the database connection settings in `server.js`:
   ```javascript
   const pool = new Pool({
     user: 'your_username',
     host: 'localhost',
     database: 'transactions',
     password: 'your_password',
     port: 5432,
   });
   ```

5. **Start the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   npm run server  # Backend on port 3001
   npm start       # Frontend on port 3000
   ```

6. **Access the application**
   Open http://localhost:3000 in your browser

## Database Schema

The application uses the following PostgreSQL tables:

- **transactions** - Store all financial transactions
- **budgets** - Monthly budget allocations by category
- **sub_budgets** - Detailed sub-category budgets
- **account_types** - Custom account type definitions
- **categories** - Transaction categories
- **settings** - Application configuration

## Usage Guide

### Adding Transactions
1. Navigate to the main dashboard
2. Click "Add Transaction" 
3. Fill in transaction details (date, amount, description, category, account)
4. Save the transaction

### CSV Import
1. Go to "Import CSV" 
2. Select your CSV file
3. Map columns to transaction fields
4. Choose or add account type
5. Review and import transactions

### Budget Management
1. Click on "Budgets" tab
2. Select the month you want to budget for
3. Add categories and set budget amounts
4. Use "Copy From Previous Month" to duplicate budgets
5. Monitor spending vs. budget throughout the month

### Account Types Management
1. Go to "Data Settings" tab
2. View, add, edit, or remove account types
3. Account types are used in transaction categorization and CSV imports

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/bulk` - Bulk import transactions

### Budgets
- `GET /api/budgets/:month` - Get budgets for month
- `PUT /api/budgets/:month/:category` - Update budget
- `DELETE /api/budgets/:month/:category` - Delete budget
- `POST /api/budgets/bulk` - Bulk save budgets

### Account Types
- `GET /api/account-types` - Get all account types
- `POST /api/account-types` - Create account type
- `PUT /api/account-types/:oldName` - Update account type name
- `DELETE /api/account-types/:name` - Delete account type

### Categories & Settings
- `GET /api/categories` - Get all categories
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting

## Configuration

### Environment Variables
Create a `.env` file for production deployments:
```env
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
PORT=3001
```

### Default Settings
- Duplicate detection: Enabled
- Default language: English
- Default account types: Checking, Savings, Credit Card, Cash, Investment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Troubleshooting

### Common Issues

**Database Connection Error**
- Ensure PostgreSQL is running
- Verify database credentials in `server.js`
- Check that the `transactions` database exists

**CSV Import Failures**
- Ensure CSV has proper headers
- Check date format (YYYY-MM-DD recommended)
- Verify account types exist in system

**Budget Not Saving**
- Check browser console for API errors
- Ensure server is running on port 3001
- Verify database connection

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
1. Check the browser console for error messages
2. Verify all dependencies are installed correctly  
3. Ensure PostgreSQL is running and accessible
4. Check that both frontend (3000) and backend (3001) servers are running

---

Built with ❤️ using React and Node.js