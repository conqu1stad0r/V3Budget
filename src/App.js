import React, { useState, useEffect } from 'react';
import { Upload, DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, Search, Filter, X, Check, Square, CheckSquare, Plus, Trash2, Save, Undo, Edit3, Edit } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

// Generate month options dynamically
const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();

    // Go back 2 years and forward 2 years from current date
    const startYear = currentYear - 2;
    const endYear = currentYear + 2;

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const date = new Date(year, month - 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        options.push({ value: monthKey, label: monthName });
      }
    }

    return options;
  };

const PersonalFinanceApp = () => {
  // Authentication state - check localStorage on initial load
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('isAuthenticated');
    return saved === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Update sample transactions to use current dates with much more variety
  const [transactions, setTransactions] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const transactions = [];
    let id = 1;

    // Generate transactions for the last 6 months
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const date = new Date(currentYear, currentMonth - 1 - monthOffset, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthStr = String(month).padStart(2, '0');
      const daysInMonth = new Date(year, month, 0).getDate();

      // Income transactions (beginning of month)
      transactions.push(
        { id: id++, accountType: 'Checking', date: `${year}-${monthStr}-01`, name: 'Salary Deposit', amount: 2500.00, category: 'Income' },
        { id: id++, accountType: 'Checking', date: `${year}-${monthStr}-15`, name: 'Salary Deposit', amount: 2500.00, category: 'Income' },
        { id: id++, accountType: 'Savings', date: `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`, name: 'Interest Payment', amount: 12.50 + Math.random() * 5, category: 'Income' }
      );

      // Mortgage (fixed, beginning of month)
      transactions.push(
        { id: id++, accountType: 'Checking', date: `${year}-${monthStr}-01`, name: 'Mortgage Payment', amount: -1850.00, category: 'Mortgage' }
      );

      // Utilities (semi-random amounts)
      transactions.push(
        { id: id++, accountType: 'Checking', date: `${year}-${monthStr}-05`, name: 'Electric Bill', amount: -(75 + Math.random() * 40), category: 'Utilities' },
        { id: id++, accountType: 'Checking', date: `${year}-${monthStr}-07`, name: 'Water Bill', amount: -(35 + Math.random() * 20), category: 'Utilities' },
        { id: id++, accountType: 'Checking', date: `${year}-${monthStr}-10`, name: 'Gas Company Bill', amount: -(45 + Math.random() * 50), category: 'Utilities' },
        { id: id++, accountType: 'Credit Card', date: `${year}-${monthStr}-12`, name: 'Internet & Cable', amount: -(85 + Math.random() * 25), category: 'Utilities' },
        { id: id++, accountType: 'Credit Card', date: `${year}-${monthStr}-15`, name: 'Phone Bill', amount: -(55 + Math.random() * 20), category: 'Utilities' }
      );

      // Food - lots of variety throughout the month
      const foodTransactions = [
        { name: 'Whole Foods', min: 80, max: 150 },
        { name: 'Trader Joes', min: 60, max: 120 },
        { name: 'Costco Groceries', min: 120, max: 200 },
        { name: 'Safeway', min: 50, max: 100 },
        { name: 'Starbucks Coffee', min: 5, max: 12 },
        { name: 'Chipotle', min: 12, max: 25 },
        { name: 'Panera Bread', min: 10, max: 20 },
        { name: 'Local Restaurant', min: 35, max: 85 },
        { name: 'Pizza Delivery', min: 25, max: 45 },
        { name: 'Sushi Restaurant', min: 40, max: 90 },
        { name: 'Fast Food', min: 8, max: 15 },
        { name: 'Deli Lunch', min: 10, max: 18 }
      ];

      // Add 12-18 food transactions per month
      const numFoodTransactions = 12 + Math.floor(Math.random() * 7);
      for (let i = 0; i < numFoodTransactions; i++) {
        const foodItem = foodTransactions[Math.floor(Math.random() * foodTransactions.length)];
        const day = 1 + Math.floor(Math.random() * daysInMonth);
        transactions.push({
          id: id++,
          accountType: Math.random() > 0.5 ? 'Credit Card' : 'Checking',
          date: `${year}-${monthStr}-${String(day).padStart(2, '0')}`,
          name: foodItem.name,
          amount: -(foodItem.min + Math.random() * (foodItem.max - foodItem.min)),
          category: 'Food'
        });
      }

      // Transportation
      const numGasTransactions = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numGasTransactions; i++) {
        const day = 2 + Math.floor(Math.random() * (daysInMonth - 2));
        const gasStations = ['Shell', 'Chevron', '76 Gas', 'Arco', 'BP'];
        transactions.push({
          id: id++,
          accountType: 'Credit Card',
          date: `${year}-${monthStr}-${String(day).padStart(2, '0')}`,
          name: gasStations[Math.floor(Math.random() * gasStations.length)],
          amount: -(35 + Math.random() * 30),
          category: 'Transportation'
        });
      }

      // Ride shares
      const numRides = Math.floor(Math.random() * 5);
      for (let i = 0; i < numRides; i++) {
        const day = 1 + Math.floor(Math.random() * daysInMonth);
        transactions.push({
          id: id++,
          accountType: 'Credit Card',
          date: `${year}-${monthStr}-${String(day).padStart(2, '0')}`,
          name: Math.random() > 0.5 ? 'Uber Ride' : 'Lyft Ride',
          amount: -(12 + Math.random() * 25),
          category: 'Transportation'
        });
      }

      // Entertainment
      const entertainmentItems = [
        { name: 'Netflix Subscription', amount: -15.99 },
        { name: 'Spotify Premium', amount: -9.99 },
        { name: 'Hulu Subscription', amount: -7.99 },
        { name: 'Disney+ Subscription', amount: -10.99 },
        { name: 'AMC Theater', min: 20, max: 50 },
        { name: 'Concert Tickets', min: 45, max: 150 },
        { name: 'Video Game Purchase', min: 30, max: 70 },
        { name: 'Bowling Alley', min: 25, max: 60 },
        { name: 'Mini Golf', min: 15, max: 35 }
      ];

      // Subscriptions
      transactions.push(
        { id: id++, accountType: 'Credit Card', date: `${year}-${monthStr}-01`, name: 'Netflix Subscription', amount: -15.99, category: 'Entertainment' },
        { id: id++, accountType: 'Credit Card', date: `${year}-${monthStr}-01`, name: 'Spotify Premium', amount: -9.99, category: 'Entertainment' }
      );

      // Random entertainment
      const numEntertainment = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numEntertainment; i++) {
        const item = entertainmentItems[4 + Math.floor(Math.random() * (entertainmentItems.length - 4))];
        const day = 1 + Math.floor(Math.random() * daysInMonth);
        transactions.push({
          id: id++,
          accountType: 'Credit Card',
          date: `${year}-${monthStr}-${String(day).padStart(2, '0')}`,
          name: item.name,
          amount: item.amount || -(item.min + Math.random() * (item.max - item.min)),
          category: 'Entertainment'
        });
      }

      // Shopping
      const shoppingItems = [
        { name: 'Amazon Purchase', min: 25, max: 150 },
        { name: 'Target Shopping', min: 40, max: 120 },
        { name: 'Best Buy Electronics', min: 80, max: 400 },
        { name: 'Nike Store', min: 60, max: 180 },
        { name: 'Home Depot', min: 35, max: 200 },
        { name: 'Macys Department Store', min: 50, max: 150 },
        { name: 'IKEA Furniture', min: 100, max: 500 },
        { name: 'Office Supplies', min: 20, max: 80 }
      ];

      const numShopping = 2 + Math.floor(Math.random() * 5);
      for (let i = 0; i < numShopping; i++) {
        const item = shoppingItems[Math.floor(Math.random() * shoppingItems.length)];
        const day = 1 + Math.floor(Math.random() * daysInMonth);
        transactions.push({
          id: id++,
          accountType: 'Credit Card',
          date: `${year}-${monthStr}-${String(day).padStart(2, '0')}`,
          name: item.name,
          amount: -(item.min + Math.random() * (item.max - item.min)),
          category: 'Shopping'
        });
      }

      // Healthcare
      const healthcareItems = [
        { name: 'CVS Pharmacy', min: 15, max: 60 },
        { name: 'Walgreens', min: 12, max: 55 },
        { name: 'Doctors Visit', min: 40, max: 150 },
        { name: 'Dental Checkup', min: 80, max: 200 },
        { name: 'Prescription Refill', min: 10, max: 40 },
        { name: 'Urgent Care', min: 100, max: 250 }
      ];

      const numHealthcare = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numHealthcare; i++) {
        const item = healthcareItems[Math.floor(Math.random() * healthcareItems.length)];
        const day = 1 + Math.floor(Math.random() * daysInMonth);
        transactions.push({
          id: id++,
          accountType: Math.random() > 0.6 ? 'Credit Card' : 'Checking',
          date: `${year}-${monthStr}-${String(day).padStart(2, '0')}`,
          name: item.name,
          amount: -(item.min + Math.random() * (item.max - item.min)),
          category: 'Healthcare'
        });
      }
    }

    // Sort transactions by date (newest first)
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  const [budgets, setBudgets] = useState({}); // Will store as: {'2024-08': {Food: 50, Entertainment: 100}, '2024-07': {...}}
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return saved || 'transactions';
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');

  // Analytics date range states
  const [analyticsDateFrom, setAnalyticsDateFrom] = useState('');
  const [analyticsDateTo, setAnalyticsDateTo] = useState('');
  const [analyticsViewType, setAnalyticsViewType] = useState('monthly'); // 'monthly', 'weekly', 'daily'
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState('All'); // 'All' or specific category name

  // Budget management states
  const [rolloverEnabled, setRolloverEnabled] = useState({});

  // Bulk selection states
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState('');

  // Manual transaction states
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    accountType: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: '',
    category: 'Other'
  });

  // Undo system
  const [undoStack, setUndoStack] = useState([]);
  const [showUndo, setShowUndo] = useState(false);

  // Category management
  const [categories, setCategories] = useState([
    'Food', 'Entertainment', 'Mortgage', 'Utilities', 'Transportation',
    'Healthcare', 'Shopping', 'Income', 'Other'
  ]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Transaction editing states
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      Papa.parse(file, {
        complete: (result) => {
          const headers = result.data[0];
          const rows = result.data.slice(1);

          // Store current transactions for undo
          const previousTransactions = [...transactions];

          const parsedTransactions = rows
            .filter(row => row.length >= 4 && row[0] && row[1] && row[2] && row[3])
            .map((row, index) => {
              // Handle amount parsing - remove $ signs, commas, and handle accounting format
              let amount = 0;
              if (row[3]) {
                let amountStr = row[3].toString().trim();

                // Handle accounting format with parentheses for negatives
                const isNegative = amountStr.includes('(') && amountStr.includes(')');

                // Remove all non-numeric characters except decimal point
                const cleanAmount = amountStr.replace(/[$,()]/g, '').trim();

                // Parse the number
                amount = parseFloat(cleanAmount) || 0;

                // Apply negative if in parentheses (accounting format)
                if (isNegative) {
                  amount = -Math.abs(amount);
                }
              }

              return {
                id: Date.now() + index, // Use timestamp to avoid ID conflicts with sample data
                accountType: row[0]?.trim() || '',
                date: row[1]?.trim() || '',
                name: row[2]?.trim() || '',
                amount: amount,
                category: row[4]?.trim() || 'Other' // Use existing category if provided
              };
            });

          // Replace sample data with uploaded data
          setTransactions(parsedTransactions);

          // Add to undo stack
          addUndoAction({
            type: 'CSV_UPLOAD',
            previousTransactions: previousTransactions,
            description: `Uploaded CSV with ${parsedTransactions.length} transactions`
          });
        },
        header: false,
        skipEmptyLines: true
      });
    }
  };

  const updateTransactionCategory = (id, category) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const originalCategory = transaction.category;

    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category } : t)
    );

    // Add to undo stack if category actually changed
    if (originalCategory !== category) {
      addUndoAction({
        type: 'CATEGORY_CHANGE',
        transactionId: id,
        originalCategory: originalCategory,
        newCategory: category,
        description: `Changed "${transaction.name}" from ${originalCategory} to ${category}`
      });
    }
  };

  // Get unique account types for filter dropdown
  const getUniqueAccounts = () => {
    const accounts = [...new Set(transactions.map(t => t.accountType).filter(Boolean))];
    return accounts.sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterAccount('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
  };

  // Bulk selection functions
  const toggleSelectTransaction = (transactionId) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAllFilteredTransactions = () => {
    const filteredTransactions = getFilteredTransactions();
    const allIds = new Set(filteredTransactions.map(t => t.id));
    setSelectedTransactions(allIds);
  };

  const clearAllSelections = () => {
    setSelectedTransactions(new Set());
  };

  // Category management functions
  const addCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName || categories.includes(trimmedName)) return;

    const newCategories = [...categories, trimmedName];
    setCategories(newCategories);

    // Add to undo stack
    addUndoAction({
      type: 'ADD_CATEGORY',
      categoryName: trimmedName,
      description: `Added category "${trimmedName}"`
    });

    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const deleteCategory = (categoryName) => {
    if (categoryName === 'Other') {
      alert('Cannot delete the "Other" category');
      return;
    }

    // Check if category is being used
    const transactionsUsingCategory = transactions.filter(t => t.category === categoryName);
    const budgetsUsingCategory = Object.values(budgets).some(monthBudgets =>
      monthBudgets && monthBudgets[categoryName] > 0
    );

    if (transactionsUsingCategory.length > 0 || budgetsUsingCategory) {
      if (!window.confirm(
        `"${categoryName}" is being used by ${transactionsUsingCategory.length} transaction(s) and/or budgets. ` +
        `These will be moved to "Other". Continue?`
      )) {
        return;
      }
    }

    // Store original state for undo
    const originalCategories = [...categories];
    const originalTransactions = [...transactions];
    const originalBudgets = JSON.parse(JSON.stringify(budgets));

    // Update transactions to use "Other" category
    setTransactions(prev =>
      prev.map(t => t.category === categoryName ? { ...t, category: 'Other' } : t)
    );

    // Move budget amounts to "Other" category
    setBudgets(prev => {
      const newBudgets = { ...prev };
      Object.keys(newBudgets).forEach(month => {
        if (newBudgets[month] && newBudgets[month][categoryName]) {
          newBudgets[month].Other = (newBudgets[month].Other || 0) + newBudgets[month][categoryName];
          delete newBudgets[month][categoryName];
        }
      });
      return newBudgets;
    });

    // Remove category
    setCategories(prev => prev.filter(cat => cat !== categoryName));

    // Add to undo stack
    addUndoAction({
      type: 'DELETE_CATEGORY',
      categoryName: categoryName,
      originalCategories: originalCategories,
      originalTransactions: originalTransactions,
      originalBudgets: originalBudgets,
      description: `Deleted category "${categoryName}"`
    });
  };

  const deleteBudgetCategory = (month, categoryName) => {
    if (!budgets[month] || !budgets[month][categoryName]) return;

    const originalBudget = budgets[month][categoryName];

    setBudgets(prev => {
      const newBudgets = { ...prev };
      if (newBudgets[month]) {
        const monthBudgets = { ...newBudgets[month] };
        delete monthBudgets[categoryName];
        newBudgets[month] = monthBudgets;
      }
      return newBudgets;
    });

    // Add to undo stack
    addUndoAction({
      type: 'DELETE_BUDGET',
      month: month,
      categoryName: categoryName,
      originalBudget: originalBudget,
      description: `Deleted ${categoryName} budget for ${month}`
    });
  };

  // Transaction editing functions
  const startEditTransaction = (transaction) => {
    setEditingTransaction(transaction.id);
    setEditForm({
      accountType: transaction.accountType,
      date: transaction.date,
      name: transaction.name,
      amount: transaction.amount.toString(),
      category: transaction.category
    });
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null);
    setEditForm({});
  };

  const saveEditTransaction = () => {
    if (!editForm.name || !editForm.amount) return;

    const originalTransaction = transactions.find(t => t.id === editingTransaction);
    if (!originalTransaction) return;

    const updatedTransaction = {
      ...originalTransaction,
      accountType: editForm.accountType || 'Checking',
      date: editForm.date,
      name: editForm.name.trim(),
      amount: parseFloat(editForm.amount),
      category: editForm.category
    };

    setTransactions(prev =>
      prev.map(t => t.id === editingTransaction ? updatedTransaction : t)
    );

    // Add to undo stack
    addUndoAction({
      type: 'EDIT_TRANSACTION',
      transactionId: editingTransaction,
      originalTransaction: originalTransaction,
      updatedTransaction: updatedTransaction,
      description: `Edited "${originalTransaction.name}"`
    });

    setEditingTransaction(null);
    setEditForm({});
  };

  const applyBulkCategory = () => {
    if (!bulkCategory || selectedTransactions.size === 0) return;

    // Store original transactions for undo
    const originalTransactions = transactions.filter(t => selectedTransactions.has(t.id));

    setTransactions(prev =>
      prev.map(t =>
        selectedTransactions.has(t.id)
          ? { ...t, category: bulkCategory }
          : t
      )
    );

    // Add to undo stack
    addUndoAction({
      type: 'BULK_CATEGORY',
      originalTransactions: originalTransactions,
      newCategory: bulkCategory,
      description: `Changed ${originalTransactions.length} transaction${originalTransactions.length !== 1 ? 's' : ''} to ${bulkCategory}`
    });

    // Clear selections and reset bulk category
    setSelectedTransactions(new Set());
    setBulkCategory('');
  };

  // Manual transaction management
  const addUndoAction = (action) => {
    setUndoStack(prev => [...prev.slice(-4), action]); // Keep last 5 actions
    setShowUndo(true);
    // Auto-hide undo notification after 10 seconds
    setTimeout(() => setShowUndo(false), 10000);
  };

  const performUndo = () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];

    switch (lastAction.type) {
      case 'DELETE_TRANSACTION':
        // Restore deleted transaction
        setTransactions(prev => {
          const newTransactions = [...prev];
          // Insert at original position if possible
          if (lastAction.originalIndex !== undefined && lastAction.originalIndex < newTransactions.length) {
            newTransactions.splice(lastAction.originalIndex, 0, lastAction.transaction);
          } else {
            // Add to beginning if original position not available
            newTransactions.unshift(lastAction.transaction);
          }
          return newTransactions;
        });
        break;

      case 'DELETE_BULK':
        // Restore all deleted transactions
        setTransactions(prev => [...lastAction.transactions, ...prev]);
        break;

      case 'ADD_TRANSACTION':
        // Remove the added transaction
        setTransactions(prev => prev.filter(t => t.id !== lastAction.transaction.id));
        break;

      case 'CATEGORY_CHANGE':
        // Restore original category
        setTransactions(prev =>
          prev.map(t =>
            t.id === lastAction.transactionId
              ? { ...t, category: lastAction.originalCategory }
              : t
          )
        );
        break;

      case 'BULK_CATEGORY':
        // Restore original categories
        setTransactions(prev =>
          prev.map(t => {
            const originalTransaction = lastAction.originalTransactions.find(orig => orig.id === t.id);
            return originalTransaction ? { ...t, category: originalTransaction.category } : t;
          })
        );
        break;

      case 'CSV_UPLOAD':
        // Restore previous transactions
        setTransactions(lastAction.previousTransactions);
        break;

      case 'ADD_CATEGORY':
        // Remove the added category
        setCategories(prev => prev.filter(cat => cat !== lastAction.categoryName));
        break;

      case 'DELETE_CATEGORY':
        // Restore original state
        setCategories(lastAction.originalCategories);
        setTransactions(lastAction.originalTransactions);
        setBudgets(lastAction.originalBudgets);
        break;

      case 'DELETE_BUDGET':
        // Restore the budget
        setBudgets(prev => ({
          ...prev,
          [lastAction.month]: {
            ...prev[lastAction.month],
            [lastAction.categoryName]: lastAction.originalBudget
          }
        }));
        break;

      case 'EDIT_TRANSACTION':
        // Restore original transaction
        setTransactions(prev =>
          prev.map(t =>
            t.id === lastAction.transactionId
              ? lastAction.originalTransaction
              : t
          )
        );
        break;

      case 'ROLLOVER_TOGGLE':
        // Reverse the rollover action
        if (lastAction.wasEnabled) {
          // Was enabled, so we need to re-add the rollover
          setBudgets(prev => ({
            ...prev,
            [lastAction.nextMonth]: {
              ...prev[lastAction.nextMonth],
              [lastAction.category]: (prev[lastAction.nextMonth]?.[lastAction.category] || 0) + lastAction.rolloverAmount
            }
          }));
          setRolloverEnabled(prev => ({
            ...prev,
            [`${lastAction.month}-${lastAction.category}`]: true
          }));
        } else {
          // Was disabled, so we need to remove the rollover
          setBudgets(prev => {
            const newBudgets = { ...prev };
            if (newBudgets[lastAction.nextMonth] && newBudgets[lastAction.nextMonth][lastAction.category]) {
              const newAmount = Math.max(0, newBudgets[lastAction.nextMonth][lastAction.category] - lastAction.rolloverAmount);
              if (newAmount === 0) {
                const { [lastAction.category]: removed, ...rest } = newBudgets[lastAction.nextMonth];
                newBudgets[lastAction.nextMonth] = rest;
              } else {
                newBudgets[lastAction.nextMonth] = {
                  ...newBudgets[lastAction.nextMonth],
                  [lastAction.category]: newAmount
                };
              }
            }
            return newBudgets;
          });
          setRolloverEnabled(prev => ({
            ...prev,
            [`${lastAction.month}-${lastAction.category}`]: false
          }));
        }
        break;

      default:
        break;
    }

    // Remove the undone action from stack
    setUndoStack(prev => prev.slice(0, -1));
    setShowUndo(false);
  };

  const addTransaction = () => {
    if (!newTransaction.name || !newTransaction.amount) return;

    const transaction = {
      id: Date.now(),
      accountType: newTransaction.accountType || 'Checking',
      date: newTransaction.date,
      name: newTransaction.name.trim(),
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category
    };

    setTransactions(prev => [transaction, ...prev]);

    // Add to undo stack
    addUndoAction({
      type: 'ADD_TRANSACTION',
      transaction: transaction,
      description: `Added "${transaction.name}"`
    });

    // Reset form
    setNewTransaction({
      accountType: '',
      date: new Date().toISOString().split('T')[0],
      name: '',
      amount: '',
      category: 'Other'
    });
    setShowAddTransaction(false);
  };

  const deleteTransaction = (id) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;

    const originalIndex = transactions.findIndex(t => t.id === id);

    setTransactions(prev => prev.filter(t => t.id !== id));

    // Add to undo stack
    addUndoAction({
      type: 'DELETE_TRANSACTION',
      transaction: transactionToDelete,
      originalIndex: originalIndex,
      description: `Deleted "${transactionToDelete.name}"`
    });

    // Remove from selected if it was selected
    setSelectedTransactions(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(id);
      return newSelected;
    });
  };

  const deleteBulkTransactions = () => {
    if (selectedTransactions.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTransactions.size} transaction${selectedTransactions.size !== 1 ? 's' : ''}?`)) return;

    const transactionsToDelete = transactions.filter(t => selectedTransactions.has(t.id));

    setTransactions(prev => prev.filter(t => !selectedTransactions.has(t.id)));

    // Add to undo stack
    addUndoAction({
      type: 'DELETE_BULK',
      transactions: transactionsToDelete,
      description: `Deleted ${transactionsToDelete.length} transaction${transactionsToDelete.length !== 1 ? 's' : ''}`
    });

    setSelectedTransactions(new Set());
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Search term filter (searches transaction name/description)
      const matchesSearch = searchTerm === '' ||
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = filterCategory === 'All' ||
        transaction.category === filterCategory;

      // Account filter
      const matchesAccount = filterAccount === 'All' ||
        transaction.accountType === filterAccount;

      // Date range filter
      let matchesDateRange = true;
      if (filterDateFrom || filterDateTo) {
        try {
          const transDate = new Date(transaction.date);
          if (filterDateFrom) {
            const fromDate = new Date(filterDateFrom);
            if (transDate < fromDate) matchesDateRange = false;
          }
          if (filterDateTo) {
            const toDate = new Date(filterDateTo);
            if (transDate > toDate) matchesDateRange = false;
          }
        } catch (e) {
          matchesDateRange = false;
        }
      }

      // Amount range filter
      let matchesAmountRange = true;
      const absAmount = Math.abs(transaction.amount);
      if (filterAmountMin !== '' && absAmount < parseFloat(filterAmountMin)) {
        matchesAmountRange = false;
      }
      if (filterAmountMax !== '' && absAmount > parseFloat(filterAmountMax)) {
        matchesAmountRange = false;
      }

      return matchesSearch && matchesCategory && matchesAccount &&
             matchesDateRange && matchesAmountRange;
    });
  };

  const updateBudget = (category, amount) => {
    setBudgets(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        [category]: parseFloat(amount) || 0
      }
    }));
  };

  // Set some default budgets to work with sample data - randomized amounts
  useEffect(() => {
    if (Object.keys(budgets).length === 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      // Create a previous month key
      const prevDate = new Date(currentYear, currentMonth - 2, 1);
      const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      // Helper function to generate random budget amounts
      const randomBudget = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

      setBudgets({
        [currentMonthKey]: {
          'Food': randomBudget(400, 600),
          'Entertainment': randomBudget(150, 300),
          'Transportation': randomBudget(200, 350),
          'Shopping': randomBudget(250, 450),
          'Utilities': randomBudget(200, 350),
          'Healthcare': randomBudget(100, 250),
          'Mortgage': randomBudget(1500, 2000)
        },
        [prevMonthKey]: {
          'Food': randomBudget(400, 600),
          'Entertainment': randomBudget(150, 300),
          'Transportation': randomBudget(200, 350),
          'Shopping': randomBudget(250, 450),
          'Utilities': randomBudget(200, 350),
          'Healthcare': randomBudget(100, 250),
          'Mortgage': randomBudget(1500, 2000)
        }
      });
    }
  }, [budgets]);

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Auto-copy budgets from previous month when switching to new month
  const autoFillBudgetsFromPreviousMonth = (targetMonth) => {
    // Calculate previous month
    const [year, month] = targetMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month - 2 because months are 0-indexed
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Check if target month already has budgets set
    if (budgets[targetMonth] && Object.keys(budgets[targetMonth]).length > 0) {
      return; // Don't override existing budgets
    }

    // Check if previous month has budgets
    if (budgets[prevMonth] && Object.keys(budgets[prevMonth]).length > 0) {
      const prevBudgets = { ...budgets[prevMonth] };

      // Apply rollover if enabled for any categories
      categories.forEach(category => {
        if (rolloverEnabled[`${prevMonth}-${category}`]) {
          const status = getBudgetStatus(category, prevMonth);
          if (status.remaining > 0) {
            // Add unused budget to the copied amount
            prevBudgets[category] = (prevBudgets[category] || 0) + status.remaining;
          }
        }
      });

      setBudgets(prev => ({
        ...prev,
        [targetMonth]: prevBudgets
      }));
    }
  };

  // Toggle rollover for specific category and month
  const toggleRollover = (month, category) => {
    const key = `${month}-${category}`;
    const willBeEnabled = !rolloverEnabled[key];

    setRolloverEnabled(prev => ({
      ...prev,
      [key]: willBeEnabled
    }));

    // Immediately apply or remove rollover to next month
    const [year, monthNum] = month.split('-').map(Number);
    const nextDate = new Date(year, monthNum, 1); // monthNum is already 1-based, so this gives us next month
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    const status = getBudgetStatus(category, month);
    const rolloverAmount = status.remaining > 0 ? status.remaining : 0;

    if (willBeEnabled && rolloverAmount > 0) {
      // Add rollover to next month's budget
      setBudgets(prev => ({
        ...prev,
        [nextMonth]: {
          ...prev[nextMonth],
          [category]: (prev[nextMonth]?.[category] || 0) + rolloverAmount
        }
      }));

      // Add to undo stack
      addUndoAction({
        type: 'ROLLOVER_TOGGLE',
        month: month,
        nextMonth: nextMonth,
        category: category,
        rolloverAmount: rolloverAmount,
        wasEnabled: false,
        description: `Added ${rolloverAmount.toFixed(2)} rollover from ${category} (${month}) to next month`
      });
    } else if (!willBeEnabled && rolloverAmount > 0) {
      // Remove rollover from next month's budget
      setBudgets(prev => {
        const newBudgets = { ...prev };
        if (newBudgets[nextMonth] && newBudgets[nextMonth][category]) {
          const newAmount = Math.max(0, newBudgets[nextMonth][category] - rolloverAmount);
          if (newAmount === 0) {
            const { [category]: removed, ...rest } = newBudgets[nextMonth];
            newBudgets[nextMonth] = rest;
          } else {
            newBudgets[nextMonth] = {
              ...newBudgets[nextMonth],
              [category]: newAmount
            };
          }
        }
        return newBudgets;
      });

      // Add to undo stack
      addUndoAction({
        type: 'ROLLOVER_TOGGLE',
        month: month,
        nextMonth: nextMonth,
        category: category,
        rolloverAmount: rolloverAmount,
        wasEnabled: true,
        description: `Removed ${rolloverAmount.toFixed(2)} rollover from ${category} (${month})`
      });
    }
  };

  // Effect to auto-fill budgets when month changes
  useEffect(() => {
    autoFillBudgetsFromPreviousMonth(selectedMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Manual copy from previous month
  const copyFromPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    if (budgets[prevMonth]) {
      setBudgets(prev => ({
        ...prev,
        [selectedMonth]: { ...budgets[prevMonth] }
      }));
    }
  };

  const getTransactionsByMonth = (month) => {
    return transactions.filter(t => {
      try {
        // Try to parse the date in various formats
        let transactionDate;

        // Handle different date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
        if (t.date.includes('/')) {
          const parts = t.date.split('/');
          if (parts.length === 3) {
            // Assume MM/DD/YYYY format (most common in US)
            transactionDate = new Date(parts[2], parts[0] - 1, parts[1]);
          }
        } else if (t.date.includes('-')) {
          transactionDate = new Date(t.date);
        } else {
          transactionDate = new Date(t.date);
        }

        // Check if date is valid
        if (isNaN(transactionDate.getTime())) {
          console.warn('Invalid date format:', t.date);
          return false;
        }

        const monthYear = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        return monthYear === month;
      } catch (error) {
        console.warn('Error parsing date:', t.date, error);
        return false;
      }
    });
  };

  const getCategorySpending = (month) => {
    const monthTransactions = getTransactionsByMonth(month);
    const spending = {};

    categories.forEach(category => {
      // Get all transactions for this category (both positive and negative)
      const categoryTransactions = monthTransactions.filter(t => t.category === category);

      // Calculate spending (sum of negative amounts, converted to positive)
      const totalSpending = categoryTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      spending[category] = totalSpending;
    });

    return spending;
  };

  const generateChartData = () => {
    const chartData = [];

    // Determine date range
    let startDate, endDate;
    if (analyticsDateFrom && analyticsDateTo) {
      startDate = new Date(analyticsDateFrom);
      endDate = new Date(analyticsDateTo);
    } else {
      // Default: last 6 months
      endDate = new Date();
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
    }

    // Calculate starting balance from all transactions before start date
    const initialBalance = transactions
      .filter(t => {
        try {
          const transDate = new Date(t.date);
          return transDate < startDate;
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, t) => sum + t.amount, 0);

    let runningBalance = initialBalance;
    let predictedBalance = initialBalance;

    // Generate data based on view type
    if (analyticsViewType === 'monthly') {
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

      while (current <= endDate) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const monthName = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Calculate actual spending/income for this month
        let monthTransactions = getTransactionsByMonth(monthKey);

        // Apply category filter if not 'All'
        if (analyticsCategoryFilter !== 'All') {
          monthTransactions = monthTransactions.filter(t => t.category === analyticsCategoryFilter);
        }

        const monthTotal = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        runningBalance += monthTotal;

        // Calculate predicted spending/income based on budgets
        const monthBudgets = budgets[monthKey] || {};

        // Filter budgets by category if not 'All'
        let budgetTotal;
        if (analyticsCategoryFilter !== 'All') {
          budgetTotal = -(monthBudgets[analyticsCategoryFilter] || 0); // Negative because budgets are expenses
        } else {
          budgetTotal = Object.values(monthBudgets).reduce((sum, amount) => sum - amount, 0); // Negative because budgets are expenses
        }

        // Add estimated income (assume same as previous month's income or average income)
        const incomeTransactions = monthTransactions.filter(t => t.category === 'Income');
        const monthIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

        // For predicted: use actual income if available, otherwise estimate from historical average
        let predictedIncome = 0;
        if (monthIncome > 0) {
          predictedIncome = monthIncome;
        } else {
          // Estimate income from historical average
          const allIncomeTransactions = transactions.filter(t => t.category === 'Income');
          const avgMonthlyIncome = allIncomeTransactions.length > 0
            ? allIncomeTransactions.reduce((sum, t) => sum + t.amount, 0) / 6 // Average over 6 months
            : 0;
          predictedIncome = avgMonthlyIncome;
        }

        predictedBalance += predictedIncome + budgetTotal;

        chartData.push({
          period: monthName,
          predicted: Math.round(predictedBalance * 100) / 100,
          actual: Math.round(runningBalance * 100) / 100
        });

        current.setMonth(current.getMonth() + 1);
      }
    } else if (analyticsViewType === 'weekly') {
      // Weekly view
      const current = new Date(startDate);
      current.setDate(current.getDate() - current.getDay()); // Start from Sunday

      while (current <= endDate) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekLabel = `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        // Calculate actual balance change for this week
        let weekTransactions = transactions.filter(t => {
          try {
            const transDate = new Date(t.date);
            return transDate >= current && transDate <= weekEnd;
          } catch (e) {
            return false;
          }
        });

        // Apply category filter if not 'All'
        if (analyticsCategoryFilter !== 'All') {
          weekTransactions = weekTransactions.filter(t => t.category === analyticsCategoryFilter);
        }

        const weekTotal = weekTransactions.reduce((sum, t) => sum + t.amount, 0);
        runningBalance += weekTotal;

        // For weekly predicted: estimate based on daily budget average
        const daysInWeek = 7;
        const currentMonthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const monthBudgets = budgets[currentMonthKey] || {};

        // Filter budgets by category if not 'All'
        let totalMonthlyBudget;
        if (analyticsCategoryFilter !== 'All') {
          totalMonthlyBudget = monthBudgets[analyticsCategoryFilter] || 0;
        } else {
          totalMonthlyBudget = Object.values(monthBudgets).reduce((sum, amount) => sum + amount, 0);
        }

        const estimatedWeeklySpending = -(totalMonthlyBudget / 30) * daysInWeek; // Negative for expenses

        // Estimate weekly income
        const avgWeeklyIncome = transactions
          .filter(t => t.category === 'Income')
          .reduce((sum, t) => sum + t.amount, 0) / 26; // Approximate weeks in 6 months

        predictedBalance += avgWeeklyIncome + estimatedWeeklySpending;

        chartData.push({
          period: weekLabel,
          predicted: Math.round(predictedBalance * 100) / 100,
          actual: Math.round(runningBalance * 100) / 100
        });

        current.setDate(current.getDate() + 7);
      }
    } else if (analyticsViewType === 'daily') {
      // Daily view
      const current = new Date(startDate);

      while (current <= endDate) {
        const dayLabel = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Calculate actual balance change for this day
        let dayTransactions = transactions.filter(t => {
          try {
            const transDate = new Date(t.date);
            return transDate.toDateString() === current.toDateString();
          } catch (e) {
            return false;
          }
        });

        // Apply category filter if not 'All'
        if (analyticsCategoryFilter !== 'All') {
          dayTransactions = dayTransactions.filter(t => t.category === analyticsCategoryFilter);
        }

        const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        runningBalance += dayTotal;

        // For daily predicted: estimate based on daily budget average
        const currentMonthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const monthBudgets = budgets[currentMonthKey] || {};

        // Filter budgets by category if not 'All'
        let totalMonthlyBudget;
        if (analyticsCategoryFilter !== 'All') {
          totalMonthlyBudget = monthBudgets[analyticsCategoryFilter] || 0;
        } else {
          totalMonthlyBudget = Object.values(monthBudgets).reduce((sum, amount) => sum + amount, 0);
        }

        const estimatedDailySpending = -(totalMonthlyBudget / 30); // Negative for expenses

        // Estimate daily income
        const avgDailyIncome = transactions
          .filter(t => t.category === 'Income')
          .reduce((sum, t) => sum + t.amount, 0) / 180; // Approximate days in 6 months

        predictedBalance += avgDailyIncome + estimatedDailySpending;

        chartData.push({
          period: dayLabel,
          predicted: Math.round(predictedBalance * 100) / 100,
          actual: Math.round(runningBalance * 100) / 100
        });

        current.setDate(current.getDate() + 1);
      }
    }

    return chartData;
  };

  // Set quick date ranges
  const setQuickDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case 'last7days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = today;
        setAnalyticsViewType('daily');
        break;
      case 'last30days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = today;
        setAnalyticsViewType('daily');
        break;
      case 'last3months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        endDate = today;
        setAnalyticsViewType('monthly');
        break;
      case 'last6months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        endDate = today;
        setAnalyticsViewType('monthly');
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = today;
        setAnalyticsViewType('monthly');
        break;
      case 'lastYear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        setAnalyticsViewType('monthly');
        break;
      default:
        return;
    }

    setAnalyticsDateFrom(startDate.toISOString().split('T')[0]);
    setAnalyticsDateTo(endDate.toISOString().split('T')[0]);
  };

  const getBudgetStatus = (category, month) => {
    const spending = getCategorySpending(month);
    const spent = spending[category] || 0;
    const budget = budgets[month]?.[category] || 0; // Get budget for specific month
    const remaining = budget - spent;

    return {
      spent,
      budget,
      remaining,
      isOverBudget: remaining < 0,
      percentUsed: budget > 0 ? (spent / budget) * 100 : 0
    };
  };

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    // Check credentials
    if (username === 'etuckett' && password === 'ubfaKi3v') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      setUsername('');
      setPassword('');
    } else {
      setLoginError('Invalid username or password');
      setPassword('');
    }
  };

  // If not authenticated, show lock screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Finance Tracker</h1>
            <p className="text-gray-600">Sign in to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Protected Financial Dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Undo Notification */}
        {showUndo && undoStack.length > 0 && (
          <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Undo className="w-4 h-4" />
                <span className="text-sm">{undoStack[undoStack.length - 1]?.description}</span>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={performUndo}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Undo
                </button>
                <button
                  onClick={() => setShowUndo(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              Personal Finance Tracker
            </h1>
            <p className="mt-2 opacity-90">Track expenses, set budgets, and visualize your spending patterns</p>
          </div>

          {/* Sample Data Disclaimer */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong className="font-semibold">Demo Version - Sample Data Only:</strong> This application is pre-populated with sample/demo transactions for demonstration purposes. Do not enter any real personal or financial information. All data shown is fictional and for testing purposes only.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-gray-50 border-b">
            <nav className="flex">
              {[
                { id: 'transactions', label: 'Transactions', icon: Upload },
                { id: 'budgets', label: 'Budgets', icon: Calendar },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === id
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Transaction CSV</h3>
                  <p className="text-gray-600 mb-4">
                    Upload a CSV with columns: Account, Date, Description, Amount, Category<br/>
                    <span className="text-sm text-gray-500">Or explore the app with sample data below</span>
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {transactions.length > 0 && (
                  <>
                    {/* Add Transaction Form */}
                    {showAddTransaction && (
                      <div className="bg-white border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Transaction
                          </h3>
                          <button
                            onClick={() => setShowAddTransaction(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Account
                            </label>
                            <select
                              value={newTransaction.accountType}
                              onChange={(e) => setNewTransaction(prev => ({ ...prev, accountType: e.target.value }))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Account</option>
                              {getUniqueAccounts().concat(['Checking', 'Savings', 'Credit Card']).filter((v, i, a) => a.indexOf(v) === i).map(account => (
                                <option key={account} value={account}>{account}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={newTransaction.date}
                              onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              placeholder="Transaction description"
                              value={newTransaction.name}
                              onChange={(e) => setNewTransaction(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newTransaction.amount}
                              onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Use negative for expenses</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <select
                              value={newTransaction.category}
                              onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-4">
                          <button
                            onClick={() => setShowAddTransaction(false)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={addTransaction}
                            disabled={!newTransaction.name || !newTransaction.amount}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <Save className="w-4 h-4" />
                            Add Transaction
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Search and Filter Section */}
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Filter className="w-5 h-5" />
                          Search & Filter Transactions
                        </h3>
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border rounded-md hover:bg-gray-50"
                        >
                          <X className="w-4 h-4" />
                          Clear All
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search Box */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Description
                          </label>
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search transactions..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="All">All Categories</option>
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>

                        {/* Account Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account
                          </label>
                          <select
                            value={filterAccount}
                            onChange={(e) => setFilterAccount(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="All">All Accounts</option>
                            {getUniqueAccounts().map(account => (
                              <option key={account} value={account}>{account}</option>
                            ))}
                          </select>
                        </div>

                        {/* Amount Range */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount Range
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filterAmountMin}
                              onChange={(e) => setFilterAmountMin(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={filterAmountMax}
                              onChange={(e) => setFilterAmountMax(e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Date Range Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                          </label>
                          <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                          </label>
                          <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bulk Operations Section */}
                    {selectedTransactions.size > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-blue-900">
                              {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-blue-900">
                                Assign Category:
                              </label>
                              <select
                                value={bulkCategory}
                                onChange={(e) => setBulkCategory(e.target.value)}
                                className="border border-blue-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="">Select category...</option>
                                {categories.map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                              <button
                                onClick={applyBulkCategory}
                                disabled={!bulkCategory}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <Check className="w-4 h-4" />
                                Apply
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={deleteBulkTransactions}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-red-700 hover:text-red-900 border border-red-300 rounded-md hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Selected
                            </button>
                            <button
                              onClick={clearAllSelections}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-700 hover:text-blue-900 border border-blue-300 rounded-md hover:bg-blue-100"
                            >
                              <X className="w-4 h-4" />
                              Clear Selection
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Transactions ({getFilteredTransactions().length} of {transactions.length})
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowAddTransaction(!showAddTransaction)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <Plus className="w-4 h-4" />
                            Add Transaction
                          </button>
                          <button
                            onClick={selectAllFilteredTransactions}
                            className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <CheckSquare className="w-4 h-4" />
                            Select All
                          </button>
                          {selectedTransactions.size > 0 && (
                            <button
                              onClick={clearAllSelections}
                              className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <Square className="w-4 h-4" />
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                <input
                                  type="checkbox"
                                  checked={getFilteredTransactions().length > 0 && getFilteredTransactions().every(t => selectedTransactions.has(t.id))}
                                  onChange={() => {
                                    const filteredTransactions = getFilteredTransactions();
                                    const allSelected = filteredTransactions.every(t => selectedTransactions.has(t.id));
                                    if (allSelected) {
                                      const newSelected = new Set(selectedTransactions);
                                      filteredTransactions.forEach(t => newSelected.delete(t.id));
                                      setSelectedTransactions(newSelected);
                                    } else {
                                      selectAllFilteredTransactions();
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Account
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getFilteredTransactions().slice(0, 50).map(transaction => (
                              <tr
                                key={transaction.id}
                                className={`hover:bg-gray-50 ${selectedTransactions.has(transaction.id) ? 'bg-blue-50' : ''} ${editingTransaction === transaction.id ? 'bg-yellow-50' : ''}`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedTransactions.has(transaction.id)}
                                    onChange={() => toggleSelectTransaction(transaction.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>

                                {editingTransaction === transaction.id ? (
                                  // Edit mode - show input fields
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <select
                                        value={editForm.accountType}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, accountType: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        {getUniqueAccounts().concat(['Checking', 'Savings', 'Credit Card']).filter((v, i, a) => a.indexOf(v) === i).map(account => (
                                          <option key={account} value={account}>{account}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <input
                                        type="date"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                      <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.amount}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <select
                                        value={editForm.category}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        {categories.map(category => (
                                          <option key={category} value={category}>{category}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={saveEditTransaction}
                                          disabled={!editForm.name || !editForm.amount}
                                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:text-gray-400"
                                          title="Save changes"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={cancelEditTransaction}
                                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                          title="Cancel editing"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  // View mode - show data
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {transaction.accountType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {transaction.date}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {transaction.name}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                      transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      ${Math.abs(transaction.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      <select
                                        value={transaction.category}
                                        onChange={(e) => updateTransactionCategory(transaction.id, e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        {categories.map(category => (
                                          <option key={category} value={category}>{category}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => startEditTransaction(transaction)}
                                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                          title="Edit transaction"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => deleteTransaction(transaction.id)}
                                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                          title="Delete transaction"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {getFilteredTransactions().length > 50 && (
                        <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600">
                          Showing first 50 of {getFilteredTransactions().length} filtered transactions
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Budgets Tab */}
            {activeTab === 'budgets' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Monthly Budgets</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={copyFromPreviousMonth}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Calendar className="w-4 h-4" />
                      Copy From Previous Month
                    </button>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {generateMonthOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Category Management Section */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Edit3 className="w-5 h-5" />
                      Manage Categories
                    </h3>
                    <button
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <Plus className="w-4 h-4" />
                      Add Category
                    </button>
                  </div>

                  {showAddCategory && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                          className="flex-1 border border-green-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={addCategory}
                          disabled={!newCategoryName.trim() || categories.includes(newCategoryName.trim())}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddCategory(false);
                            setNewCategoryName('');
                          }}
                          className="px-4 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <div key={category} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        <span>{category}</span>
                        {category !== 'Other' && (
                          <button
                            onClick={() => deleteCategory(category)}
                            className="text-red-500 hover:text-red-700 ml-1"
                            title={`Delete ${category} category`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map(category => {
                    const status = getBudgetStatus(category, selectedMonth);
                    const rolloverKey = `${selectedMonth}-${category}`;
                    const hasBudget = budgets[selectedMonth]?.[category] > 0;
                    return (
                      <div key={category} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">{category}</h3>
                          <div className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-gray-400" />
                            {hasBudget && (
                              <button
                                onClick={() => deleteBudgetCategory(selectedMonth, category)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title={`Delete ${category} budget`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Monthly Budget
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={budgets[selectedMonth]?.[category] || ''}
                              onChange={(e) => updateBudget(category, e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {status.budget > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Spent:</span>
                                <span className="font-medium">${status.spent.toFixed(2)}</span>
                              </div>

                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Remaining:</span>
                                <span className={`font-medium ${
                                  status.isOverBudget ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  ${status.remaining.toFixed(2)}
                                </span>
                              </div>

                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    status.isOverBudget ? 'bg-red-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(status.percentUsed, 100)}%` }}
                                />
                              </div>

                              <div className="flex items-center gap-1 text-sm">
                                {status.isOverBudget ? (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                ) : (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                )}
                                <span className={status.isOverBudget ? 'text-red-600' : 'text-green-600'}>
                                  {status.percentUsed.toFixed(1)}% used
                                </span>
                              </div>

                              {/* Rollover Option */}
                              {status.remaining > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={rolloverEnabled[rolloverKey] || false}
                                      onChange={() => toggleRollover(selectedMonth, category)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">
                                      Rollover ${status.remaining.toFixed(2)} to next month
                                    </span>
                                  </label>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Spending Analytics</h2>
                </div>

                {/* Date Range Controls */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Period Controls</h3>

                  {/* Quick Date Range Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setQuickDateRange('last7days')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => setQuickDateRange('last30days')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => setQuickDateRange('last3months')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Last 3 Months
                    </button>
                    <button
                      onClick={() => setQuickDateRange('last6months')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Last 6 Months
                    </button>
                    <button
                      onClick={() => setQuickDateRange('thisYear')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      This Year
                    </button>
                    <button
                      onClick={() => setQuickDateRange('lastYear')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Last Year
                    </button>
                  </div>

                  {/* Custom Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={analyticsDateFrom}
                        onChange={(e) => setAnalyticsDateFrom(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={analyticsDateTo}
                        onChange={(e) => setAnalyticsDateTo(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        View Type
                      </label>
                      <select
                        value={analyticsViewType}
                        onChange={(e) => setAnalyticsViewType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Filter
                      </label>
                      <select
                        value={analyticsCategoryFilter}
                        onChange={(e) => setAnalyticsCategoryFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Categories</option>
                        {categories.filter(cat => cat !== 'Income').map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setAnalyticsDateFrom('');
                          setAnalyticsDateTo('');
                          setAnalyticsViewType('monthly');
                          setAnalyticsCategoryFilter('All');
                        }}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Predicted vs Actual Spending
                    {analyticsCategoryFilter !== 'All' && (
                      <span className="text-sm font-normal text-blue-600 ml-2">
                        ({analyticsCategoryFilter} only)
                      </span>
                    )}
                    {analyticsDateFrom && analyticsDateTo && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({new Date(analyticsDateFrom).toLocaleDateString()} - {new Date(analyticsDateTo).toLocaleDateString()})
                      </span>
                    )}
                  </h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="period"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toFixed(2)}`, '']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          name="Predicted Spending"
                          strokeDasharray="5 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="#EF4444"
                          strokeWidth={3}
                          name="Actual Spending"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Budget</p>
                        <p className="text-2xl font-bold">
                          ${budgets[selectedMonth] ? Object.values(budgets[selectedMonth]).reduce((sum, amount) => sum + amount, 0).toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">This Month Spent</p>
                        <p className="text-2xl font-bold">
                          ${Object.values(getCategorySpending(selectedMonth)).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-green-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Transactions</p>
                        <p className="text-2xl font-bold">{transactions.length}</p>
                      </div>
                      <Upload className="w-8 h-8 text-purple-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalFinanceApp;
