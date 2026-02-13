-- Create a function to handle purchase with Forge Coins
CREATE OR REPLACE FUNCTION purchase_item_with_coins(
  p_item_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_item_price INTEGER;
  v_user_coins INTEGER;
  v_new_balance INTEGER;
  v_item_name TEXT;
BEGIN
  -- Get item details
  SELECT forge_coins_price, name INTO v_item_price, v_item_name
  FROM store_items
  WHERE id = p_item_id;

  IF v_item_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Item not available for Forge Coins');
  END IF;

  -- Get user balance
  SELECT forge_coins INTO v_user_coins
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_coins < v_item_price THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient Forge Coins');
  END IF;

  -- Deduct coins
  v_new_balance := v_user_coins - v_item_price;
  
  UPDATE profiles
  SET forge_coins = v_new_balance
  WHERE id = p_user_id;

  -- Record transaction/order (using existing user_orders table but adapting for coins)
  INSERT INTO user_orders (user_id, total, currency, status)
  VALUES (p_user_id, v_item_price, 'FC', 'completed');

  -- Record item in user_order_items
  INSERT INTO user_order_items (order_id, item_id, price)
  VALUES (
    (SELECT id FROM user_orders WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1),
    p_item_id,
    v_item_price
  );

  -- Log notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'reward',
    'Purchase Successful',
    'You bought ' || v_item_name || ' for ' || v_item_price || ' Forge Coins.'
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing store items to have Forge Coin prices if they don't
-- Assumes roughly 1 INR = 1 Coin for simplicity, or 100, let's say 10
UPDATE store_items
SET forge_coins_price = (price * 10)::INTEGER
WHERE forge_coins_price IS NULL AND price IS NOT NULL;

-- Make sure currency column constraint allows 'FC' if it was restricted (it was TEXT DEFAULT '₹', check constraint might exist)
ALTER TABLE store_items DROP CONSTRAINT IF EXISTS store_items_category_check;
ALTER TABLE store_items ADD CONSTRAINT store_items_category_check CHECK (category IN ('course', 'digital', 'goodie'));
-- Check if there was a currency constraint on user_orders
ALTER TABLE user_orders DROP CONSTRAINT IF EXISTS user_orders_status_check;
ALTER TABLE user_orders ADD CONSTRAINT user_orders_status_check CHECK (status IN ('completed', 'processing', 'pending', 'cancelled'));

