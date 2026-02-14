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
            csv_ids.add(row.get('Entry ID').strip()) # Strip whitespace

print(f"CSV IDs found: {len(csv_ids)}")

# 2. Get DB IDs
db_ids = set()
with open(db_output_path, 'r') as f:
    content = f.read()
    match = re.search(r'<untrusted-data-[^>]+>\s*(\[.*?\])\s*</untrusted-data', content, re.DOTALL)
    if match:
        json_str = match.group(1)
        data = json.loads(json_str)
        for item in data:
            db_ids.add(item['id'].strip()) # Strip whitespace
    else:
        print("Could not find JSON in DB output file")

print(f"DB IDs found: {len(db_ids)}")

# 3. Intersections
common = csv_ids.intersection(db_ids)
only_in_csv = csv_ids - db_ids
only_in_db = db_ids - csv_ids

print(f"Common IDs: {len(common)}")
print(f"Only in CSV: {len(only_in_csv)}")
print(f"Only in DB: {len(only_in_db)}")

print("\n--- Examples ---")
if common:
    print(f"Common Example: {list(common)[0]}")
if only_in_csv:
    print(f"Only in CSV Example: {list(only_in_csv)[0]}")
if only_in_db:
    print(f"Only in DB Example: {list(only_in_db)[0]}")
