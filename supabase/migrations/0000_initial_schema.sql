-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  phone_number text
);
-- Allow public read access
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

-- Function to create a profile for a new user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, phone_number, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to call the function on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Bucket for Product Images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product_images', 'product_images', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp']);

create policy "Product images are publicly accessible." on storage.objects for select using (bucket_id = 'product_images');
create policy "Authenticated users can upload product images." on storage.objects for insert to authenticated with check (bucket_id = 'product_images');
create policy "Users can update their own product images." on storage.objects for update using (auth.uid() = owner) with check (bucket_id = 'product_images');
create policy "Users can delete their own product images." on storage.objects for delete using (auth.uid() = owner);


-- Create Products Table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  name text not null,
  description text,
  price real not null,
  image_urls text[],
  seller_id uuid references public.profiles on delete cascade not null
);

-- RLS for products
alter table public.products enable row level security;
create policy "Products are viewable by everyone." on public.products for select using (true);
create policy "Users can insert their own products." on public.products for insert with check (auth.uid() = seller_id);
create policy "Users can update their own products." on public.products for update using (auth.uid() = seller_id);
create policy "Users can delete their own products." on public.products for delete using (auth.uid() = seller_id);


-- Create Order Status Enum
create type public.order_status as enum ('pending', 'ready', 'completed');

-- Create Orders Table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  product_id uuid references public.products not null,
  buyer_id uuid references public.profiles on delete cascade not null,
  seller_id uuid references public.profiles on delete cascade not null,
  quantity integer not null,
  status public.order_status default 'pending' not null
);

-- RLS for orders
alter table public.orders enable row level security;
create policy "Buyers and sellers can view their orders." on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers can create orders." on public.orders for insert with check (auth.uid() = buyer_id);
create policy "Sellers can update order status." on public.orders for update using (auth.uid() = seller_id) with check (auth.uid() = seller_id);


-- Create Conversations Table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  product_id uuid references public.products on delete cascade not null,
  buyer_id uuid references public.profiles on delete cascade not null,
  seller_id uuid references public.profiles on delete cascade not null
);
-- RLS for conversations
alter table public.conversations enable row level security;
create policy "Participants can view their conversations." on public.conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Participants can create conversations." on public.conversations for insert with check (auth.uid() = buyer_id or auth.uid() = seller_id);


-- Create Messages Table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null
);

-- RLS for messages
alter table public.messages enable row level security;
create policy "Participants can view messages in their conversations." on public.messages for select using (
  exists (
    select 1
    from public.conversations
    where public.conversations.id = messages.conversation_id
    and (public.conversations.buyer_id = auth.uid() or public.conversations.seller_id = auth.uid())
  )
);
create policy "Participants can send messages in their conversations." on public.messages for insert with check (
  sender_id = auth.uid() and
  exists (
    select 1
    from public.conversations
    where public.conversations.id = messages.conversation_id
    and (public.conversations.buyer_id = auth.uid() or public.conversations.seller_id = auth.uid())
  )
);
