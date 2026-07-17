-- Enable realtime for tables used in the app's realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.matching_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
