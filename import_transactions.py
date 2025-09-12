#!/usr/bin/env python3
"""
Script to import transactions from CSV files into PostgreSQL database.
"""

import csv
import psycopg2
from datetime import datetime
import sys
import argparse

def connect_db():
    """Connect to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="transactions",
            user="enriquetuckett",  # Replace with your username
            password=""  # No password for local setup
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def import_csv(csv_file, conn):
    """Import transactions from CSV file."""
    cursor = conn.cursor()
    
    with open(csv_file, 'r') as file:
        csv_reader = csv.DictReader(file)
        
        for row in csv_reader:
            # Parse date (adjust format as needed)
            try:
                date = datetime.strptime(row['Date'], '%Y-%m-%d').date()
            except ValueError:
                try:
                    date = datetime.strptime(row['Date'], '%m/%d/%Y').date()
                except ValueError:
                    print(f"Skipping row with invalid date: {row['Date']}")
                    continue
            
            # Determine transaction type based on amount
            amount = float(row['Amount'])
            transaction_type = 'expense' if amount < 0 else 'income'
            
            # Insert transaction - only using Date, Description, and Amount
            # Setting default values for category and account
            cursor.execute("""
                INSERT INTO transactions (date, amount, description, category, account, transaction_type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                date,
                amount,
                row.get('Description', ''),
                'Other',  # Default category since we're not using the CSV category
                'Imported',  # Default account for imported transactions
                transaction_type
            ))
    
    conn.commit()
    cursor.close()
    print(f"Successfully imported transactions from {csv_file}")

def create_sample_csv():
    """Create a sample CSV file for testing."""
    sample_data = [
        {
            'Date': '2025-01-20',
            'Description': 'Restaurant dinner',
            'Original Description': 'MCDONALD\'S #12345 MAIN ST',
            'Category': 'Food & Dining',
            'Amount': '-75.23',
            'Status': 'Posted'
        },
        {
            'Date': '2025-01-19',
            'Description': 'Salary deposit',
            'Original Description': 'PAYROLL DEPOSIT COMPANY ABC',
            'Category': 'Income',
            'Amount': '3000.00',
            'Status': 'Posted'
        },
        {
            'Date': '2025-01-18',
            'Description': 'Internet bill',
            'Original Description': 'INTERNET SERVICES BILL PAYMENT',
            'Category': 'Utilities',
            'Amount': '-45.00',
            'Status': 'Posted'
        }
    ]
    
    with open('sample_transactions.csv', 'w', newline='') as file:
        fieldnames = ['Date', 'Description', 'Original Description', 'Category', 'Amount', 'Status']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sample_data)
    
    print("Created sample_transactions.csv with new format: Date, Description, Original Description, Category, Amount, Status")

def main():
    parser = argparse.ArgumentParser(description='Import transactions from CSV to PostgreSQL')
    parser.add_argument('--csv', help='CSV file to import')
    parser.add_argument('--sample', action='store_true', help='Create sample CSV file')
    
    args = parser.parse_args()
    
    if args.sample:
        create_sample_csv()
        return
    
    if not args.csv:
        print("Please specify --csv filename or --sample to create sample file")
        return
    
    conn = connect_db()
    try:
        import_csv(args.csv, conn)
    finally:
        conn.close()

if __name__ == "__main__":
    main()