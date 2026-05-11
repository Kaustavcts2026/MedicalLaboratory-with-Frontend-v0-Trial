-- OPTIONAL (no need to run normally)

SELECT id, order_id FROM medlab.samples;
SELECT id, status FROM medlab.orders WHERE id = 2;
SELECT sample_id FROM lab_processing.processing_jobs;