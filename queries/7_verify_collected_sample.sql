SELECT id, order_id, collected_by FROM medlab.samples;
SELECT id, status FROM medlab.orders WHERE id = 1;
SELECT id, sample_id, test_id, status FROM lab_processing.processing_jobs;