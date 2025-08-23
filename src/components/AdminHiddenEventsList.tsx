import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Row = { id: string; title: string; starts_at: string; hidden: boolean | null };

export default function AdminHiddenEventsList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('events')
      .select('id,title,starts_at,hidden')
      .eq('hidden', true)
      .order('starts_at');
    setRows(data || []);
  }

  useEffect(() => { load(); }, []);

  async function showEvent(id: string) {
    setBusyId(id);
    await supabase.from('events').update({ hidden: false }).eq('id', id);
    setBusyId(null);
    load();
  }

  if (!rows.length) return <p className="text-gray-600">Ingen skjulte events.</p>;
  return (
    <ul className="grid gap-3">
      {rows.map(r => (
        <li key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-white/70 p-4 shadow-sm backdrop-blur">
          <div>
            <div className="font-semibold">{r.title}</div>
            <div className="text-sm text-gray-600">{new Date(r.starts_at).toLocaleString('da-DK')} <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Skjult</span></div>
          </div>
          <div className="flex gap-2">
            <a className="rounded-full border border-pink-600 px-3 py-1 text-sm font-medium text-pink-600 transition hover:bg-pink-50" href={`/social-events/admin?edit=${encodeURIComponent(r.id)}`}>Rediger</a>
            <button disabled={busyId===r.id} className="rounded-full border border-gray-400 px-3 py-1 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-60" onClick={()=>showEvent(r.id)}>{busyId===r.id ? '…' : 'Vis'}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
