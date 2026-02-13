-- Create store_items table
CREATE TABLE IF NOT EXISTS public.store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('course', 'digital', 'goodie')),
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT '₹',
    description TEXT,
    image TEXT,
    duration TEXT,
    level TEXT,
    instructor TEXT,
    downloadable BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2),
    students INTEGER DEFAULT 0,
    forge_coins_price INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_orders table
CREATE TABLE IF NOT EXISTS public.user_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT '₹',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'processing', 'pending', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_order_items table
CREATE TABLE IF NOT EXISTS public.user_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.user_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT
);

-- Access controls
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for store_items
CREATE POLICY "Anyone can view store items"
    ON public.store_items FOR SELECT
    USING (true);

-- Policies for user_orders
CREATE POLICY "Users can view their own orders"
    ON public.user_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
    ON public.user_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for user_order_items
CREATE POLICY "Users can view their own order items"
    ON public.user_order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_orders
        WHERE id = order_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own order items"
    ON public.user_order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_orders
        WHERE id = order_id AND user_id = auth.uid()
    ));

-- Add updated_at trigger helper if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
        CREATE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $inner$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $inner$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_store_items
    BEFORE UPDATE ON public.store_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_orders
    BEFORE UPDATE ON public.user_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed data for store_items
INSERT INTO public.store_items (name, category, price, currency, description, image, duration, level, instructor, rating, students)
VALUES 
('DSA Bootcamp', 'course', 2999, '₹', 'Complete Data Structures & Algorithms mastery', '/premium-dsa-course.svg', '12 weeks', 'Intermediate', 'John Doe', 4.8, 12500),
('System Design Basics', 'course', 1999, '₹', 'Learn to design scalable systems', '/premium-system-design.svg', '8 weeks', 'Advanced', 'Jane Smith', 4.7, 8900),
('Interview Preparation', 'course', 1499, '₹', 'Ace your technical interviews', '/premium-interview-prep.svg', '6 weeks', 'Intermediate', 'Mike Johnson', 4.6, 15600),
('Competitive Programming Mastery', 'course', 3499, '₹', 'Master competitive programming techniques', '/premium-competitive-programming.svg', '16 weeks', 'Advanced', 'Sarah Lee', 4.9, 6700);

INSERT INTO public.store_items (name, category, price, currency, description, image, downloadable, rating)
VALUES
('Problem Sheets Bundle', 'digital', 299, '₹', '500+ curated coding problems', '/problem-sheets.svg', true, 4.5),
('Interview Question Pack', 'digital', 199, '₹', '200+ interview questions with solutions', '/interview-questions.svg', true, 4.4),
('AI-Powered Explanations', 'digital', 499, '₹', 'Get AI help for complex problems', '/ai-explanations.svg', false, 4.7),
('Algorithm Visualizations', 'digital', 399, '₹', 'Interactive algorithm visualizations', '/algorithm-visualizations.svg', true, 4.6);

INSERT INTO public.store_items (name, category, price, currency, forge_coins_price, description, image, metadata, rating)
VALUES
('CodeForge T-Shirt', 'goodie', 499, '₹', 250, 'Premium quality cotton t-shirt with logo', '/codeforge_shirt.png', '{"sizes": ["S", "M", "L", "XL"]}'::jsonb, 4.4),
('CodeForge Stickers Pack', 'goodie', 149, '₹', 75, '12 premium vinyl stickers for laptop', '/Codeforge_stickers.png', '{}'::jsonb, 4.7),
('CodeForge Hoodie', 'goodie', 899, '₹', 450, 'Comfortable hoodie with embroidered logo', '/Codeforge_hoodie.png', '{"sizes": ["S", "M", "L", "XL"]}'::jsonb, 4.6),
('CodeForge Mug', 'goodie', 299, '₹', 150, 'Ceramic mug with code-themed design', '/Codeforge_mug.png', '{}'::jsonb, 4.5);
