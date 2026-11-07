import { useCallback, useEffect, useRef } from 'react';
import { supabase, supabaseConfigured } from './supabase';

export type SubscribeTableChange = (table: string, listener: () => void) => () => void;

const APP_CHANGE_TOPIC = 'app_changes';
const SIGNAL_DEBOUNCE_MS = 300;

const WATCHED_TABLES = [
  'profiles',
  'reservations',
  'rooms',
  'settings',
  'matching_posts',
  'gallery_items',
  'reviews',
  'date_memos',
  'admin_memos',
  'game_day_events',
  'game_day_participants',
  'game_day_matches',
] as const;

export function useTableChangeHub(): SubscribeTableChange {
  const listenersRef = useRef(new Map<string, Set<() => void>>());

  useEffect(() => {
    if (!supabaseConfigured) return;
    const listeners = listenersRef.current;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const dispatch = (table: string) => {
      const pending = timers.get(table);
      if (pending) clearTimeout(pending);
      timers.set(
        table,
        setTimeout(() => {
          timers.delete(table);
          listeners.get(table)?.forEach((listener) => listener());
        }, SIGNAL_DEBOUNCE_MS),
      );
    };

    let channel = supabase.channel(APP_CHANGE_TOPIC);
    for (const table of WATCHED_TABLES) {
      channel = channel.on('broadcast', { event: table }, () => dispatch(table));
    }
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') console.warn('[app_changes_realtime]', status);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      supabase.removeChannel(channel);
    };
  }, []);

  return useCallback<SubscribeTableChange>((table, listener) => {
    const listeners = listenersRef.current;
    let set = listeners.get(table);
    if (!set) {
      set = new Set();
      listeners.set(table, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }, []);
}
