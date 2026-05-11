-- OPTIONAL (no need to run normally)

SELECT username, type, message FROM notification_db.notification
WHERE username = 'patient@lab.com' AND type = 'ORDER_CANCELLED';