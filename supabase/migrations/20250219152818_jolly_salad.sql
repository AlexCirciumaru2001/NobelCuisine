-- Create a unique partial index for table bookings on the same date and time
CREATE UNIQUE INDEX unique_table_booking 
ON table_bookings (table_number, booking_date, booking_time)
WHERE status IN ('pending', 'confirmed');

-- Create a function to check table availability
CREATE OR REPLACE FUNCTION check_table_availability(
  p_table_number integer,
  p_booking_date date,
  p_booking_time time
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM table_bookings
    WHERE table_number = p_table_number
      AND booking_date = p_booking_date
      AND booking_time = p_booking_time
      AND status IN ('pending', 'confirmed')
  );
END;
$$;

-- Create a function to get available tables for a specific time
CREATE OR REPLACE FUNCTION get_available_tables(
  p_booking_date date,
  p_booking_time time
)
RETURNS TABLE (table_number integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_number
  FROM (
    SELECT generate_series(1, 30) AS table_number
  ) t
  WHERE NOT EXISTS (
    SELECT 1
    FROM table_bookings b
    WHERE b.table_number = t.table_number
      AND b.booking_date = p_booking_date
      AND b.booking_time = p_booking_time
      AND b.status IN ('pending', 'confirmed')
  );
END;
$$;