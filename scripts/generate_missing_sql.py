import csv
import json
import re

# Key mapping from original script
key_map = {
    'Entry ID': 'id',
    'Record': 'full_name',
    'Parent Record > Email addresses': 'email',
    'Parent Record > Phone numbers': 'phone',
    'Parent Record > Instagram': 'instagram',
    'Company name': 'company_name',
    'Parent Record > Job title': 'job_title',
    'Parent Record > Primary location > Country': 'country',
    'Parent Record > Primary location > City': 'city',
    'Parent Record > Description': 'description',
    'Priority ': 'priority',
    'Discovery Call Date': 'discovery_call_date',
    'Offering Type ': 'offering_type',
    'Session Type': 'session_type',
    'Payment ': 'payment_amount',
    'Seats': 'seats',
    'Balance ': 'balance',
    'Coupon %': 'coupon_percent',
    'Coupon Code': 'coupon_code',
    'Paid Desposit': 'paid_deposit',
    'Amount Paid': 'amount_paid',
    'Amount Paid 2': 'amount_paid_2',
    'DOP': 'date_of_payment',
    'DOP 2': 'date_of_payment_2',
    'DOP 3': 'date_of_payment_3',
    'Payment Plan': 'payment_plan',
    'Paid Full': 'paid_full',
    'Balance DOP': 'balance_dop',
    'Day Slot': 'day_slot',
    'Time Slot': 'time_slot',
    'START DATE': 'start_date',
    'END DATE': 'end_date',
    'Sessions Done': 'sessions_done',
    'Booked Support': 'booked_support',
    'Support Date Booked': 'support_date_booked',
    'Notes': 'notes',
    '"Priority " Changed At': 'priority_changed_at',
    '"Priority " Previous Values': 'priority_previous_values'
}

missing_ids_list = [
    "b039ed34-9e4e-51b1-a351-fd14df3c9856", "b615ac99-2230-53c0-b203-14dc2ee9cc5d", "dd7066f7-2702-5718-a824-a8fdbddc6013",
    "e1b619c9-6ea1-4c86-aea5-588292f88ec1", "e3e40e8a-ace3-51b7-b8e1-a72b3d0cb606", "2e0cadbc-fee1-50e8-8ce6-bf862ac7f3f7",
    "49bf3579-0e19-502a-a162-9d3953d6a750", "49f4656b-5504-5f1c-91d8-256dc1ffa0ad", "6cced2ea-4b74-52f8-855e-17adfd72c6b7",
    "aab69840-64b9-531b-ad9b-4d5b007dad11", "c725f939-54ef-5e0b-8e76-80e333e88eeb", "e5960be1-0f2f-558e-b0bd-513ba2e2d118",
    "f4050aef-3619-5a8d-81a2-2d46d27e02f9", "fcd5712e-d5b0-4549-8aa8-3777e1e248c9", "01c4ff75-a364-5a5c-beab-080093eb5322",
    "07ee9c14-ac0e-5435-93cf-2d4ff638b5e4", "1faa3e0f-f861-5f35-9633-c64e0fdfed28", "2d8b974c-f87b-5cd4-ab5d-e06ea65c637f",
    "36671908-ced3-501f-94dd-df5fd6ebb324", "3c81fdc4-9089-56fe-8677-822cd37df19e", "3db62ae0-6392-5f58-83fd-1bda13fc1d65",
    "468b3a5b-48c9-5d9f-a9db-8bc94be2d6d1", "6f29c3be-0536-5e53-ac4e-882f3e384db5", "71e1720f-3cd1-5ed3-9876-207930e443f3",
    "73f419d7-1369-5cd5-8bc5-d8cc5f15eba0", "76e08f3c-aaf5-5122-ab1e-6ea1e7c75cd1", "83309dfd-9bf9-5a4f-8784-3cb7c51e0720",
    "9d5bcda2-7b90-5953-a618-bb0342d3f8df", "b9a7e426-f77c-57e2-a0ce-26cbcaca0611", "ba31843e-4981-5b2a-9454-84f961812c36",
    "c101ade4-ab6f-59b4-8a01-cb5451f98f3a", "c8439585-5a3c-5fb0-a7c5-f08fcfaa6bd6", "c8744169-179d-5fa8-a8a4-255d6a2c7f4e",
    "d08e1d5c-1b54-51ff-985c-d1287dbc01a5", "d0b42684-fb8e-5597-9f09-a418efef6326", "fe0c1d61-8b3f-59cf-881e-e1db3e23022e",
    "fe67b1cc-168b-57ad-911c-69f6f8ab57cf", "02020ccb-e779-55c9-8d87-0d0f5a85f8e4", "03dd5b5b-e5bc-5462-85b9-370f0f7938a5",
    "066b8f79-7592-5465-8b42-b61bdf05d263", "06c05740-3b18-5b16-a87c-ca5413b2fd1f", "06f79a4b-fcf5-50c8-a4d0-4d401f53aa2a",
    "072e8d2d-cbc2-5e4b-8bd5-d44d5deae9b5", "0bba683d-54cf-55b1-8e5f-b05cc6d36657", "0dc7f9e3-2049-5df4-bf3e-f0a85b675729",
    "11f9c71c-fce9-5abc-8275-85009a898790", "1292afd7-d9c7-5d93-a1e1-d95bf229c509", "1d4b78a0-56a7-578d-8c52-39b666ea01ca",
    "1f28803a-43a1-52f3-9a80-e45006728ca8", "2e866d98-7726-525e-bda7-26c87ab816cd", "39750caa-a973-501c-9b8b-2add715366fb",
    "3bc76180-f9c2-5ebc-a9d3-909b57d0aa96", "3c33e7bd-389e-5825-a21f-8ada9b33b1d0", "4b733a84-b5fa-5ac8-94bb-d93e84de5e78",
    "4bad6518-77e1-56b3-9937-1f149e9dfabf", "4fe3ac42-7b23-5e34-9853-85e3b8b0a4e9", "57396528-3a41-5a23-88b6-a9e5fafa5611",
    "59e658a6-0ed3-5193-8ab1-b14a007e27a8", "645dead2-7eea-519e-9601-948085e03743", "65514afe-a101-5d00-a33f-e6d9d4dbcd45",
    "68e38cca-92eb-56ce-a8ef-135b2f223094", "6ba1f41f-7ff1-5d52-b999-f600ea1dd7b3", "6dd36bd1-d047-5860-8178-97c3d46fcee0",
    "6f9454bd-4a7d-5253-bc08-69e3e56e2a7e", "7609ddaf-3203-5120-b1eb-53ec53f1469d", "77967498-cb40-5bd2-b455-c9365cbc2793",
    "79cf4adb-bf71-5689-86ca-5349f57fc0fe", "79e50c30-1582-5c0d-8e78-a1dbcb1bb1a2", "7aef6faa-fc6b-57b6-a74c-300130871c9c",
    "7d4579ba-2182-5e52-a607-0bf45871b9e8", "7d4904c4-a5f3-5aec-9115-9fa2f1ab04db", "973cb746-d4fb-59a6-acc8-d9fcc6bb03d1",
    "a00cf8eb-fe01-54e7-aa9d-31fc12c48daa", "a47c4c1e-9a42-53fc-a4d2-656fda731720", "a4ee9c36-3b08-5d13-b0dd-b6f744e69ccf",
    "a98b538b-8783-5ac3-b218-7e4c575d6e6e", "a9fb89ae-c720-55a2-bb0f-2c7475e381eb", "b6a5a0c8-aff9-5709-a284-294a7a4201cb",
    "b6b7d637-746e-58fb-9237-72ce8fbbc041", "b7652d40-08b8-56db-81b7-1918ad445a6e", "bd69fc50-2f0e-5bc1-81f6-f0f71f01533d",
    "c013936d-d1c8-5427-9487-99f02647e950", "c1ffc603-f4b2-58a5-9c5d-de283c38aaa2", "c28a4a31-956c-532f-8c01-dd879239c083",
    "c3a8ddf8-dfb2-53f6-a7d4-f72e1fa60899", "c3c78efa-a6fb-5b3f-87f2-9f00c13e3966", "c42e3265-b54f-5846-9a57-d6872b145861",
    "c7eee312-30ad-5c27-b663-c4c72249da72", "cf524970-fbc0-5d56-b4d0-97208794f162", "d459404f-53f2-51b6-8f3a-2d2d9ca77da6",
    "d4aa63ec-3717-5def-b905-60a3103acabf", "d678748f-1486-5d19-b4c4-3de9f9de4fed", "d94fe143-e0cc-52fa-9ccc-fd8d6108aa7b",
    "d9c78149-3021-5f85-a4aa-9f0a2b1a9929", "db36a5cd-a2f7-5924-953c-7f0f0b2dfe08", "e7d372de-4f08-544b-a8c6-d50fcd23a266",
    "e922b0e6-ed58-5795-825f-48c9dafab561", "eaa54c7d-6c41-5454-a06e-a2e6b5d5a161", "eb5668cc-7ec7-5a10-a4b5-265854c948cb",
    "ed5d1e25-7ab8-5582-91ab-3d31166c264c", "f1d70b43-bedc-5710-a063-c6ac8fe7557c", "f56490e9-f27a-56d1-8ee7-633af965351d",
    "f7d1f175-31dd-56a4-b55e-01069798b14d", "fa15faab-fc84-5ee0-b65c-c117822378d8", "faef5164-9344-5663-a46c-d5b678862090",
    "fd73360c-a364-59a0-b0e6-2bb19c107f58"
]

