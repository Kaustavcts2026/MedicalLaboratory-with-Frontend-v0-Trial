-- OPTIONAL (no need to run normally)

SELECT id, item_name, quantity FROM inventory_db.inventory_items WHERE id = 1;
SELECT COUNT(*) FROM notification_db.notification WHERE type = 'LOW_STOCK_ALERT';