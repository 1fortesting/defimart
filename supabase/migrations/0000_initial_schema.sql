-- Create custom types
CREATE TYPE public.order_status AS ENUM ('pending', 'ready', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    phone_number text,
    PRIMARY KEY (id)
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone_number)
  VALUES (new.id, new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'phone_number');
  RETURN new;
END;
$$;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create products table
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    image_urls text[],
    seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone." ON public.products FOR SELECT USING (true);
CREATE POLICY "Users can create products." ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update their own products." ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete their own products." ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- Create orders table
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id),
    buyer_id uuid NOT NULL REFERENCES public.profiles(id),
    seller_id uuid NOT NULL REFERENCES public.profiles(id),
    quantity int NOT NULL,
    status public.order_status NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer or seller can view their orders." ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status." ON public.orders FOR UPDATE USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- Create conversations table
CREATE TABLE public.conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (product_id, buyer_id),
    PRIMARY KEY (id)
);

-- RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view conversations." ON public.conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can initiate conversations." ON public.conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Create messages table
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages." ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.conversations
        WHERE conversations.id = messages.conversation_id AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);
CREATE POLICY "Participants can send messages." ON public.messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.conversations
        WHERE conversations.id = messages.conversation_id AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    ) AND sender_id = auth.uid()
);

-- Enable realtime on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
