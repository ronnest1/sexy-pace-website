import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Row = { id: string; title: string; starts_at: string };

export default function AdminRecentEvents() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id,title,starts_at')
        .order('created_at', { ascending: false });
      setRows(data || []);
    })();
  }, []);
  return (
    <ul>
      {rows.map(r => (
        <li key={r.id}>{r.title} — {new Date(r.starts_at).toLocaleString('da-DK')}</li>
      ))}
    </ul>
  );
}
