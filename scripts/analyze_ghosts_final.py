import csv
import json

# Ghost data from SQL execution (copy-pasted for simplicity or I could read output file)
# I will read the output file from step 2540
db_output_path = 'ghost_data.json'

ghosts = []
try:
    with open(db_output_path, 'r') as f:
        content = f.read()
        start = content.find('[')
        end = content.rfind(']')
        if start != -1:
            ghosts = json.loads(content[start:end+1])
except Exception as e:
    print(f"Error reading ghosts: {e}")

print(f"Loaded {len(ghosts)} ghost records.")

# CSV Data
csv_path = 'src/assets/All Leads Master Sheet (1).csv'
csv_rows = []
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('Entry ID'):
            csv_rows.append(row)

# Analysis
confirmed_ghosts = []
unmatched_ghosts = []

for g in ghosts:
    # Find match in CSV by Name
    matches = [r for r in csv_rows if r.get('Record') == g['full_name']]
    if matches:
        # Check if ID is different
        match = matches[0]
        csv_id = match.get('Entry ID')
        if csv_id != g['id']:
            confirmed_ghosts.append({
                'ghost_id': g['id'],
                'name': g['full_name'],
                'csv_id': csv_id
            })
        else:
            print(f"Weird: ID matches for {g['full_name']}? {g['id']}")
    else:
        unmatched_ghosts.append(g)

print(f"Confirmed Ghosts (Name match, ID mismatch): {len(confirmed_ghosts)}")
print(f"Unmatched Ghosts (Name not found in CSV?): {len(unmatched_ghosts)}")

if confirmed_ghosts:
    print(f"Example Confirmed: {confirmed_ghosts[0]}")
if unmatched_ghosts:
    print(f"Example Unmatched: {unmatched_ghosts[0]}")

# Generate Delete SQL for confirmed ghosts
if confirmed_ghosts:
    ids_to_delete = [g['ghost_id'] for g in confirmed_ghosts]
    # Also include unmatched ghosts? 
    # If they are in DB but NOT in CSV, they are extra data that shouldn't be there if we want to match CSV exactly.
    # The user said "140 rows in original".
    # If DB has extra rows not in CSV, they should be deleted.
    ids_to_delete.extend([g['id'] for g in unmatched_ghosts])
    
    unique_delete_ids = list(set(ids_to_delete))
    
    sql = f"DELETE FROM leads WHERE id IN ({', '.join([f"'{id}'" for id in unique_delete_ids])});"
    with open('delete_ghosts.sql', 'w') as f:
        f.write(sql)
    print(f"Generated delete SQL for {len(unique_delete_ids)} records.")
