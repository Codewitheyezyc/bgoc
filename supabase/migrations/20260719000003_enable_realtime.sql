-- 20260719000003_enable_realtime.sql
-- Enable realtime updates on the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
