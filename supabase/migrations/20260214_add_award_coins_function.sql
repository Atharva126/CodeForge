-- Add award_coins RPC function for challenge rewards
-- This function is called when challenges are completed to award Forge Coins

CREATE OR REPLACE FUNCTION public.award_coins(
    p_user_id UUID,
    p_amount INTEGER
) RETURNS void AS $$
BEGIN
    -- Update the user's forge_coins in profiles table
    UPDATE public.profiles 
    SET forge_coins = COALESCE(forge_coins, 0) + p_amount
    WHERE id = p_user_id;
    
    -- Log the transaction for transparency
    INSERT INTO public.point_transactions (user_id, points, transaction_type, source, description)
    VALUES (
        p_user_id, 
        p_amount, 
        'earned', 
        'challenge_reward', 
        'Earned ' || p_amount || ' Forge Coins from challenge completion'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.award_coins(UUID, INTEGER) TO authenticated;
