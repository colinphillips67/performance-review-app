-- Sample organization chart
-- Create org chart with CEO as root
INSERT INTO org_charts (version, root_employee_id, is_active)
SELECT 1, user_id, true
FROM users
WHERE email = 'ceo@example.com';

-- Add reporting relationships
-- VPs report to CEO
INSERT INTO org_chart_relationships (org_chart_id, employee_id, manager_id)
SELECT
  oc.org_chart_id,
  u.user_id,
  ceo.user_id
FROM org_charts oc
CROSS JOIN users u
CROSS JOIN users ceo
WHERE oc.is_active = true
  AND u.email IN ('vp.eng@example.com', 'vp.product@example.com')
  AND ceo.email = 'ceo@example.com';

-- Engineers report to VP Engineering
INSERT INTO org_chart_relationships (org_chart_id, employee_id, manager_id)
SELECT
  oc.org_chart_id,
  u.user_id,
  vp.user_id
FROM org_charts oc
CROSS JOIN users u
CROSS JOIN users vp
WHERE oc.is_active = true
  AND u.email IN ('engineer1@example.com', 'engineer2@example.com')
  AND vp.email = 'vp.eng@example.com';

-- Product team reports to VP Product
INSERT INTO org_chart_relationships (org_chart_id, employee_id, manager_id)
SELECT
  oc.org_chart_id,
  u.user_id,
  vp.user_id
FROM org_charts oc
CROSS JOIN users u
CROSS JOIN users vp
WHERE oc.is_active = true
  AND u.email IN ('pm1@example.com', 'pm2@example.com', 'designer@example.com')
  AND vp.email = 'vp.product@example.com';
