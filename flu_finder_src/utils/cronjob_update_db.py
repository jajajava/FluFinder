#!/usr/bin/env python
import sys
from db_methods import update_db

# This script is used to update the database on a cron job
# It is called by the cron job every day at 5:00 PM (Set up in Render)
# It updates the Google Sheet with the latest data from the CDC

if __name__ == "__main__":
    print("Starting database update...")
    try:
        update_db()
        print("Database update completed successfully.")
    except Exception as e:
        print(f"ERROR: Failed to update database: {str(e)}", file=sys.stderr)
        sys.exit(1)
