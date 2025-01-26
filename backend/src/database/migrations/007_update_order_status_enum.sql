-- Drop the existing enum type (need to drop the column first)
ALTER TABLE orders DROP COLUMN status;
DROP TYPE order_status;

-- Create the new enum type with all statuses
CREATE TYPE order_status AS ENUM (
  'PENDING',
  'IN_PREPARATION',
  'ASSEMBLY',
  'ASSEMBLY_COMPLETED',
  'BAKING',
  'READY',
  'DELIVERED'
);

-- Add the column back with the new enum type
ALTER TABLE orders ADD COLUMN status order_status DEFAULT 'PENDING'; 