csv_path = 'src/assets/All Leads Master Sheet (1).csv'

def sql_val(col, val):
    if not val or val.strip() == '':
        return 'NULL'
    val = val.strip()
    # Handle specific types
    if col in ['payment_amount', 'seats', 'balance', 'balance_2', 'coupon_percent', 'amount_paid', 'amount_paid_2', 'sessions_done']:
        if val == '-': return 'NULL'
        return val.replace('$', '').replace(',', '')
    if col in ['paid_deposit', 'paid_full']:
        return 'TRUE' if val.lower() == 'yes' else 'FALSE'
    if col == 'priority_previous_values':
        return "'{}'" # Empty array literal
    # Escape quotes
    val = val.replace("'", "''")
    return f"'{val}'"

rows_processed = []

with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        eid = row.get('Entry ID')
        if eid in missing_ids_list:
            new_row = {}
            for csv_key, db_key in key_map.items():
                val = row.get(csv_key)
                new_row[db_key] = val
            rows_processed.append(new_row)

print(f"Generating SQL for {len(rows_processed)} missing rows...")

# Just generate one batch
if rows_processed:
    # Get all cols from THESE rows to be safe
    all_cols = set()
    for row in rows_processed:
        all_cols.update(row.keys())
    cols = sorted(all_cols)

    rows_sql = []
    for row in rows_processed:
        vals = [sql_val(c, row.get(c)) for c in cols]
        rows_sql.append('(' + ', '.join(vals) + ')')

    sql = 'INSERT INTO public.leads (' + ', '.join(cols) + ') VALUES ' + ', '.join(rows_sql) + ';'
    
    with open('/tmp/leads_missing_fix.sql', 'w') as f:
        f.write(sql)
    print("Computed SQL written to /tmp/leads_missing_fix.sql")
else:
    print("No rows found matching missing IDs")
