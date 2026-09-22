import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  try {
    const { fullName, phone, email, petName, petType, safetyInfo, serviceType, dateFrom, dateTo, totalPrice, notes } = req.body;

    // 1. Zapis klienta
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([{ full_name: fullName, phone, email }])
      .select()
      .single();

    if (clientError) throw clientError;

    // 2. Zapis zwierzęcia
    const { data: petData, error: petError } = await supabase
      .from('pets')
      .insert([{ client_id: clientData.id, pet_name: petName, pet_type: petType, safety_info: safetyInfo }])
      .select()
      .single();

    if (petError) throw petError;

    // 3. Zapis zgłoszenia (rezerwacji) ze statusem NOWE
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        client_id: clientData.id,
        pet_id: petData.id,
        service_type: serviceType,
        date_from: dateFrom,
        date_to: dateTo,
        total_price: totalPrice,
        notes,
        status: 'NOWE'
      }])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 4. Bezpieczna wysyłka powiadomienia na Telegram (zmienne środowiskowe serwera)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (telegramToken && chatId) {
      const message = `🚨 NOWE ZGŁOSZENIE (Oaza Spokoju)\n\n` +
        `👤 Klient: ${fullName}\n` +
        `📞 Tel: ${phone}\n` +
        `🐾 Zwierzę: ${petName} (${petType || 'brak'})\n` +
        `📋 Usługa: ${serviceType}\n` +
        `📅 Termin: ${dateFrom} do ${dateTo}\n` +
        `💰 Cena: ${totalPrice} PLN\n` +
        `⚠️ Bezpieczeństwo: ${safetyInfo || 'brak'}\n` +
        `📝 Uwagi: ${notes || 'brak'}`;

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Zgłoszenie zostało wysłane. Otrzymaliśmy Twoje zgłoszenie. Skontaktujemy się z Tobą w celu potwierdzenia terminu. Wysłanie zgłoszenia nie jest jeszcze rezerwacją.',
      bookingId: bookingData.booking_uuid
    });

  } catch (error) {
    console.error('Błąd zapisu zgłoszenia:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas przetwarzania zgłoszenia.' });
  }
}