<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

function safe_text($value) {
    return trim(preg_replace('/[\r\n]+/', ' ', (string)$value));
}

function parse_payload() {
    if (!isset($_POST['payload'])) {
        return [];
    }

    $decoded = json_decode($_POST['payload'], true);
    if (!is_array($decoded)) {
        return [];
    }

    return $decoded;
}

function json_error($status, $message) {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function build_mail($to, $subject, $text, $from, $replyTo = '', $attachment = null) {
    $boundary = '=_Part_' . md5((string)microtime(true));

    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'From: ' . $from;
    if (!empty($replyTo)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';

    $body = '';
    $body .= '--' . $boundary . "\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $text . "\r\n";

    if (is_array($attachment) && !empty($attachment['tmp_name']) && is_uploaded_file($attachment['tmp_name'])) {
        $filename = isset($attachment['name']) ? basename($attachment['name']) : 'eingabeplan.pdf';
        $mimeType = !empty($attachment['type']) ? $attachment['type'] : 'application/pdf';
        $content = file_get_contents($attachment['tmp_name']);

        if ($content !== false) {
            $body .= '--' . $boundary . "\r\n";
            $body .= 'Content-Type: ' . $mimeType . '; name="' . $filename . '"' . "\r\n";
            $body .= 'Content-Transfer-Encoding: base64' . "\r\n";
            $body .= 'Content-Disposition: attachment; filename="' . $filename . '"' . "\r\n\r\n";
            $body .= chunk_split(base64_encode($content));
            $body .= "\r\n";
        }
    }

    $body .= '--' . $boundary . "--\r\n";

    $additionalParams = '-f ' . $from;
    return mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), $additionalParams);
}

$data = parse_payload();
$required = ['vorname', 'nachname', 'strasse', 'hausnummer', 'plz', 'ort', 'email', 'handy'];

foreach ($required as $field) {
    if (empty(trim((string)($data[$field] ?? '')))) {
        json_error(400, 'Pflichtfeld fehlt: ' . $field);
    }
}

$companyMail = 'anfrage@energy-advice-bavaria.de';
$fromMail = 'anfrage@energy-advice-bavaria.de';
$customerMail = safe_text($data['email'] ?? '');

if (!filter_var($customerMail, FILTER_VALIDATE_EMAIL)) {
    json_error(400, 'Ungültige E-Mail');
}

$fullName = trim(safe_text($data['vorname'] ?? '') . ' ' . safe_text($data['nachname'] ?? ''));
$lueftungArten = '-';
if (isset($data['lueftungArten']) && is_array($data['lueftungArten']) && count($data['lueftungArten']) > 0) {
    $lueftungArten = implode(', ', array_map('safe_text', $data['lueftungArten']));
}

$pdfName = 'nicht hochgeladen';
if (isset($_FILES['eingabeplanPdf']) && is_array($_FILES['eingabeplanPdf']) && !empty($_FILES['eingabeplanPdf']['name'])) {
    if (isset($_FILES['eingabeplanPdf']['error']) && (int)$_FILES['eingabeplanPdf']['error'] !== UPLOAD_ERR_OK) {
        if ((int)$_FILES['eingabeplanPdf']['error'] === UPLOAD_ERR_INI_SIZE || (int)$_FILES['eingabeplanPdf']['error'] === UPLOAD_ERR_FORM_SIZE) {
            json_error(400, 'Die hochgeladene PDF ist zu groß.');
        }
        json_error(400, 'PDF-Upload fehlgeschlagen (Fehlercode ' . (int)$_FILES['eingabeplanPdf']['error'] . ').');
    }
    $pdfName = basename((string)$_FILES['eingabeplanPdf']['name']);
}

$text = "Neue Angebotsanfrage\n\n";
$text .= "Antragsteller\n";
$text .= "Firma: " . safe_text($data['firma'] ?? '-') . "\n";
$text .= "Vorname: " . safe_text($data['vorname'] ?? '') . "\n";
$text .= "Nachname: " . safe_text($data['nachname'] ?? '') . "\n";
$text .= "Straße: " . safe_text($data['strasse'] ?? '') . "\n";
$text .= "Hausnummer: " . safe_text($data['hausnummer'] ?? '') . "\n";
$text .= "PLZ: " . safe_text($data['plz'] ?? '') . "\n";
$text .= "Ort: " . safe_text($data['ort'] ?? '') . "\n";
$text .= "E-Mail: " . $customerMail . "\n";
$text .= "Handy: " . safe_text($data['handy'] ?? '') . "\n\n";
$text .= "Objekt\n";
$text .= "Adresse identisch: " . safe_text($data['adresseIdentisch'] ?? '') . "\n";
$text .= "Investitionsstraße: " . safe_text($data['investStrasse'] ?? '-') . "\n";
$text .= "Investitions-Hausnr.: " . safe_text($data['investHausnummer'] ?? '-') . "\n";
$text .= "Investitions-PLZ: " . safe_text($data['investPlz'] ?? '-') . "\n";
$text .= "Investitions-Ort: " . safe_text($data['investOrt'] ?? '-') . "\n\n";
$text .= "Technik\n";
$text .= "Lüftung geplant: " . safe_text($data['lueftungGeplant'] ?? '') . "\n";
$text .= "Lüftungstyp(en): " . $lueftungArten . "\n";
$text .= "PV geplant: " . safe_text($data['pvGeplant'] ?? '') . "\n";
$text .= "PV kWp: " . safe_text($data['pvKwp'] ?? '-') . "\n";
$text .= "Speicher geplant: " . safe_text($data['speicherGeplant'] ?? '') . "\n";
$text .= "Speicher kWh: " . safe_text($data['speicherKwh'] ?? '-') . "\n";
$text .= "Eingabeplan PDF: " . $pdfName . "\n\n";
$text .= "Abschluss\n";
$text .= "Ort, Datum: " . safe_text($data['ortDatum'] ?? '-') . "\n";
$text .= "Unterschrift: " . safe_text($data['unterschrift'] ?? '-') . "\n\n";
$text .= "Notizen: " . safe_text($data['notizen'] ?? '-') . "\n";

$internalSent = build_mail(
    $companyMail,
    'Neue Angebotsanfrage von ' . ($fullName !== '' ? $fullName : 'Unbekannt'),
    $text,
    $fromMail,
    $customerMail,
    $_FILES['eingabeplanPdf'] ?? null
);

if (!$internalSent) {
    json_error(500, 'Interner Versand fehlgeschlagen (mail() wurde abgelehnt).');
}

$confirmationText = "Guten Tag " . ($fullName !== '' ? $fullName : '') . ",\n\n";
$confirmationText .= "vielen Dank für Ihre Anfrage. Wir haben Ihre Angaben erhalten und melden uns zeitnah bei Ihnen.\n\n";
$confirmationText .= "Viele Grüße\nEnergy Advice Bavaria";

$customerSent = build_mail(
    $customerMail,
    'Bestätigung: Ihre Angebotsanfrage ist eingegangen',
    $confirmationText,
    $fromMail,
    ''
);

if (!$customerSent) {
    echo json_encode(['ok' => true, 'warning' => 'Interne Mail gesendet, Bestätigung an Kundenadresse konnte nicht versendet werden.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
