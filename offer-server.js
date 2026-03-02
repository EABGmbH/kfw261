import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const PORT = Number(process.env.PORT || 3100);

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

const OFFER_FROM_EMAIL = process.env.OFFER_FROM_EMAIL || SMTP_USER;
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || SMTP_USER;

function getRequiredField(payload, key) {
  const value = payload && Object.prototype.hasOwnProperty.call(payload, key) ? String(payload[key] || '').trim() : '';
  return value;
}

function safe(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function parsePayload(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function createMailText(data, pdfName) {
  const lueftungArten = Array.isArray(data.lueftungArten) ? data.lueftungArten.join(', ') : '';

  return [
    'Neue Angebotsanfrage',
    '',
    'Antragsteller',
    `Firma: ${safe(data.firma) || '-'}`,
    `Vorname: ${safe(data.vorname)}`,
    `Nachname: ${safe(data.nachname)}`,
    `Straße: ${safe(data.strasse)}`,
    `Hausnummer: ${safe(data.hausnummer)}`,
    `PLZ: ${safe(data.plz)}`,
    `Ort: ${safe(data.ort)}`,
    `E-Mail: ${safe(data.email)}`,
    `Handy: ${safe(data.handy)}`,
    '',
    'Objekt',
    `Adresse identisch: ${safe(data.adresseIdentisch)}`,
    `Investitionsstraße: ${safe(data.investStrasse) || '-'}`,
    `Investitions-Hausnr.: ${safe(data.investHausnummer) || '-'}`,
    `Investitions-PLZ: ${safe(data.investPlz) || '-'}`,
    `Investitions-Ort: ${safe(data.investOrt) || '-'}`,
    '',
    'Technik',
    `Lüftung geplant: ${safe(data.lueftungGeplant)}`,
    `Lüftungstyp(en): ${safe(lueftungArten) || '-'}`,
    `PV geplant: ${safe(data.pvGeplant)}`,
    `PV kWp: ${safe(data.pvKwp) || '-'}`,
    `Speicher geplant: ${safe(data.speicherGeplant)}`,
    `Speicher kWh: ${safe(data.speicherKwh) || '-'}`,
    `Eingabeplan PDF: ${safe(pdfName) || 'nicht hochgeladen'}`,
    '',
    'Abschluss',
    `Ort, Datum: ${safe(data.ortDatum) || '-'}`,
    `Unterschrift: ${safe(data.unterschrift) || '-'}`,
    '',
    `Notizen: ${safe(data.notizen) || '-'}`
  ].join('\n');
}

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !COMPANY_EMAIL) {
  console.warn('SMTP-Konfiguration unvollständig. Bitte .env setzen (SMTP_HOST, SMTP_USER, SMTP_PASS, COMPANY_EMAIL).');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/offer-request', upload.single('eingabeplanPdf'), async (req, res) => {
  try {
    const data = parsePayload(req.body?.payload);

    const required = ['vorname', 'nachname', 'strasse', 'hausnummer', 'plz', 'ort', 'email', 'handy'];
    for (const field of required) {
      if (!getRequiredField(data, field)) {
        return res.status(400).json({ ok: false, error: `Pflichtfeld fehlt: ${field}` });
      }
    }

    const fromAddress = OFFER_FROM_EMAIL || SMTP_USER;
    const replyTo = safe(data.email);
    const fullName = `${safe(data.vorname)} ${safe(data.nachname)}`.trim();
    const pdfName = req.file ? req.file.originalname : '';

    const attachments = req.file
      ? [{ filename: req.file.originalname || 'eingabeplan.pdf', content: req.file.buffer, contentType: req.file.mimetype || 'application/pdf' }]
      : [];

    const subject = `Neue Angebotsanfrage von ${fullName || 'Unbekannt'}`;
    const text = createMailText(data, pdfName);

    await transporter.sendMail({
      from: fromAddress,
      to: COMPANY_EMAIL,
      replyTo: replyTo || undefined,
      subject,
      text,
      attachments
    });

    await transporter.sendMail({
      from: fromAddress,
      to: safe(data.email),
      subject: 'Bestätigung: Ihre Angebotsanfrage ist eingegangen',
      text: `Guten Tag ${fullName || ''},\n\nvielen Dank für Ihre Anfrage. Wir haben Ihre Angaben erhalten und melden uns zeitnah bei Ihnen.\n\nViele Grüße\nEnergy Advice Bavaria`
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Fehler beim Senden der Anfrage:', error);
    return res.status(500).json({ ok: false, error: 'Versand fehlgeschlagen' });
  }
});

app.listen(PORT, () => {
  console.log(`Offer API läuft auf http://localhost:${PORT}`);
});
