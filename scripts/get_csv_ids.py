import csv
import json

csv_path = 'src/assets/All Leads Master Sheet (1).csv'

try:
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        # Filter for rows that actually have an Entry ID to avoid empty rows at end of file
        csv_ids = [row.get('Entry ID') for row in reader if row.get('Entry ID')]
        
    print(json.dumps(csv_ids))

except Exception as e:
    print(f"Error: {e}")
