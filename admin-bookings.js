import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Proste zabezpieczenie uwierzytelniania administratora przez nagłówek
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Brak uprawnień. Zaloguj się jako administrator.' });
  }

  // Pobieranie listy zgłoszeń wraz z danymi klientów i zwierząt
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (full_name, phone, email),
          pets (pet_name, pet_type, safety_info)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ bookings: data });
    } catch (error) {
      return res.status(500).json({ error: 'Nie udało się pobrać zgłoszeń.' });
    }
  }

  // Aktualizacja statusu zgłoszenia
  if (req.method === 'PATCH') {
    try {
      const { bookingId, newStatus } = req.body;
      const allowedStatuses = ['NOWE', 'DO KONTAKTU', 'PRZYJĘTE', 'W TRAKCIE OPIEKI', 'ZAKOŃCZONE', 'ODRZUCONE'];

      if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ error: 'Nieprawidłowy status zgłoszenia.' });
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)
        .select();

      if (error) throw error;
      return res.status(200).json({ success: true, updated: data });
    } catch (error) {
      return res.status(500).json({ error: 'Nie udało się zaktualizować statusu.' });
    }
  }

  return res.status(405).json({ error: 'Metoda niedozwolona' });
}