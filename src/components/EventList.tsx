import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import RsvpButton from './RsvpButton';
import fallbackImg from '@/assets/images/authors/social-run.jpg';

type Event = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  lat: number;
  lng: number;
  address_text: string | null;
  image_url: string | null;
};

function toUrl(mod: any): string {
  // Vite image imports can be either string or an object with .src in some pipelines
  return typeof mod === 'string' ? mod : (mod?.src ?? '');
}

function EventCard({ e, count }: { e: Event; count: number }) {
  const [bgUrl, setBgUrl] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const fallback = toUrl(fallbackImg);
    const primary = e.image_url || '';
    if (!primary) {
      setBgUrl(fallback);
      return;
    }
    const img = new Image();
    img.onload = () => setBgUrl(primary);
    img.onerror = () => setBgUrl(fallback);
    img.src = primary;
    // Cleanup: revoke object URLs if used (not necessary here)
  }, [e.image_url]);

  useEffect(() => {
    // Detect Clerk admin in browser
    const c: any = (globalThis as any).Clerk;
    (async () => {
      try {
        if (c) await c.load?.();
        const u = c?.user;
        setIsAdmin(!!u?.publicMetadata?.admin);
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  return (
    <li
      className="group relative h-72 overflow-hidden rounded-lg bg-neutral-900 text-left md:h-80 lg:h-96"
      style={{
        backgroundImage: `url(${bgUrl || toUrl(fallbackImg)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 group-hover:bg-black/50" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
        <h3 className="text-2xl font-bold">{e.title}</h3>
        <p className="mt-1 text-sm md:text-base font-semibold text-pink-300">
          {new Date(e.starts_at).toLocaleString('da-DK')}
        </p>
        {e.description && (
          <p className="mt-3 max-w-prose text-sm md:text-base text-gray-100/90 line-clamp-3">{e.description}</p>
        )}
        {e.address_text && (
          <p className="mt-2 text-sm text-gray-200/90">{e.address_text}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex items-center rounded-full border border-white/70 px-4 py-1.5 text-sm text-white hover:bg-white/10"
            href={`https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`}
            rel="noopener"
            target="_blank"
          >
            Åbn i Maps
          </a>
          {isAdmin && (
            <a
              className="inline-flex items-center rounded-full border border-white/70 px-4 py-1.5 text-sm text-white hover:bg-white/10"
              href={`/social-events/admin?edit=${encodeURIComponent(e.id)}`}
            >
              Rediger
            </a>
          )}
          <div className="inline-flex">
            <RsvpButton eventId={e.id} initialCount={count} />
          </div>
        </div>
      </div>
    </li>
  );
}

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: evts } = await supabase
        .from('events')
        .select('id,title,description,starts_at,lat,lng,address_text,image_url')
        .or('hidden.is.null,hidden.eq.false')
        .order('starts_at', { ascending: true });
      const ids = (evts || []).map(e => e.id);
      const { data: cnts } = ids.length
        ? await supabase.from('event_counts').select('*').in('event_id', ids)
        : { data: [] as any[] };
      setEvents(evts || []);
      setCounts(Object.fromEntries((cnts || []).map((c: any) => [c.event_id, c.going_count])));
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Henter events…</p>;

  return (
    <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
      {events.map(e => (
        <EventCard key={e.id} e={e} count={counts[e.id] ?? 0} />
      ))}
    </ul>
  );
}
