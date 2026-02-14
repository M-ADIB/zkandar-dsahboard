import csv
import json
import re

csv_path = 'src/assets/All Leads Master Sheet (1).csv'
db_output_path = '/Users/madibbaroudi/.gemini/antigravity/brain/989bd71c-bec4-4b3a-9970-83b8e0d9a27a/.system_generated/steps/2468/output.txt'

# 1. Get CSV IDs
csv_ids = set()
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('Entry ID'):
            csv_ids.add(row.get('Entry ID'))

print(f"CSV IDs found: {len(csv_ids)}")

# 2. Get DB IDs
db_ids = set()
with open(db_output_path, 'r') as f:
    content = f.read()
    # Extract JSON part
    match = re.search(r'<untrusted-data-[^>]+>\s*(\[.*?\])\s*</untrusted-data', content, re.DOTALL)
    if match:
        json_str = match.group(1)
        data = json.loads(json_str)
        for item in data:
            db_ids.add(item['id'])
    else:
        print("Could not find JSON in DB output file")

print(f"DB IDs found: {len(db_ids)}")

# 3. Find missing
missing_ids = csv_ids - db_ids
print(f"Missing IDs count: {len(missing_ids)}")
print(f"Missing IDs: {list(missing_ids)}")

# 4. Show details of missing rows
if missing_ids:
    print("\n--- Missing Row Details ---")
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('Entry ID') in missing_ids:
                print(f"Missing: {row.get('Record')} ({row.get('Company name')}) - ID: {row.get('Entry ID')}")
