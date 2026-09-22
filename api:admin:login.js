// Przykład bezpiecznej weryfikacji logowania po stronie serwera
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { username, password } = req.body;
  
  // Weryfikacja z danymi w bazie lub zmiennych środowiskowych
  const adminUser = process.env.ADMIN_USER; // np. "PaniEwa"
  const adminHash = process.env.ADMIN_PASSWORD_HASH; // Zaszyfrowane hasło

  if (username !== adminUser || !(await bcrypt.compare(password, adminHash))) {
    // Rejestracja próby intruza (opcjonalnie do logów)
    return res.status(401).json({ error: "OSTRZEŻENIE: Nieautoryzowany dostęp zabroniony. Próba została zarejestrowana." });
  }

  // Sukces: ustawienie bezpiecznego ciasteczka sesyjnego HttpOnly
  res.setHeader('Set-Cookie', 'admin_session=authenticated; HttpOnly; Secure; SameSite=Strict; Path=/;');
  return res.status(200).json({ success: true, message: "Zalogowano pomyślnie do panelu Pani Ewy." });
}