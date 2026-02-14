#!/usr/bin/env python3
"""Generate SQL INSERT statements from the Leads CSV file."""
import csv
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'All Leads Master Sheet.csv')

COL_MAP = {
    'Entry ID': 'id',
    'Record ID': 'record_id',
    'Record': 'full_name',
    'Priority ': 'priority',
    '"Priority " Changed At': 'priority_changed_at',
    '"Priority " Previous Values': 'priority_previous_values',
    'Company name': 'company_name',
    'Parent Record > Email addresses': 'email',
    'Parent Record > Phone numbers': 'phone',
    'Parent Record > Instagram': 'instagram',
    'Parent Record > Description': 'description',
    'Parent Record > Primary location > Country': 'country',
    'Parent Record > Primary location > City': 'city',
    'Parent Record > Job title': 'job_title',
    'Discovery Call Date': 'discovery_call_date',
    'Offering Type ': 'offering_type',
    'Session Type': 'session_type',
    'Payment ': 'payment_amount',
    'Seats': 'seats',
    'Coupon %': 'coupon_percent',
    'Coupon Code': 'coupon_code',
    'Paid Desposit': 'paid_deposit',
    'Amount Paid 2': 'amount_paid_2',
    'DOP': 'date_of_payment',
    'Payment Plan': 'payment_plan',
    'Amount Paid': 'amount_paid',
    'DOP 2': 'date_of_payment_2',
    'Balance DOP': 'balance_dop',
    'Paid Full': 'paid_full',
    'DOP 3': 'date_of_payment_3',
    'Day Slot': 'day_slot',
    'Time Slot': 'time_slot',
    'START DATE': 'start_date',
    'END DATE': 'end_date',
    'Sessions Done': 'sessions_done',
    'Booked Support': 'booked_support',
    'Support Date Booked': 'support_date_booked',
    'Notes': 'notes',
}

NUMERIC_COLS = {'payment_amount', 'amount_paid_2', 'amount_paid', 'balance', 'balance_2'}
INT_COLS = {'seats', 'sessions_done', 'coupon_percent'}
DATE_COLS = {
    'discovery_call_date',
    'start_date',
    'end_date',
    'date_of_payment',
    'date_of_payment_2',
    'date_of_payment_3',
    'balance_dop',
    'support_date_booked',
}
TS_COLS = {'priority_changed_at'}


def clean(val):
    val = val.strip()
    if val in ('', '-', 'N/A', 'n/a'):
        return None
    return val


def sql_val(col, val):
    if val is None:
        return 'NULL'
    if col in NUMERIC_COLS:
        try:
            return str(float(val))
        except ValueError:
            return 'NULL'
    if col in INT_COLS:
        try:
            return str(int(val.replace('%', '')))
        except ValueError:
            return 'NULL'
    if col in DATE_COLS:
        if len(val) >= 10 and val[4] == '-':
            return "'" + val[:10] + "'"
        return 'NULL'
    if col in {'paid_deposit', 'paid_full'}:
        return 'TRUE' if val.lower() in ('yes', 'true') else 'FALSE'
    if col in TS_COLS:
        return "'" + val.replace("'", "''") + "'"
    return "'" + val.replace("'", "''") + "'"


def main():
    with open(CSV_PATH, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    all_processed = []
    for row in rows:
        rec = {}
        for csv_col, db_col in COL_MAP.items():
            v = clean(row.get(csv_col, ''))
            if v is not None:
                rec[db_col] = v

        headers = list(row.keys())
        balance_indices = [i for i, h in enumerate(headers) if h.strip() == 'Balance']
        if len(balance_indices) >= 1:
            v = clean(list(row.values())[balance_indices[0]])
            if v:
                rec['balance'] = v
        if len(balance_indices) >= 2:
            v = clean(list(row.values())[balance_indices[1]])
            if v:
                rec['balance_2'] = v

        all_processed.append(rec)

    # Collect all existing columns from all rows
    all_cols = set()
    for row in all_processed:
        all_cols.update(row.keys())
    cols = sorted(all_cols)

    # Build batches of 5 rows
    batch_size = 5
    total_batches = (len(all_processed) + batch_size - 1) // batch_size

    for batch_idx in range(total_batches):
        start = batch_idx * batch_size
        batch = all_processed[start:start + batch_size]

        rows_sql = []
        for row in batch:
            vals = [sql_val(c, row.get(c)) for c in cols]
            rows_sql.append('(' + ', '.join(vals) + ')')

        sql = 'INSERT INTO public.leads (' + ', '.join(cols) + ') VALUES ' + ', '.join(rows_sql) + ' ON CONFLICT (id) DO NOTHING;'

        out_path = f'/tmp/leads_b5_{batch_idx}.sql'
        with open(out_path, 'w') as f:
            f.write(sql)

    print(f'{total_batches} batches generated from {len(all_processed)} rows')


if __name__ == '__main__':
    main()
