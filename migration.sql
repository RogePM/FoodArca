
-- Indexes
CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_organization_id ON catalog_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category_id ON catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_catalog_item_id ON inventory_batches(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_location_id ON inventory_batches(location_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_location_id ON activity_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_catalog_item_id ON activity_logs(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Cascades (Safe idempotency)
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_organization_id_fkey;
ALTER TABLE locations ADD CONSTRAINT locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE catalog_items DROP CONSTRAINT IF EXISTS catalog_items_organization_id_fkey;
ALTER TABLE catalog_items ADD CONSTRAINT catalog_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE catalog_items DROP CONSTRAINT IF EXISTS catalog_items_category_id_fkey;
ALTER TABLE catalog_items ADD CONSTRAINT catalog_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE inventory_batches DROP CONSTRAINT IF EXISTS inventory_batches_catalog_item_id_fkey;
ALTER TABLE inventory_batches ADD CONSTRAINT inventory_batches_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE CASCADE;

ALTER TABLE inventory_batches DROP CONSTRAINT IF EXISTS inventory_batches_location_id_fkey;
ALTER TABLE inventory_batches ADD CONSTRAINT inventory_batches_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_organization_id_fkey;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_location_id_fkey;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_catalog_item_id_fkey;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE CASCADE;

ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop json column if it still exists (already done according to types, but being safe)
ALTER TABLE activity_logs DROP COLUMN IF EXISTS item_snapshot;

-- RPCs
CREATE OR REPLACE FUNCTION scan_out_item(
  p_catalog_item_id UUID,
  p_location_id UUID,
  p_quantity NUMERIC
) RETURNS void AS $$
DECLARE
  v_organization_id UUID;
  v_user_id UUID;
  v_remaining_qty NUMERIC := p_quantity;
  v_batch RECORD;
  v_snapshot_item_name TEXT;
BEGIN
  -- get organization and item name
  SELECT organization_id, name INTO v_organization_id, v_snapshot_item_name
  FROM catalog_items
  WHERE id = p_catalog_item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  v_user_id := auth.uid();

  -- reduce from batches (FIFO)
  FOR v_batch IN (
    SELECT id, quantity
    FROM inventory_batches
    WHERE catalog_item_id = p_catalog_item_id AND location_id = p_location_id AND quantity > 0
    ORDER BY created_at ASC
    FOR UPDATE
  ) LOOP
    IF v_remaining_qty <= 0 THEN
      EXIT;
    END IF;

    IF v_batch.quantity <= v_remaining_qty THEN
      -- use up this batch
      v_remaining_qty := v_remaining_qty - v_batch.quantity;
      UPDATE inventory_batches SET quantity = 0 WHERE id = v_batch.id;
    ELSE
      -- partially use this batch
      UPDATE inventory_batches SET quantity = quantity - v_remaining_qty WHERE id = v_batch.id;
      v_remaining_qty := 0;
    END IF;
  END LOOP;

  IF v_remaining_qty > 0 THEN
    RAISE EXCEPTION 'Not enough quantity in inventory';
  END IF;

  -- insert activity log
  INSERT INTO activity_logs (
    organization_id, location_id, catalog_item_id, snapshot_item_name, user_id, action_type, quantity_changed
  ) VALUES (
    v_organization_id, p_location_id, p_catalog_item_id, v_snapshot_item_name, v_user_id, 'scan_out', -p_quantity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_catalog_item_safe(
  p_item_id UUID
) RETURNS void AS $$
BEGIN
  DELETE FROM catalog_items WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
DO $$ 
DECLARE 
    pol RECORD; 
    new_qual text; 
    new_with_check text; 
BEGIN 
    FOR pol IN 
        SELECT schemaname, tablename, policyname, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'public' 
    LOOP 
        new_qual := pol.qual; 
        new_with_check := pol.with_check; 
        
        IF new_qual LIKE '%auth.uid() =%' THEN 
            new_qual := REPLACE(new_qual, 'auth.uid() =', '(select auth.uid()) ='); 
        END IF; 
        
        IF new_with_check LIKE '%auth.uid() =%' THEN 
            new_with_check := REPLACE(new_with_check, 'auth.uid() =', '(select auth.uid()) ='); 
        END IF; 
        
        IF new_qual IS DISTINCT FROM pol.qual OR new_with_check IS DISTINCT FROM pol.with_check THEN 
            EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s);', 
                pol.policyname, pol.schemaname, pol.tablename, 
                COALESCE(new_qual, 'true'), COALESCE(new_with_check, 'true')); 
        END IF; 
    END LOOP; 
END $$;

