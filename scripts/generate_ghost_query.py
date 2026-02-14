import json

with open('ghost_ids.txt', 'r') as f:
    content = f.read()
    # It might be in DB format (JSON array of strings)
    try:
        if content.startswith('['):
            ids = json.loads(content)
        else:
            # Fallback if it's just lines (but previous script wrote json dump)
            ids = json.loads(content)
    except:
        print("Error parsing ghost_ids.txt")
        ids = []

if ids:
    id_list = "', '".join(ids)
    sql = f"SELECT id, full_name, company_name FROM leads WHERE id IN ('{id_list}');"
    with open('check_ghosts.sql', 'w') as f:
        f.write(sql)
    print("SQL written to check_ghosts.sql")
else:
    print("No ghost IDs found.")
