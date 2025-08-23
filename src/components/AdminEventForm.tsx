import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminEventForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(''); // datetime-local
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [addressText, setAddressText] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);

    let image_url: string | null = null;

    try {
      if (file) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `event_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('event-images').upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('event-images').getPublicUrl(path);
        image_url = data.publicUrl;
      }

      const starts_at = new Date(startsAt).toISOString();
      const { error: insErr } = await supabase.from('events').insert({
        title,
        description,
        starts_at,
        lat: Number(lat),
        lng: Number(lng),
        address_text: addressText,
        image_url
      });
      if (insErr) throw insErr;

      setTitle(''); setDescription(''); setStartsAt('');
      setLat(''); setLng(''); setAddressText(''); setFile(null);
      onCreated();
      alert('Event oprettet!');
    } catch (err: any) {
      setError(err.message || 'Noget gik galt');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6 rounded-xl border border-gray-200/70 bg-white/70 p-6 shadow-sm backdrop-blur">
      <h2 className="font-display text-2xl font-bold">Opret event</h2>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Titel</label>
        <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" value={title} onChange={e=>setTitle(e.target.value)} required />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Dato & tidspunkt</label>
        <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">Lat</label>
          <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" placeholder="55.6761" value={lat} onChange={e=>setLat(e.target.value)} required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">Lng</label>
          <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" placeholder="12.5683" value={lng} onChange={e=>setLng(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Adresse (tekst)</label>
        <input className="w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" placeholder="Fælledparken, København" value={addressText} onChange={e=>setAddressText(e.target.value)} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Beskrivelse</label>
        <textarea className="min-h-28 w-full rounded-lg bg-slate-200 px-4 py-2 text-lg outline-none ring-pink-500 focus:ring-2" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">Billede (valgfrit)</label>
        <input className="block w-full cursor-pointer rounded-lg border border-dashed border-gray-300 bg-white px-4 py-2 text-sm" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={busy} className="rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-pink-500 disabled:opacity-60">
          {busy ? 'Gemmer…' : 'Opret event'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
