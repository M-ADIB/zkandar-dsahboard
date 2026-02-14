import csv
import json

csv_path = 'src/assets/All Leads Master Sheet (1).csv'
db_output_path = '/Users/madibbaroudi/.gemini/antigravity/brain/989bd71c-bec4-4b3a-9970-83b8e0d9a27a/.system_generated/steps/2468/output.txt'

# 1. Get CSV IDs
csv_ids = set()
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('Entry ID'):
            csv_ids.add(row.get('Entry ID').strip())

# 2. Get DB IDs
db_ids = set()
with open(db_output_path, 'r') as f:
    content = f.read()
    # Find start of JSON array
    start = content.find('[')
    end = content.rfind(']')
    if start != -1 and end != -1:
        json_str = content[start:end+1]
        try:
            data = json.loads(json_str)
            for item in data:
                db_ids.add(item['id'].strip())
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            # Try to fix truncated JSON if needed, or fallback to regex for UUIDs
            uuids = re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', content)
            db_ids.update(uuids)
    else:
        print("Could not find delimiters []")

print(f"CSV IDs: {len(csv_ids)}")
print(f"DB IDs: {len(db_ids)}")

missing = csv_ids - db_ids
print(f"Missing Count: {len(missing)}")
print(f"Missing IDs: {list(missing)}")
