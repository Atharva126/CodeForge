-- Create function to calculate level from experience
CREATE OR REPLACE FUNCTION public.calculate_level(experience INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: level = floor(experience / 100) + 1
  RETURN FLOOR(experience / 100) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to award points
CREATE OR REPLACE FUNCTION public.award_points(
  user_uuid UUID,
  points_amount INTEGER,
  transaction_source TEXT,
  transaction_description TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_points INTEGER;
  current_experience INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current user points or create if doesn't exist
  INSERT INTO public.user_points (user_id, points, experience)
  VALUES (user_uuid, points_amount, points_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    points = user_points.points + points_amount,
    experience = user_points.experience + points_amount,
    updated_at = now()
  RETURNING user_points.points, user_points.experience INTO current_points, current_experience;
  
  -- Calculate new level
  new_level := public.calculate_level(current_experience);
  
  -- Update level if changed
  UPDATE public.user_points 
  SET level = new_level 
  WHERE user_id = user_uuid AND level != new_level;
  
  -- Record transaction
  INSERT INTO public.point_transactions (user_id, points, transaction_type, source, description, metadata)
  VALUES (user_uuid, points_amount, 'earned', transaction_source, transaction_description, metadata);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
