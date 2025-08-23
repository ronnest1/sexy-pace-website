import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function genId() {
  try {
    const rand = new Uint8Array(16);
    crypto.getRandomValues(rand);
    return Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export default function RsvpButton({ eventId, initialCount }:{ eventId: string; initialCount: number; }) {
  const [count, setCount] = useState(initialCount);
  const [going, setGoing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string>('');
  // Email no longer used; only Clerk user id is allowed

  useEffect(() => {
    // Prefer Clerk identity if available
    // @ts-ignore
    const c = typeof window !== 'undefined' ? (window as any).Clerk : undefined;
    (async () => {
      try {
        if (c) await c.load?.();
        const u = c?.user;
        if (u?.id) {
          setUserId(u.id);
        }
      } catch { /* noop */ }
    })();
  }, []);

  // After we have or update userId, sync initial server state
  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Fetch current going for this event+user
      const { data: rows } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .limit(1);
      setGoing((rows?.length ?? 0) > 0);

      // Fetch current server count
      const { data: cntRows } = await supabase
        .from('event_counts')
        .select('going_count')
        .eq('event_id', eventId)
        .limit(1);
      if (cntRows && cntRows[0]) setCount(cntRows[0].going_count as number);
    })();
  }, [userId, eventId]);

  async function toggle() {
    if (!userId) {
      alert('Log ind for at deltage.');
      return;
    }
    setBusy(true);
    try {
      if (!going) {
        // ensure single row for (event_id, user_id)
        await supabase.from('rsvps').delete().match({ event_id: eventId, user_id: userId });
        const { error } = await supabase.from('rsvps').insert({ event_id: eventId, user_id: userId });
        if (!error) {
          setGoing(true);
        }
      } else {
        await supabase.from('rsvps').delete().match({ event_id: eventId, user_id: userId });
        setGoing(false);
      }
      // refresh server count after write
      const { data: cntRows } = await supabase
        .from('event_counts')
        .select('going_count')
        .eq('event_id', eventId)
        .limit(1);
      if (cntRows && cntRows[0]) setCount(cntRows[0].going_count as number);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggle}
        disabled={busy}
        className={
          going
            ? 'inline-flex items-center rounded-full bg-gray-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-500'
            : 'inline-flex items-center rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-500'
        }
      >
        {busy ? 'Arbejder…' : going ? 'Deltager ikke' : 'Deltager'}
      </button>
      <span className="text-sm text-white/80">{count} tilmeldte</span>
    </div>
  );
}
