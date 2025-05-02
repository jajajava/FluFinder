import gspread
import os
import json
import base64
from google.oauth2.service_account import Credentials
from data_fetcher import get_sorted_dataframe_from_link
from pathlib import Path
import pandas as pd


# Define scopes
SCOPES = ["https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive"]

# Resolve the path to this directory
THIS_DIR = Path(__file__).resolve().parent

# Load credentials from file if it exists, otherwise from environment variable
cred_path = THIS_DIR / "google_backend.json"

if cred_path.exists():
  creds = Credentials.from_service_account_file(
    THIS_DIR / "google_backend.json", scopes=SCOPES
)
else:
    b64_creds = os.getenv("GOOGLE_CREDS_B64")
    if not b64_creds:
        raise RuntimeError("GOOGLE_CREDS_B64 environment variable not set and local credentials file not found.")

    creds_json = base64.b64decode(b64_creds).decode("utf-8")
    creds_info = json.loads(creds_json)
    creds = Credentials.from_service_account_info(creds_info, scopes=SCOPES)

# Authorize gspread with the credentials
client = gspread.authorize(creds)

SHEET_ID_DATA = os.getenv("SHEET_ID_DATA")

# --- data ---
# Open the spreadsheet by name or URL
sheet1 = client.open_by_key(SHEET_ID_DATA).worksheet("Sheet1")


#! To automate, make this a daily cron job
def update_db():
    # Pull data from CDC
    df = get_sorted_dataframe_from_link("https://www.cdc.gov/bird-flu/modules/situation-summary/commercial-backyard-flocks.csv")
    # Convert to list of lists
    data = [df.columns.tolist()] + df.values.tolist()
    # Write data
    sheet1.update(values=data, range_name='A1')
    

def get_db():
    df = pd.DataFrame(sheet1.get_all_records())
    df.index.name = "Index"
    return df


# This method will likely not be necessary once cronjob automates updates
# def get_updated_db():
#     update_db()
#     df = get_db()
#     return df


# --- users ---
# Open the spreadsheet by name or URL
# sheet2 = client.open("users").sheet1

# # # Read data
# users = sheet2.get_all_records()
# print(users)

# # Write data
# sheet2.update('A2', 'Updated value')

if __name__ == "__main__":
    update_db()