(function () {
    function byId(id) { return document.getElementById(id); }

    function getStatusBox() { return byId('offer-global-status'); }

    function showStatus(message, success) {
        var box = getStatusBox();
        if (!box) return;
        box.className = success ? 'offer-status success' : 'offer-status error';
        box.textContent = message;
    }

    function clearStatus() {
        var box = getStatusBox();
        if (!box) return;
        box.className = 'offer-status';
        box.textContent = '';
    }

    function getStep() {
        var value = parseInt(document.body.getAttribute('data-offer-step') || '1', 10);
        if (isNaN(value) || value < 1) return 1;
        if (value > 3) return 3;
        return value;
    }

    function setStep(step) {
        var steps = document.querySelectorAll('.offer-step');
        var progress = document.querySelectorAll('.offer-progress-step');
        var prevBtn = byId('prev-btn');
        var nextBtn = byId('next-btn');
        var mailBtn = byId('mail-btn');
        var i;

        document.body.setAttribute('data-offer-step', String(step));
        clearStatus();

        for (i = 0; i < steps.length; i += 1) {
            var section = steps[i];
            var sectionStep = Number(section.getAttribute('data-step'));
            section.classList.toggle('active', sectionStep === step);
        }

        for (i = 0; i < progress.length; i += 1) {
            var progressItem = progress[i];
            var progressStep = Number(progressItem.getAttribute('data-step'));
            progressItem.classList.toggle('active', progressStep === step);
            progressItem.classList.toggle('completed', progressStep < step);
        }

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'inline-flex';
        if (nextBtn) nextBtn.style.display = step === 3 ? 'none' : 'inline-flex';
        if (mailBtn) mailBtn.style.display = step === 3 ? 'inline-flex' : 'none';

        if (step === 3) renderInlineSummary();
    }

    function fieldValue(id) {
        var field = byId(id);
        if (!field || typeof field.value === 'undefined' || field.value === null) return '';
        return String(field.value).trim();
    }

    function checkedValue(name) {
        var checked = document.querySelector('input[name="' + name + '"]:checked');
        return checked ? checked.value : '';
    }

    function boolText(value) {
        return value === 'ja' ? 'Ja' : 'Nein';
    }

    function getPdfFile() {
        var input = byId('eingabeplanPdf');
        if (!input || !input.files || input.files.length === 0) return null;
        return input.files[0];
    }

    function validatePdfFile() {
        var pdfFile = getPdfFile();
        if (!pdfFile) return true;

        var fileName = String(pdfFile.name || '').toLowerCase();
        var isPdfByType = pdfFile.type === 'application/pdf';
        var isPdfByName = fileName.endsWith('.pdf');
        if (!isPdfByType && !isPdfByName) {
            showStatus('Bitte laden Sie ausschließlich eine PDF-Datei hoch.', false);
            return false;
        }

        var maxBytes = 10 * 1024 * 1024;
        if (pdfFile.size > maxBytes) {
            showStatus('Die PDF darf maximal 10 MB groß sein.', false);
            return false;
        }

        return true;
    }

    function collectOfferData() {
        var lueftungArten = [];
        if (byId('lueftungZentral') && byId('lueftungZentral').checked) lueftungArten.push('Zentral mit Wärmerückgewinnung');
        if (byId('lueftungDezentral') && byId('lueftungDezentral').checked) lueftungArten.push('Dezentral mit Wärmerückgewinnung');

        return {
            firma: fieldValue('firma'),
            vorname: fieldValue('vorname'),
            nachname: fieldValue('nachname'),
            strasse: fieldValue('strasse'),
            hausnummer: fieldValue('hausnummer'),
            plz: fieldValue('plz'),
            ort: fieldValue('ort'),
            email: fieldValue('email'),
            handy: fieldValue('handy'),
            adresseIdentisch: checkedValue('adresseIdentisch') || 'ja',
            investStrasse: fieldValue('investStrasse'),
            investHausnummer: fieldValue('investHausnummer'),
            investPlz: fieldValue('investPlz'),
            investOrt: fieldValue('investOrt'),
            lueftungGeplant: checkedValue('lueftungGeplant') || 'nein',
            lueftungArten: lueftungArten,
            pvGeplant: checkedValue('pvGeplant') || 'nein',
            pvKwp: fieldValue('pvKwp'),
            speicherGeplant: checkedValue('speicherGeplant') || 'nein',
            speicherKwh: fieldValue('speicherKwh'),
            notizen: fieldValue('notizen'),
            ortDatum: fieldValue('ortDatum'),
            unterschrift: fieldValue('unterschrift')
        };
    }

    function renderInlineSummary() {
        var container = byId('rechner-zusammenfassung');
        if (!container) return;

        var data = collectOfferData();
        var pdfFile = getPdfFile();

        var investitionText = data.adresseIdentisch === 'ja'
            ? 'Investitionsstandort identisch: Ja'
            : 'Investitionsstandort: ' + [data.investStrasse, data.investHausnummer, data.investPlz, data.investOrt].filter(Boolean).join(' ');

        var lueftungTyp = data.lueftungGeplant === 'ja'
            ? (data.lueftungArten.length ? data.lueftungArten.join(', ') : 'Nicht angegeben')
            : '—';

        container.innerHTML = '' +
            '<div class="offer-summary-card">' +
                '<button type="button" class="summary-toggle" aria-expanded="true" aria-controls="summary-content">Zusammenfassung <span>▾</span></button>' +
                '<div class="summary-content" id="summary-content">' +
                    '<p><b>Antragsteller</b><br>' +
                    'Firma: ' + (data.firma || '—') + '<br>' +
                    'Name: ' + [data.vorname, data.nachname].filter(Boolean).join(' ') + '<br>' +
                    'Adresse: ' + [data.strasse, data.hausnummer, data.plz, data.ort].filter(Boolean).join(' ') + '<br>' +
                    'Kontakt: ' + [data.email, data.handy].filter(Boolean).join(' · ') + '</p>' +
                    '<p><b>Objekt</b><br>' + investitionText + '</p>' +
                    '<p><b>Technik</b><br>' +
                    'Lüftungsanlage geplant: ' + boolText(data.lueftungGeplant) + '<br>' +
                    'Lüftungstyp: ' + lueftungTyp + '<br>' +
                    'PV-Anlage geplant: ' + boolText(data.pvGeplant) + (data.pvGeplant === 'ja' ? ' (' + (data.pvKwp || '—') + ' kWp)' : '') + '<br>' +
                    'Batteriespeicher geplant: ' + boolText(data.speicherGeplant) + (data.speicherGeplant === 'ja' ? ' (' + (data.speicherKwh || '—') + ' kWh)' : '') + '<br>' +
                    'Eingabeplan (PDF): ' + (pdfFile ? pdfFile.name : 'Nicht hochgeladen') + '</p>' +
                    '<p><b>Notizen</b><br>' + (data.notizen || 'Keine Notizen') + '</p>' +
                '</div>' +
            '</div>';
    }

    function validateStep1() {
        var requiredIds = ['vorname', 'nachname', 'strasse', 'hausnummer', 'plz', 'ort', 'email', 'handy'];
        var i;

        for (i = 0; i < requiredIds.length; i += 1) {
            if (!fieldValue(requiredIds[i])) {
                showStatus('Bitte füllen Sie alle Pflichtfelder in Schritt 1 aus.', false);
                var field = byId(requiredIds[i]);
                if (field) field.focus();
                return false;
            }
        }

        var emailValue = fieldValue('email');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            showStatus('Bitte geben Sie eine gültige E-Mail-Adresse ein.', false);
            byId('email') && byId('email').focus();
            return false;
        }

        return true;
    }

    function validateStep2() {
        var sameAddress = checkedValue('adresseIdentisch') === 'ja';

        if (!sameAddress) {
            var investRequired = ['investStrasse', 'investHausnummer', 'investPlz', 'investOrt'];
            for (var i = 0; i < investRequired.length; i += 1) {
                if (!fieldValue(investRequired[i])) {
                    showStatus('Bitte füllen Sie die Investitionsanschrift vollständig aus.', false);
                    byId(investRequired[i]) && byId(investRequired[i]).focus();
                    return false;
                }
            }
        }

        if (!checkedValue('lueftungGeplant')) {
            showStatus('Bitte wählen Sie aus, ob eine Lüftungsanlage geplant ist.', false);
            return false;
        }

        if (checkedValue('lueftungGeplant') === 'ja') {
            var hasLueftungTyp = (byId('lueftungZentral') && byId('lueftungZentral').checked) || (byId('lueftungDezentral') && byId('lueftungDezentral').checked);
            if (!hasLueftungTyp) {
                showStatus('Bitte wählen Sie mindestens einen Lüftungstyp aus.', false);
                return false;
            }
        }

        if (!checkedValue('pvGeplant')) {
            showStatus('Bitte wählen Sie aus, ob eine PV-Anlage geplant ist.', false);
            return false;
        }

        if (checkedValue('pvGeplant') === 'ja' && !fieldValue('pvKwp')) {
            showStatus('Bitte geben Sie die geplante PV-Leistung in kWp an.', false);
            byId('pvKwp') && byId('pvKwp').focus();
            return false;
        }

        if (!checkedValue('speicherGeplant')) {
            showStatus('Bitte wählen Sie aus, ob ein Batteriespeicher geplant ist.', false);
            return false;
        }

        if (checkedValue('speicherGeplant') === 'ja' && !fieldValue('speicherKwh')) {
            showStatus('Bitte geben Sie die geplante Speicherkapazität in kWh an.', false);
            byId('speicherKwh') && byId('speicherKwh').focus();
            return false;
        }

        if (!validatePdfFile()) return false;

        return true;
    }

    function validateStep3() {
        var bestaetigung = byId('bestaetigung');
        if (!bestaetigung || !bestaetigung.checked) {
            showStatus('Bitte bestätigen Sie die Richtigkeit und Vollständigkeit der Angaben.', false);
            return false;
        }

        return true;
    }

    function toggleConditionalPanels() {
        var sameAddress = checkedValue('adresseIdentisch') === 'ja';
        var investPanel = byId('invest-anschrift');
        if (investPanel) investPanel.classList.toggle('hidden', sameAddress);

        var lueftungJa = checkedValue('lueftungGeplant') === 'ja';
        var lueftungPanel = byId('lueftung-daten');
        if (lueftungPanel) lueftungPanel.classList.toggle('hidden', !lueftungJa);
        if (!lueftungJa) {
            if (byId('lueftungZentral')) byId('lueftungZentral').checked = false;
            if (byId('lueftungDezentral')) byId('lueftungDezentral').checked = false;
        }

        var pvJa = checkedValue('pvGeplant') === 'ja';
        var pvPanel = byId('pv-daten');
        if (pvPanel) pvPanel.classList.toggle('hidden', !pvJa);
        if (!pvJa && byId('pvKwp')) byId('pvKwp').value = '';

        var speicherJa = checkedValue('speicherGeplant') === 'ja';
        var speicherPanel = byId('speicher-daten');
        if (speicherPanel) speicherPanel.classList.toggle('hidden', !speicherJa);
        if (!speicherJa && byId('speicherKwh')) byId('speicherKwh').value = '';
    }

    function updateAutoEndFields() {
        var ortInput = byId('ort');
        var investOrtInput = byId('investOrt');
        var vornameInput = byId('vorname');
        var nachnameInput = byId('nachname');
        var ortDatumInput = byId('ortDatum');
        var unterschriftInput = byId('unterschrift');

        var useInvestOrt = checkedValue('adresseIdentisch') === 'nein';
        var kundenOrt = ortInput && ortInput.value ? String(ortInput.value).trim() : '';
        var investOrt = investOrtInput && investOrtInput.value ? String(investOrtInput.value).trim() : '';
        var finalOrt = useInvestOrt ? (investOrt || kundenOrt) : kundenOrt;

        var vorname = vornameInput && vornameInput.value ? String(vornameInput.value).trim() : '';
        var nachname = nachnameInput && nachnameInput.value ? String(nachnameInput.value).trim() : '';

        var today = new Date();
        var todayText = today.toLocaleDateString('de-DE');
        if (ortDatumInput) ortDatumInput.value = (finalOrt ? (finalOrt + ', ') : '') + todayText;
        if (unterschriftInput) unterschriftInput.value = [vorname, nachname].filter(Boolean).join(' ');
    }

    function getScriptBaseUrl() {
        var script = document.querySelector('script[src$="angebot.js"]');
        if (script && script.src) {
            try {
                return new URL('.', script.src).toString();
            } catch (_error) {
                return '';
            }
        }

        try {
            return new URL('.', window.location.href).toString();
        } catch (_error) {
            return '';
        }
    }

    function toBaseUrl(path) {
        var baseUrl = getScriptBaseUrl();
        if (!baseUrl) return path;
        try {
            return new URL(path, baseUrl).toString();
        } catch (_error) {
            return path;
        }
    }

    function getOfferApiEndpoint() {
        var meta = document.querySelector('meta[name="offer-api-base"]');
        var base = meta && meta.content ? String(meta.content).trim() : '';
        if (!base) {
            var host = window.location && window.location.hostname ? window.location.hostname : '';
            if (host === 'localhost' || host === '127.0.0.1') {
                return 'http://localhost:3100/api/offer-request';
            }
            return toBaseUrl('api/offer-request.php');
        }
        return base.replace(/\/$/, '') + '/api/offer-request.php';
    }

    function isLocalHost() {
        var host = window.location && window.location.hostname ? window.location.hostname : '';
        return host === 'localhost' || host === '127.0.0.1';
    }

    function offerNextStep() {
        var step = getStep();

        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;

        setStep(Math.min(3, step + 1));
    }

    function offerPrevStep() {
        var step = getStep();
        setStep(Math.max(1, step - 1));
    }

    async function offerSubmit() {
        if (!validateStep1() || !validateStep2() || !validateStep3()) {
            return;
        }

        clearStatus();

        var mailBtn = byId('mail-btn');
        var originalText = mailBtn ? mailBtn.textContent : 'Angebot anfordern';

        if (mailBtn) {
            mailBtn.disabled = true;
            mailBtn.textContent = 'Wird gesendet...';
        }

        try {
            var data = collectOfferData();
            var endpoint = getOfferApiEndpoint();
            var formData = new FormData();
            formData.append('payload', JSON.stringify(data));

            var pdfFile = getPdfFile();
            if (pdfFile) formData.append('eingabeplanPdf', pdfFile);

            var response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok && !isLocalHost()) {
                response = await fetch(toBaseUrl('offer-request.php'), {
                    method: 'POST',
                    body: formData
                });
            }

            var responseData = null;
            try {
                responseData = await response.json();
            } catch (_err) {
                responseData = null;
            }

            if (!response.ok || !responseData || responseData.ok !== true) {
                var backendMessage = responseData && responseData.error ? String(responseData.error) : ('Serverfehler: ' + response.status);
                throw new Error(backendMessage);
            }

            showStatus('Vielen Dank. Ihre Anfrage wurde gesendet. Sie erhalten in Kürze eine E-Mail-Bestätigung.', true);
        } catch (error) {
            var message = error && error.message ? error.message : 'Die Anfrage konnte nicht gesendet werden. Bitte später erneut versuchen.';
            showStatus(message, false);
            console.error(error);
        } finally {
            if (mailBtn) {
                mailBtn.disabled = false;
                mailBtn.textContent = originalText;
            }
        }
    }

    window.offerNextStep = offerNextStep;
    window.offerPrevStep = offerPrevStep;
    window.offerSubmit = offerSubmit;

    var watchIds = [
        'firma', 'vorname', 'nachname', 'strasse', 'hausnummer', 'plz', 'ort', 'email', 'handy',
        'investStrasse', 'investHausnummer', 'investPlz', 'investOrt',
        'pvKwp', 'speicherKwh', 'notizen'
    ];

    for (var i = 0; i < watchIds.length; i += 1) {
        var field = byId(watchIds[i]);
        if (!field) continue;
        field.addEventListener('input', function () {
            updateAutoEndFields();
            if (getStep() === 3) renderInlineSummary();
        });
    }

    var radios = document.querySelectorAll('input[name="adresseIdentisch"], input[name="lueftungGeplant"], input[name="pvGeplant"], input[name="speicherGeplant"]');
    for (var r = 0; r < radios.length; r += 1) {
        radios[r].addEventListener('change', function () {
            toggleConditionalPanels();
            updateAutoEndFields();
            if (getStep() === 3) renderInlineSummary();
        });
    }

    var lueftungChecks = [byId('lueftungZentral'), byId('lueftungDezentral')];
    for (var c = 0; c < lueftungChecks.length; c += 1) {
        if (!lueftungChecks[c]) continue;
        lueftungChecks[c].addEventListener('change', function () {
            if (getStep() === 3) renderInlineSummary();
        });
    }

    var eingabeplanPdf = byId('eingabeplanPdf');
    if (eingabeplanPdf) {
        eingabeplanPdf.addEventListener('change', function () {
            validatePdfFile();
            if (getStep() === 3) renderInlineSummary();
        });
    }

    var form = byId('angebot-form');
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
        });
    }

    setStep(getStep());
    toggleConditionalPanels();
    updateAutoEndFields();
    renderInlineSummary();
})();
