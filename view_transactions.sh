#!/bin/bash
# Quick script to view your transactions

echo "=== YOUR TRANSACTION DATA ==="
echo ""

# Show summary
echo "📊 SUMMARY:"
/opt/homebrew/opt/postgresql@15/bin/psql transactions -t -c "
SELECT 
  COUNT(*) || ' total transactions' as count,
  '$' || ROUND(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 2) || ' total income' as income,
  '$' || ROUND(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 2) || ' total expenses' as expenses
FROM transactions;
"

echo ""
echo "📋 RECENT TRANSACTIONS:"
/opt/homebrew/opt/postgresql@15/bin/psql transactions -c "
SELECT 
  TO_CHAR(date, 'Mon DD') as date,
  CASE WHEN amount > 0 THEN '+$' || amount ELSE '-$' || ABS(amount) END as amount,
  description,
  category 
FROM transactions 
ORDER BY date DESC 
LIMIT 10;
"

echo ""
echo "💡 Run 'curl http://localhost:3001/api/transactions' for JSON format"
echo "💡 Open http://localhost:3000 for web interface"