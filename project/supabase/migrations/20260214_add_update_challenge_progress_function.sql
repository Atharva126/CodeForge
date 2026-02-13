-- Create server-side RPC function to update challenge progress
-- This bypasses RLS issues and ensures proper permissions

CREATE OR REPLACE FUNCTION public.update_challenge_progress(
    p_user_id UUID,
    p_target_type TEXT,
    p_increment INTEGER DEFAULT 1
) RETURNS void AS $$
DECLARE
    v_challenge RECORD;
    v_new_value INTEGER;
    v_is_completed BOOLEAN;
BEGIN
    -- Find all active user challenges matching the target type
    FOR v_challenge IN 
        SELECT uc.*, c.target_value, c.coin_reward, c.xp_reward, c.title
        FROM public.user_challenges uc
        JOIN public.challenges c ON c.id = uc.challenge_id
        WHERE uc.user_id = p_user_id
        AND uc.is_completed = false
        AND c.target_type = p_target_type
        AND c.is_active = true
    LOOP
        -- Calculate new value
        v_new_value := v_challenge.current_value + p_increment;
        v_is_completed := v_new_value >= v_challenge.target_value;
        
        -- Update the challenge progress
        IF v_is_completed THEN
            UPDATE public.user_challenges
            SET current_value = v_new_value,
                is_completed = true,
                completed_at = now(),
                last_updated = now()
            WHERE id = v_challenge.id;
            
            -- Award coins
            IF v_challenge.coin_reward > 0 THEN
                UPDATE public.profiles 
                SET forge_coins = COALESCE(forge_coins, 0) + v_challenge.coin_reward
                WHERE id = p_user_id;
                
                -- Log coin transaction
                INSERT INTO public.point_transactions (user_id, points, transaction_type, source, description)
                VALUES (
                    p_user_id, 
                    v_challenge.coin_reward, 
                    'earned', 
                    'challenge_reward', 
                    'Challenge completed: ' || v_challenge.title
                );
            END IF;
            
            -- Award XP via existing award_points function if it exists
            IF v_challenge.xp_reward > 0 THEN
                -- Update user_points table
                UPDATE public.user_points
                SET points = points + v_challenge.xp_reward,
                    experience = experience + v_challenge.xp_reward,
                    updated_at = now()
                WHERE user_id = p_user_id;
                
                -- Log XP transaction
                INSERT INTO public.point_transactions (user_id, points, transaction_type, source, description)
                VALUES (
                    p_user_id, 
                    v_challenge.xp_reward, 
                    'earned', 
                    'challenge_xp', 
                    'XP from challenge: ' || v_challenge.title
                );
            END IF;
        ELSE
            -- Just update progress
            UPDATE public.user_challenges
            SET current_value = v_new_value,
                last_updated = now()
            WHERE id = v_challenge.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_challenge_progress(UUID, TEXT, INTEGER) TO authenticated;
