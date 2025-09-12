#!/bin/bash
# Export current transactions to CSV

echo "📊 Exporting current transactions to CSV..."

/opt/homebrew/opt/postgresql@15/bin/psql transactions -c "
COPY (
  SELECT id, date, amount, description, category, account, transaction_type, created_at 
  FROM transactions 
  ORDER BY date DESC
) TO STDOUT WITH CSV HEADER;" > transactions_latest.csv

echo "✅ Exported to: transactions_latest.csv"
echo "📄 Rows: $(tail -n +2 transactions_latest.csv | wc -l | xargs)"
echo "💡 Open with: open transactions_latest.csv"