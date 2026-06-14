USE complaint_db;

-- Update ALL user accounts to use bcrypt hash of 'demo1234'
-- This makes all demo/test accounts loginable with password: demo1234
UPDATE User SET password_hash = '$2b$10$sNMUD1DqLycadJOCBoHqBeUEit0eBHKYRq3Q703py.5WoapPuIvNa';

-- Verify by checking a few key accounts
SELECT user_id, email, role, account_status,
       LEFT(password_hash, 7) AS hash_prefix
FROM User
WHERE email IN (
  'ahmed.raza@students.namal.edu',
  'hina.akram@namal.edu',
  'asif@staff.namal.edu.pk',
  'senior.handler@namal.edu',
  'admin@namal.edu'
);
