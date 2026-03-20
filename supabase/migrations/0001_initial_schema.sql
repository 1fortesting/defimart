-- 1. Create categories table
create table public.categories (
    id uuid not null default gen_random_uuid(),
    created_at timestamptz not null default now(),
    name text not null,
    constraint categories_pkey primary key (id),
    constraint categories_name_key unique (name)
);
comment on table public.categories is 'Product categories';

-- 2. Add category_id to products table
alter table public.products
add column category_id uuid null;

alter table public.products
add constraint products_category_id_fkey
foreign key (category_id) references public.categories(id) on delete set null;

-- 3. Create saved_products table
create table public.saved_products (
    id uuid not null default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id uuid not null,
    product_id uuid not null,
    constraint saved_products_pkey primary key (id),
    constraint saved_products_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
    constraint saved_products_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade,
    constraint saved_products_user_product_unique unique (user_id, product_id)
);
comment on table public.saved_products is 'User favorite/saved products';

-- 4. Create cart_items table
create table public.cart_items (
    id uuid not null default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id uuid not null,
    product_id uuid not null,
    quantity int not null default 1,
    constraint cart_items_pkey primary key (id),
    constraint cart_items_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
    constraint cart_items_product_id_fkey foreign key (product_id) references public.products(id) on delete cascade,
    constraint cart_items_quantity_check check (quantity > 0)
);
comment on table public.cart_items is 'Items in user shopping carts';

-- 5. Set up Row Level Security (RLS)

-- Enable RLS for all tables
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.saved_products enable row level security;
alter table public.cart_items enable row level security;

-- Policies for products
drop policy if exists "Public can view products" on public.products;
create policy "Public can view products" on public.products for select using (true);

-- Policies for categories
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories" on public.categories for select using (true);

-- Policies for profiles
drop policy if exists "Public can view profiles" on public.profiles;
create policy "Public can view profiles" on public.profiles for select using (true);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Policies for orders
drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders" on public.orders for select using (auth.uid() = buyer_id);
drop policy if exists "Users can create orders" on public.orders;
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = buyer_id);

-- Policies for saved_products
drop policy if exists "Users can view their own saved products" on public.saved_products;
create policy "Users can view their own saved products" on public.saved_products for select using (auth.uid() = user_id);
drop policy if exists "Users can save products" on public.saved_products;
create policy "Users can save products" on public.saved_products for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their saved products" on public.saved_products;
create policy "Users can delete their saved products" on public.saved_products for delete using (auth.uid() = user_id);

-- Policies for cart_items
drop policy if exists "Users can view their own cart items" on public.cart_items;
create policy "Users can view their own cart items" on public.cart_items for select using (auth.uid() = user_id);
drop policy if exists "Users can manage their own cart items" on public.cart_items;
create policy "Users can manage their own cart items" on public.cart_items for all using (auth.uid() = user_id);

-- Policies for conversations
drop policy if exists "Users can access their own conversations" on public.conversations;
create policy "Users can access their own conversations" on public.conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Policies for messages
drop policy if exists "Users can access messages in their conversations" on public.messages;
create policy "Users can access messages in their conversations" on public.messages for select using (
  exists (
    select 1 from conversations
    where conversations.id = messages.conversation_id
    and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);
drop policy if exists "Users can send messages in their conversations" on public.messages;
create policy "Users can send messages in their conversations" on public.messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from conversations
    where conversations.id = messages.conversation_id
    and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);


-- 6. Storage Policies
drop policy if exists "Allow public read access to product images" on storage.objects;
create policy "Allow public read access to product images" on storage.objects for select to public using (bucket_id = 'product_images');

drop policy if exists "Allow authenticated users to upload product images" on storage.objects;
create policy "Allow authenticated users to upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product_images');
