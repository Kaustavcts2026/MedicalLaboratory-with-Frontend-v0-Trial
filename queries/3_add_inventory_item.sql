INSERT INTO inventory_db.inventory_items (item_name, quantity, unit, description, low_stock_threshold)
SELECT 'CBC Reagent Kit', 20, 'units', 'Reagent kit for CBC test', 10
WHERE NOT EXISTS (SELECT 1 FROM inventory_db.inventory_items WHERE item_name = 'CBC Reagent Kit');
SELECT id, item_name, quantity, low_stock_threshold FROM inventory_db.inventory_items;