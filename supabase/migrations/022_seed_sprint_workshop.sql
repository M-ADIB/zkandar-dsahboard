INSERT INTO cohorts (id, name, start_date, end_date, status, offering_type)
VALUES (
    gen_random_uuid(),
    'AI Integration Sprint (Test)', 
    '2024-03-01', 
    '2024-03-31', 
    'active', 
    'sprint_workshop'
)
ON CONFLICT DO NOTHING;
