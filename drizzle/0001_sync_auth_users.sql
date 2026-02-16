-- Function to handle new user creation
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Trigger execution
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
