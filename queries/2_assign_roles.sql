UPDATE auth_db.users SET role = 'ADMIN'    WHERE username = 'admin@lab.com';
UPDATE auth_db.users SET role = 'LAB_TECH' WHERE username = 'labtech@lab.com';
SELECT username, role FROM auth_db.users;