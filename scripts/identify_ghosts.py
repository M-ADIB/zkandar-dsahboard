import csv
import json
import re

# 1. Get Missing CSV Records (ID and Name)
csv_path = 'src/assets/All Leads Master Sheet (1).csv'
db_ids_path = 'db_ids.txt'

csv_data = {}
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('Entry ID'):
            csv_data[row.get('Entry ID').strip()] = row.get('Record')

# 2. Get DB IDs
db_ids = set()
try:
    with open(db_ids_path, 'r') as f:
        for line in f:
            if line.strip():
                db_ids.add(line.strip())
except: pass

# 3. Identify Missing vs Ghost
missing_csv_ids = set(csv_data.keys()) - db_ids
ghost_db_ids = db_ids - set(csv_data.keys())

print(f"Missing CSV IDs: {len(missing_csv_ids)}")
print(f"Ghost DB IDs: {len(ghost_db_ids)}")

missing_names = {csv_data[mid] for mid in missing_csv_ids if mid in csv_data}
print(f"Missing Names count: {len(missing_names)}")

# 4. We need to fetch the NAMES of the ghost DB IDs to compare
# We'll output the Ghost IDs to a file, then use SQL to fetch their names
with open('ghost_ids.txt', 'w') as f:
    f.write(json.dumps(list(ghost_db_ids)))

print("Ghost IDs written to ghost_ids.txt. Run SQL to get names.")
