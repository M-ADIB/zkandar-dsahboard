import csv
import re

csv_path = 'src/assets/All Leads Master Sheet (1).csv'
db_output_path = '/Users/madibbaroudi/.gemini/antigravity/brain/989bd71c-bec4-4b3a-9970-83b8e0d9a27a/.system_generated/steps/2468/output.txt'

# 1. Get CSV IDs (Entry ID only)
csv_ids = set()
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('Entry ID'):
            csv_ids.add(row.get('Entry ID').strip())

print(f"CSV Entry IDs: {len(csv_ids)}")

# 2. Get DB IDs using Regex from the output file
db_ids = set()
with open(db_output_path, 'r') as f:
    content = f.read()
    # Pattern to match UUIDs inside the JSON structure
    # We look for "id":"UUID"
    matches = re.findall(r'"id":"([0-9a-f-]{36})"', content)
    db_ids.update(matches)

print(f"DB IDs (via regex): {len(db_ids)}")

# 3. Find missing
missing = csv_ids - db_ids
print(f"Missing Count: {len(missing)}")
print(f"Missing IDs: {sorted(list(missing))}")

# 4. Write missing IDs to file for next step
with open('missing_ids_final.json', 'w') as f:
    import json
    json.dump(list(missing), f)
