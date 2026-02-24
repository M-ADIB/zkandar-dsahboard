-- Migration: Add public RPC for signup options
CREATE OR REPLACE FUNCTION get_public_signup_options()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  companies_data json;
  sprint_cohorts_data json;
BEGIN
  SELECT json_agg(json_build_object('id', id, 'name', name))
  INTO companies_data
  FROM companies;

  SELECT json_agg(json_build_object('id', id, 'name', name))
  INTO sprint_cohorts_data
  FROM cohorts
  WHERE offering_type = 'sprint_workshop' AND status IN ('upcoming', 'active');

  RETURN json_build_object(
    'companies', coalesce(companies_data, '[]'::json),
    'sprintWorkshops', coalesce(sprint_cohorts_data, '[]'::json)
  );
END;
$$;
