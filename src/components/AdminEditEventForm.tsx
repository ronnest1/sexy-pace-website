import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  lat: number;
  lng: number;
  address_text: string | null;
  image_url: string | null;
  hidden: boolean | null;
};

export default function AdminEditEventForm() {
  const eventId = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('edit');
    } catch {
      return null;
    }
  }, []);

  const [row, setRow] = useState<EventRow | null>(null);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [addressText, setAddressText] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,description,starts_at,lat,lng,address_text,image_url,hidden')
        .eq('id', eventId)
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        setRow(data as EventRow);
        setTitle(data.title || '');
        setDescription(data.description || '');
        try {
          const dt = new Date(data.starts_at);
          const local = new Date(dt.getTime() - dt.getTimezoneOffset()*60000) // to local ISO without Z
            .toISOString().slice(0,16);
          setStartsAt(local);
        } catch {
          setStartsAt('');
        }
        setLat(String(data.lat ?? ''));
        setLng(String(data.lng ?? ''));
        setAddressText(data.address_text || '');
        setHidden(!!data.hidden);
      }
    })();
  }, [eventId]);

  if (!eventId) return null;

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!eventId) return;
    setBusy(true); setError(null);
    try {
      let image_url = row?.image_url ?? null;
      if (file) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `event_${eventId}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('event-images').upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('event-images').getPublicUrl(path);
        image_url = data.publicUrl;
      }
      const starts_at = startsAt ? new Date(startsAt).toISOString() : null;
      const { error: updErr } = await supabase
        .from('events')
        .update({
          title,
          description: description || null,
          starts_at,
          lat: lat ? Number(lat) : null,
          lng: lng ? Number(lng) : null,
          address_text: addressText || null,
          image_url,
          hidden
        })
        .eq('id', eventId);
      if (updErr) throw updErr;
      alert('Gemt');
    } catch (err: any) {
      setError(err?.message || 'Noget gik galt');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    if (!confirm('Slet dette event?')) return;
    await supabase.from('events').delete().eq('id', eventId);
    window.location.href = '/social-events/admin';
  }

  return (
    <form onSubmit={save} className="mt-6 flex max-w-2xl flex-col gap-6 rounded-xl border border-gray-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
      <h2 className="font-display text-2xl font-bold">Rediger event</h2>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Titel</label>
        <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" value={title} onChange={e=>setTitle(e.target.value)} required />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Dato & tidspunkt</label>
        <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">Lat</label>
          <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" value={lat} onChange={e=>setLat(e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">Lng</label>
          <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" value={lng} onChange={e=>setLng(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Adresse (tekst)</label>
        <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" value={addressText} onChange={e=>setAddressText(e.target.value)} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Beskrivelse</label>
        <textarea className="min-h-28 w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-semibold text-gray-900">Nyt billede (valgfrit)</label>
          <input className="block w-full cursor-pointer rounded-lg border border-dashed border-gray-300 bg-white px-4 py-2 text-sm" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
        </div>
        <label className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-800">
          <input className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" type="checkbox" checked={hidden} onChange={e=>setHidden(e.target.checked)} /> Skjul event
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={busy} className="rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-pink-500 disabled:opacity-60">
          {busy ? 'Gemmer…' : 'Gem ændringer'}
        </button>
        <button type="button" onClick={handleDelete} className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-500">Slet</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
