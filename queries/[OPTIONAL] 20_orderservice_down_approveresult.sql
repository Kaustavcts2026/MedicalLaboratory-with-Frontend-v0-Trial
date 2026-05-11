-- OPTIONAL (no need to run normally)

SELECT id, result, status FROM lab_processing.results;
SELECT id, order_id, patient_id, amount FROM billing.invoices ORDER BY id DESC LIMIT 1;