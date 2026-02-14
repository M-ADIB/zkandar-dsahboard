import csv
import collections

csv_path = 'src/assets/All Leads Master Sheet (1).csv'

with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    print(f"CSV Headers: {reader.fieldnames}")
    rows = list(reader)

total_rows = len(rows)
# Use 'Entry ID' as the ID column
ids = [row.get('Entry ID') for row in rows]
# Filter out None values in case of empty rows
ids = [i for i in ids if i]

unique_ids = set(ids)
duplicates = [item for item, count in collections.Counter(ids).items() if count > 1]

print(f"Total rows in CSV: {total_rows}")
print(f"Unique IDs in CSV: {len(unique_ids)}")
print(f"Number of Duplicate IDs: {len(duplicates)}")

if duplicates:
    print(f"Duplicate IDs found: {len(duplicates)}")
    for dup_id in duplicates:
        print(f"\n--- Duplicate ID: {dup_id} ---")
        dup_rows = [r for r in rows if r.get('Entry ID') == dup_id]
        for i, r in enumerate(dup_rows):
            print(f"Entry {i+1}: {r.get('Record')} - {r.get('Company name')}")
else:
    print("No duplicates found.")
