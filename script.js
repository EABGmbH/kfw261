const gebaeudeartCards = document.querySelectorAll('.option-card');
const gebaeudeDetails = document.getElementById('gebaeudeDetails');
const wohneinheitenInput = document.getElementById('wohneinheiten');
const baujahrInput = document.getElementById('baujahr');
const energieausweisSection = document.getElementById('energieausweisSection');
const klasseHRadios = document.querySelectorAll('input[name="klasseH"]');

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const nextBtn = document.getElementById('nextBtn');
const backToStep1Btn = document.getElementById('backToStep1Btn');
const nextToStep3Btn = document.getElementById('nextToStep3Btn');
const backToStep2Btn = document.getElementById('backToStep2Btn');
const nextToStep4Btn = document.getElementById('nextToStep4Btn');
const backToStep3Btn = document.getElementById('backToStep3Btn');
const kfwForm = document.getElementById('kfwForm');

const progressStep1 = document.getElementById('progressStep1');
const progressStep2 = document.getElementById('progressStep2');
const progressStep3 = document.getElementById('progressStep3');
const progressStep4 = document.getElementById('progressStep4');
const finalResultText = document.getElementById('finalResultText');
const financeSummaryCard = document.getElementById('financeSummaryCard');
const huelleStufeInput = document.getElementById('huelleStufe');
const huelleStageLabel = document.getElementById('huelleStageLabel');
const huelleStageDescription = document.getElementById('huelleStageDescription');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const lueftungQuestionBlock = document.getElementById('lueftungQuestionBlock');
const serielleSanierungQuestionBlock = document.getElementById('serielleSanierungQuestionBlock');

let selectedBuildingType = '';

const KFW261_REFERENZ_ZINS = 2.26;
const INTERHYP_REFERENZ_ZINS = 3.91;
const ZINSVERGLEICH_DARLEHEN = 170000;

const huelleStufen = {
    1: {
        title: 'Stufe 1: Ich will nicht viel machen',
        description: 'Nur kleine Einzelmaßnahmen an der Gebäudehülle. Fokus liegt eher auf minimalem Aufwand als auf Effizienz.'
    },
    2: {
        title: 'Stufe 2: Nur das Nötigste',
        description: 'Ein paar klare Verbesserungen, aber ohne großes Gesamtpaket. Die Hülle wird punktuell besser.'
    },
    3: {
        title: 'Stufe 3: Solider Mittelweg',
        description: 'Mehrere Bauteile werden sinnvoll verbessert. Gute Basis für eine spürbar bessere Effizienz.'
    },
    4: {
        title: 'Stufe 4: Ambitionierte Hüllensanierung',
        description: 'Dämmung, Fenster und Wärmebrücken werden deutlich stärker optimiert. Effizienzsprung wird realistisch.'
    },
    5: {
        title: 'Stufe 5: Sehr konsequente Sanierung',
        description: 'Die Gebäudehülle wird fast durchgehend auf hohes Niveau gebracht. Zielrichtung klar Richtung hoher Effizienz.'
    },
    6: {
        title: 'Stufe 6: Komplettprogramm – brutal effizient',
        description: 'Maximaler Eingriff in die Hülle mit sehr hoher energetischer Qualität. Fokus auf bestmögliche Effizienzstufe.'
    }
};

function clearKlasseHSelection() {
    klasseHRadios.forEach((radio) => {
        radio.checked = false;
        const radioCard = radio.closest('.radio-card');
        if (radioCard) {
            radioCard.classList.remove('selected');
        }
    });
}

function updateKlasseHCardSelection() {
    klasseHRadios.forEach((radio) => {
        const radioCard = radio.closest('.radio-card');
        if (!radioCard) {
            return;
        }

        if (radio.checked) {
            radioCard.classList.add('selected');
        } else {
            radioCard.classList.remove('selected');
        }
    });
}

function updateRadioCardSelectionByName(name) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach((radio) => {
        const radioCard = radio.closest('.radio-card');
        if (!radioCard) {
            return;
        }

        if (radio.checked) {
            radioCard.classList.add('selected');
        } else {
            radioCard.classList.remove('selected');
        }
    });
}

function updateStep2QuestionVisibility() {
    if (!lueftungQuestionBlock || !serielleSanierungQuestionBlock) {
        return;
    }

    const hasHeizungAnswer = Boolean(getCheckedValue('heizungPlan'));
    const hasLueftungAnswer = Boolean(getCheckedValue('lueftungPlan'));

    lueftungQuestionBlock.style.display = hasHeizungAnswer ? 'block' : 'none';
    serielleSanierungQuestionBlock.style.display = hasLueftungAnswer ? 'block' : 'none';
}

function updateEnergieausweisQuestion() {
    const baujahr = Number(baujahrInput.value);

    if (!Number.isFinite(baujahr) || baujahr <= 0) {
        energieausweisSection.style.display = 'none';
        clearKlasseHSelection();
        return;
    }

    if (baujahr > 1957) {
        energieausweisSection.style.display = 'block';
        return;
    }

    energieausweisSection.style.display = 'none';
    clearKlasseHSelection();
}

function setUnitsByBuildingType(card) {
    selectedBuildingType = card.dataset.type;
    const units = card.dataset.units;

    gebaeudeDetails.style.display = 'grid';
    energieausweisSection.style.display = 'none';
    clearKlasseHSelection();

    if (selectedBuildingType === 'mfh') {
        wohneinheitenInput.readOnly = false;
        wohneinheitenInput.value = '';
        wohneinheitenInput.min = '1';
        wohneinheitenInput.placeholder = 'Bitte Anzahl eingeben';
        wohneinheitenInput.focus();
        return;
    }

    wohneinheitenInput.value = units;
    wohneinheitenInput.readOnly = true;
    wohneinheitenInput.min = units;
    wohneinheitenInput.placeholder = '';
}

function getBuildingTypeLabel(type) {
    if (type === 'efh') return 'Einfamilienhaus';
    if (type === 'efh-einlieger') return 'Einfamilienhaus inkl. Einliegerwohnung';
    if (type === 'mfh') return 'Mehrfamilienhaus';
    return '-';
}

function getKlasseHValue() {
    const checked = document.querySelector('input[name="klasseH"]:checked');
    return checked ? checked.value : '';
}

function getCheckedValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

function validateStep1() {
    if (!selectedBuildingType) {
        alert('Bitte wählen Sie zuerst die Gebäudeart.');
        return false;
    }

    const wohneinheiten = Number(wohneinheitenInput.value);
    if (!Number.isFinite(wohneinheiten) || wohneinheiten < 1) {
        alert('Bitte geben Sie eine gültige Anzahl der Wohneinheiten ein.');
        return false;
    }

    const baujahr = Number(baujahrInput.value);
    if (!Number.isFinite(baujahr) || baujahr < 1800 || baujahr > 2100) {
        alert('Bitte geben Sie ein gültiges Baujahr ein.');
        return false;
    }

    if (baujahr > 1957 && !getKlasseHValue()) {
        alert('Bitte beantworten Sie die Frage zum Energieausweis Klasse H.');
        return false;
    }

    return true;
}

function computeWpbStatus() {
    const baujahr = Number(baujahrInput.value);
    const klasseH = getKlasseHValue();

    if (baujahr <= 1957) {
        return {
            hasWpbBonus: true,
            reason: 'Baujahr bis einschließlich 1957'
        };
    }

    if (klasseH === 'ja') {
        return {
            hasWpbBonus: true,
            reason: 'Gültiger Energieausweis mit Klasse H'
        };
    }

    return {
        hasWpbBonus: false,
        reason: 'Keine WPB-Qualifikation aus den eingegebenen Gebäudedaten'
    };
}

function validateStep2() {
    if (!getCheckedValue('heizungPlan')) {
        alert('Bitte wählen Sie aus, welche Heizung Sie planen.');
        return false;
    }

    if (!getCheckedValue('lueftungPlan')) {
        alert('Bitte wählen Sie aus, was Sie bei der Lüftung planen.');
        return false;
    }

    if (!getCheckedValue('serielleSanierungPlan')) {
        alert('Bitte wählen Sie aus, ob eine serielle Sanierung geplant ist.');
        return false;
    }

    return true;
}

function validateStep3() {
    const huelleStufe = Number(huelleStufeInput?.value);
    if (!Number.isFinite(huelleStufe) || huelleStufe < 1 || huelleStufe > 6) {
        alert('Bitte wählen Sie eine gültige Stufe für die Gebäudehülle (1 bis 6).');
        return false;
    }

    return true;
}

function getHeizungPlanLabel(value) {
    const labelMap = {
        waermepumpe: 'Wärmepumpe',
        fernwaerme: 'Fernwärme',
        biomasse: 'Biomasse / Pellet',
        hybrid: 'Hybridlösung',
        unsicher: 'Sonstiges / unsicher'
    };

    return labelMap[value] || '-';
}

function getLueftungPlanLabel(value) {
    const labelMap = {
        ja: 'Ja',
        nein: 'Nein'
    };

    return labelMap[value] || '-';
}

function getSerielleSanierungPlanLabel(value) {
    const labelMap = {
        ja: 'Ja',
        nein: 'Nein'
    };

    return labelMap[value] || '-';
}

function getHuelleStufeData() {
    const stufe = Number(huelleStufeInput?.value) || 3;
    return {
        stufe,
        ...huelleStufen[stufe]
    };
}

function updateHuelleStageDisplay() {
    if (!huelleStufeInput || !huelleStageLabel || !huelleStageDescription) {
        return;
    }

    const huelle = getHuelleStufeData();
    huelleStageLabel.textContent = huelle.title;
    huelleStageDescription.textContent = huelle.description;
}

function getEffizienzhausEinschaetzung() {
    const huelle = getHuelleStufeData();
    let points = huelle.stufe;

    const heizungPlan = getCheckedValue('heizungPlan');
    const lueftungPlan = getCheckedValue('lueftungPlan');

    if (['waermepumpe', 'biomasse', 'fernwaerme'].includes(heizungPlan)) points += 1;
    if (lueftungPlan === 'ja') points += 1;

    let stufe = 'Effizienzhaus 85';
    if (points >= 8) {
        stufe = 'Effizienzhaus 40';
    } else if (points >= 6) {
        stufe = 'Effizienzhaus 55';
    } else if (points >= 4) {
        stufe = 'Effizienzhaus 70';
    }

    const eeKlasseMoeglich = ['waermepumpe', 'biomasse', 'fernwaerme'].includes(heizungPlan) && lueftungPlan === 'ja';

    return {
        stufe,
        eeKlasseMoeglich,
        points
    };
}

function getFoerderDaten(einschaetzung) {
    const baseMap = {
        'Effizienzhaus 40': { percent: 20, maxKredit: 120000, maxZuschuss: 24000 },
        'Effizienzhaus 55': { percent: 15, maxKredit: 120000, maxZuschuss: 18000 },
        'Effizienzhaus 70': { percent: 10, maxKredit: 120000, maxZuschuss: 12000 },
        'Effizienzhaus 85': { percent: 5, maxKredit: 120000, maxZuschuss: 6000 }
    };

    const classMap = {
        'Effizienzhaus 40': { percent: 25, maxKredit: 150000, maxZuschuss: 37500 },
        'Effizienzhaus 55': { percent: 20, maxKredit: 150000, maxZuschuss: 30000 },
        'Effizienzhaus 70': { percent: 15, maxKredit: 150000, maxZuschuss: 22500 },
        'Effizienzhaus 85': { percent: 10, maxKredit: 150000, maxZuschuss: 15000 }
    };

    if (einschaetzung.eeKlasseMoeglich) {
        return {
            ...classMap[einschaetzung.stufe],
            klasse: 'EE-Klasse (ungefähr)'
        };
    }

    return {
        ...baseMap[einschaetzung.stufe],
        klasse: 'Standard'
    };
}

function isWpbBonusFoerderfaehig(einschaetzung) {
    const stufe = einschaetzung?.stufe;

    if (stufe === 'Effizienzhaus 40' || stufe === 'Effizienzhaus 55') {
        return true;
    }

    return stufe === 'Effizienzhaus 70' && Boolean(einschaetzung?.eeKlasseMoeglich);
}

function isSerielleSanierungBonusFoerderfaehig(einschaetzung) {
    return ['Effizienzhaus 40', 'Effizienzhaus 55'].includes(einschaetzung?.stufe);
}

function getBonusBerechnung() {
    const einschaetzung = getEffizienzhausEinschaetzung();
    const wpb = computeWpbStatus();
    const serielleSanierungGeplant = getCheckedValue('serielleSanierungPlan') === 'ja';
    const wpbFoerderfaehigByStufe = isWpbBonusFoerderfaehig(einschaetzung);
    const serialFoerderfaehigByStufe = isSerielleSanierungBonusFoerderfaehig(einschaetzung);

    const wpbBonusRoh = (wpb.hasWpbBonus && wpbFoerderfaehigByStufe) ? 10 : 0;
    const serialBonusRoh = (serielleSanierungGeplant && serialFoerderfaehigByStufe) ? 15 : 0;
    const maxKombiBonus = 20;

    const wpbBonusEffektiv = wpbBonusRoh;
    const serialBonusEffektiv = Math.max(0, Math.min(serialBonusRoh, maxKombiBonus - wpbBonusEffektiv));
    const bonusGesamtEffektiv = wpbBonusEffektiv + serialBonusEffektiv;

    return {
        wpb,
        einschaetzung,
        serielleSanierungGeplant,
        wpbFoerderfaehigByStufe,
        serialFoerderfaehigByStufe,
        wpbBonusRoh,
        serialBonusRoh,
        wpbBonusEffektiv,
        serialBonusEffektiv,
        bonusGesamtEffektiv,
        istGedeckelt: (wpbBonusRoh + serialBonusRoh) > maxKombiBonus
    };
}

function formatEuro(value) {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function formatPercent(value) {
    return `${value.toFixed(2).replace('.', ',')} %`;
}

function renderZinsvergleichSection() {
    const kfwRateElement = document.getElementById('zinsKfw261Rate');
    const marketRateElement = document.getElementById('zinsInterhypRate');
    const vorteilPercentElement = document.getElementById('zinsVorteilPercent');
    const vorteilTextElement = document.getElementById('zinsVorteilText');
    const standElement = document.getElementById('zinsQuelleStand');

    if (!kfwRateElement || !marketRateElement || !vorteilPercentElement || !vorteilTextElement || !standElement) {
        return;
    }

    const zinsVorteil = Math.max(0, INTERHYP_REFERENZ_ZINS - KFW261_REFERENZ_ZINS);
    const jahresErsparnis = ZINSVERGLEICH_DARLEHEN * (zinsVorteil / 100);
    const now = new Date();
    const stand = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(now);

    kfwRateElement.textContent = formatPercent(KFW261_REFERENZ_ZINS);
    marketRateElement.textContent = formatPercent(INTERHYP_REFERENZ_ZINS);
    vorteilPercentElement.textContent = `Ihr Vorteil: ${formatPercent(zinsVorteil)} günstigerer Zins!`;
    vorteilTextElement.textContent = `Bei ${formatEuro(ZINSVERGLEICH_DARLEHEN)} Darlehenssumme sparen Sie ca. ${formatEuro(jahresErsparnis)} Zinskosten pro Jahr.`;
    standElement.textContent = `${stand.charAt(0).toUpperCase()}${stand.slice(1)}`;
}

function renderFinanceSummary() {
    const wohneinheiten = Number(wohneinheitenInput.value) || 1;
    const einschaetzung = getEffizienzhausEinschaetzung();
    const foerder = getFoerderDaten(einschaetzung);
    const bonus = getBonusBerechnung();

    const foerderProzentEffektiv = foerder.percent + bonus.bonusGesamtEffektiv;
    const maxZuschussJeWEEffektiv = Math.round((foerder.maxKredit * foerderProzentEffektiv) / 100);

    const gesamtMaxKredit = foerder.maxKredit * wohneinheiten;
    const gesamtMaxZuschuss = maxZuschussJeWEEffektiv * wohneinheiten;

    const bonusDropdowns = `
        <details class="info-dropdown wpb-dropdown" id="wpbDropdownInline">
            <summary>+10 % mit WPB-Bonus</summary>
            <div class="dropdown-content-text">
                <div id="wpbInfoTextInline"></div>
            </div>
        </details>
        <details class="info-dropdown serial-dropdown" id="serialDropdownInline">
            <summary>+15 % Serielle Sanierung</summary>
            <div class="dropdown-content-text">
                <div id="serialSanierungTextInline"></div>
            </div>
        </details>
    `;

    const bonusKurztext = bonus.bonusGesamtEffektiv > 0
        ? `+${bonus.bonusGesamtEffektiv} % (WPB: ${bonus.wpbBonusRoh} % + Serielle Sanierung ${bonus.serialBonusRoh} % (Deckelung bei 20 %))`
        : '0 % (kein anrechenbarer Bonus)';

    financeSummaryCard.innerHTML = `
        <div class="result-item">
            <span class="result-label">Max. Kredit je Wohneinheit</span>
            <span class="result-value">${formatEuro(foerder.maxKredit)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Max. Kredit gesamt</span>
            <span class="result-value">${formatEuro(gesamtMaxKredit)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Basis-Tilgungszuschuss</span>
            <span class="result-value">${foerder.percent} %</span>
        </div>
        <div class="result-item">
            <span class="result-label">Angerechneter Bonus gesamt</span>
            <span class="result-value">${bonusKurztext}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Gesamter Tilgungszuschuss</span>
            <span class="result-value">${foerderProzentEffektiv} %</span>
        </div>
        <div class="result-item">
            <span class="result-label">Max. Zuschuss je Wohneinheit</span>
            <span class="result-value">${formatEuro(maxZuschussJeWEEffektiv)}</span>
        </div>
        <div class="tilgungszuschuss-highlight-box">
            <div class="tilgungszuschuss-highlight-icon">✅</div>
            <div class="tilgungszuschuss-highlight-content">
                <p class="tilgungszuschuss-highlight-title">Ihr maximaler Tilgungszuschuss gesamt</p>
                <p class="tilgungszuschuss-highlight-value">${formatEuro(gesamtMaxZuschuss)}</p>
            </div>
        </div>
        <div class="finance-separator" aria-hidden="true"></div>
        <details class="bonus-box info-dropdown" id="bonusOverviewDropdown">
            <summary>Definition Bonus</summary>
            <div class="dropdown-content-text">
                ${bonusDropdowns}
            </div>
        </details>
    `;

    renderBonusErklaerungen();

    renderZinsvergleichSection();
}

function renderBonusErklaerungen() {
    const serialSanierungText = document.getElementById('serialSanierungTextInline');
    const wpbInfoText = document.getElementById('wpbInfoTextInline');

    if (serialSanierungText) {
        serialSanierungText.innerHTML = `
        <ul>
            <li>Energetische Sanierung mit werkseitig vorgefertigten Modulen (z. B. Fassadenelemente).</li>
            <li>Schnellere Montage vor Ort als bei klassischer Bauweise.</li>
            <li>Voraussetzung: mind. 80 % der relevanten Fassadenflächen seriell saniert.</li>
            <li>Bonus: 15 % Tilgungszuschuss auf förderfähige Sanierungskosten.</li>
            <li>Berücksichtigung im Rechner: nur bei Effizienzhaus 40 oder 55.</li>
        </ul>
    `;
    }

    if (wpbInfoText) {
        wpbInfoText.innerHTML = `
        <ul>
            <li>WPB (Worst Performing Building) kann vorliegen bei Baujahr 1957 oder älter.</li>
            <li>Zusätzlich: mind. 75 % der Außenwandfläche energetisch unsaniert.</li>
            <li>Einstufung ist dann unabhängig von der Energieausweis-Klasse.</li>
            <li>Bonus: +10 % beim Tilgungszuschuss/Zuschuss.</li>
            <li>Berücksichtigung im Rechner: ab Effizienzhaus 70 EE-Klasse sowie bei Effizienzhaus 55/40.</li>
        </ul>
    `;
    }
}

function getSerielleSanierungEinschaetzung() {
    return 'Serielle Sanierung bedeutet: Vorgefertigte Bauteile (z. B. für Fassade oder Dach) werden auf der Baustelle montiert. Dadurch kann sich die Bauzeit vor Ort je nach Projekt typischerweise um etwa 20–30 % verkürzen.';
}

function formatDateGerman(date) {
    return date.toLocaleDateString('de-DE');
}

function loadImageAsDataUrl(src, options = {}) {
    const {
        format = 'image/jpeg',
        quality = 0.72,
        maxWidth = 1600,
        maxHeight = 1600,
        backgroundColor = '#ffffff'
    } = options;

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const widthScale = maxWidth > 0 ? maxWidth / image.naturalWidth : 1;
            const heightScale = maxHeight > 0 ? maxHeight / image.naturalHeight : 1;
            const scale = Math.min(1, widthScale, heightScale);
            const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
            const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const context = canvas.getContext('2d');

            if (!context) {
                reject(new Error('Canvas-Kontext konnte nicht erstellt werden.'));
                return;
            }

            if (format === 'image/jpeg') {
                context.fillStyle = backgroundColor;
                context.fillRect(0, 0, targetWidth, targetHeight);
            }

            context.drawImage(image, 0, 0, targetWidth, targetHeight);

            const outputFormat = format === 'image/png' ? 'PNG' : 'JPEG';
            resolve({
                dataUrl: canvas.toDataURL(format, quality),
                width: targetWidth,
                height: targetHeight,
                format: outputFormat
            });
        };
        image.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${src}`));
        image.src = src;
    });
}

function getPdfSummaryData() {
    const wohneinheiten = Number(wohneinheitenInput.value) || 1;
    const baujahr = Number(baujahrInput.value);
    const klasseH = getKlasseHValue();
    const wpb = computeWpbStatus();
    const huelle = getHuelleStufeData();
    const heizungValue = getCheckedValue('heizungPlan');
    const lueftungValue = getCheckedValue('lueftungPlan');
    const serielleSanierungValue = getCheckedValue('serielleSanierungPlan');
    const einschaetzung = getEffizienzhausEinschaetzung();
    const foerder = getFoerderDaten(einschaetzung);
    const bonus = getBonusBerechnung();
    const foerderProzentEffektiv = foerder.percent + bonus.bonusGesamtEffektiv;
    const maxZuschussJeWEEffektiv = Math.round((foerder.maxKredit * foerderProzentEffektiv) / 100);

    return {
        gebaeudeart: getBuildingTypeLabel(selectedBuildingType),
        wohneinheiten,
        baujahr,
        klasseH: klasseH ? klasseH.toUpperCase() : 'Nicht angegeben',
        wpbStatus: bonus.wpbBonusEffektiv > 0 ? 'WPB-Bonus wird berücksichtigt' : 'WPB-Bonus wird aktuell nicht berücksichtigt',
        wpbReason: wpb.reason,
        heizung: getHeizungPlanLabel(heizungValue),
        lueftung: getLueftungPlanLabel(lueftungValue),
        serielleSanierung: getSerielleSanierungPlanLabel(serielleSanierungValue),
        huelleTitel: huelle.title,
        huelleBeschreibung: huelle.description,
        effizienzhaus: einschaetzung.stufe,
        eeTendenz: einschaetzung.eeKlasseMoeglich ? 'mit EE-Klassen-Tendenz' : 'Standard-Tendenz',
        foerderProzent: foerderProzentEffektiv,
        foerderBasisProzent: foerder.percent,
        wpbBonusProzent: bonus.wpbBonusEffektiv,
        serialBonusProzent: bonus.serialBonusEffektiv,
        klasse: foerder.klasse,
        maxKreditJeWE: foerder.maxKredit,
        maxZuschussJeWE: maxZuschussJeWEEffektiv,
        maxKreditGesamt: foerder.maxKredit * wohneinheiten,
        maxZuschussGesamt: maxZuschussJeWEEffektiv * wohneinheiten
    };
}

function drawWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
}

async function generatePdfReport() {
    const jsPdfCtor = window.jspdf?.jsPDF;
    if (!jsPdfCtor) {
        alert('PDF-Bibliothek wurde nicht geladen. Bitte Seite neu laden.');
        return;
    }

    if (!validateStep1() || !validateStep2() || !validateStep3()) {
        return;
    }

    const [titleImage, logoImage, qrImage, ablaufImage] = await Promise.all([
        loadImageAsDataUrl('titelblatt.png', { format: 'image/jpeg', quality: 0.64, maxWidth: 1200, maxHeight: 1700 }),
        loadImageAsDataUrl('logo.png', { format: 'image/png', maxWidth: 800, maxHeight: 450 }),
        loadImageAsDataUrl('homepagestatistik.png', { format: 'image/png', maxWidth: 700, maxHeight: 700 }),
        loadImageAsDataUrl('kfwablauf.png', { format: 'image/jpeg', quality: 0.66, maxWidth: 1200, maxHeight: 1700 })
    ]);

    const doc = new jsPdfCtor({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addImage(titleImage.dataUrl, titleImage.format, 0, 0, pageWidth, pageHeight, undefined, 'FAST');

    doc.addPage();
    const summary = getPdfSummaryData();

    const colors = {
        bg: [255, 255, 255],
        green: [80, 104, 91],
        dark: [26, 31, 34],
        red: [184, 35, 35],
        line: [186, 192, 199]
    };

    const drawKeyValueRow = (label, value, xLabel, xValue, y, bold = false) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(label, xLabel, y);
        doc.setFont('helvetica', 'bold');
        doc.text(value, xValue, y, { align: 'right' });
    };

    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KFW - 261 - Ergebnis', 10, 12);

    const logoWidth = 22;
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
    doc.addImage(logoImage.dataUrl, logoImage.format, pageWidth - logoWidth - 10, 4.5, logoWidth, logoHeight);

    let y = 33;
    const leftMargin = 20;

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Projektdaten:', leftMargin, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.text(`Gebäudeart: ${summary.gebaeudeart}`, leftMargin, y);
    y += 6;
    doc.text(`Anzahl Wohneinheiten: ${summary.wohneinheiten}`, leftMargin, y);
    y += 6;
    doc.text(`Baujahr: ${summary.baujahr || '-'}`, leftMargin, y);
    y += 6;
    doc.text(`EH-Status: ${summary.effizienzhaus} (${summary.eeTendenz})`, leftMargin, y);
    y += 6;
    doc.text(`Wärmeerzeuger: ${summary.heizung}`, leftMargin, y);
    y += 6;
    doc.text(`Kredithöhe gesamt: ${formatEuro(summary.maxKreditGesamt)}`, leftMargin, y);

    y += 10;
    const boxX = 15;
    const boxW = pageWidth - 30;

    const subsidyBoxY = y;
    const subsidyBoxH = 44;
    doc.setDrawColor(colors.line[0], colors.line[1], colors.line[2]);
    doc.setLineWidth(0.5);
    doc.rect(boxX, subsidyBoxY, boxW, subsidyBoxH);

    doc.setFillColor(232, 242, 236);
    doc.rect(boxX, subsidyBoxY, boxW, 11, 'F');
    doc.setTextColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Hebel 1: Tilgungszuschuss', boxX + 6, subsidyBoxY + 7.2);

    y = subsidyBoxY + 18;
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(8.8);
    drawKeyValueRow('Tilgungszuschuss je Wohneinheit:', `${summary.foerderProzent} % (${summary.klasse})`, boxX + 10, boxX + boxW - 10, y);
    y += 7;
    drawKeyValueRow('Max. möglicher KfW-Kredit:', formatEuro(summary.maxKreditGesamt), boxX + 10, boxX + boxW - 10, y);

    y += 6;
    doc.setFillColor(239, 248, 243);
    doc.setDrawColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX + 6, y - 4.5, boxW - 12, 10, 1.6, 1.6, 'FD');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Max. Tilgungszuschuss gesamt:', boxX + 12, y + 1.9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatEuro(summary.maxZuschussGesamt)}`, boxX + boxW - 12, y + 1.9, { align: 'right' });

    const zinsBoxY = subsidyBoxY + subsidyBoxH + 8;
    const zinsBoxH = 66;
    doc.setDrawColor(colors.line[0], colors.line[1], colors.line[2]);
    doc.setLineWidth(0.5);
    doc.rect(boxX, zinsBoxY, boxW, zinsBoxH);

    doc.setFillColor(232, 242, 236);
    doc.rect(boxX, zinsBoxY, boxW, 11, 'F');
    doc.setTextColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Hebel 2: Zinsvorteil KfW gegenüber Interhyp', boxX + 6, zinsBoxY + 7.2);

    y = zinsBoxY + 18;
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(8.8);
    drawKeyValueRow('KfW-Förderkredit:', `${formatPercent(KFW261_REFERENZ_ZINS)} p.a.`, boxX + 10, boxX + boxW - 10, y);
    y += 6;
    drawKeyValueRow('Marktüblicher Zins (Interhyp):', `${formatPercent(INTERHYP_REFERENZ_ZINS)} p.a.`, boxX + 10, boxX + boxW - 10, y);

    y += 8;
    const monthlyKfw = Math.round((summary.maxKreditGesamt * (KFW261_REFERENZ_ZINS / 100)) / 12);
    const monthlyMarket = Math.round((summary.maxKreditGesamt * (INTERHYP_REFERENZ_ZINS / 100)) / 12);
    const monthlySaving = Math.max(0, monthlyMarket - monthlyKfw);

    doc.setFont('helvetica', 'bold');
    doc.text('Monatliche Zinsbelastung (ohne Tilgung):', boxX + 10, y);
    y += 6;
    drawKeyValueRow('Mit KfW-Förderung:', `${formatEuro(monthlyKfw)}`, boxX + 10, boxX + boxW - 10, y);
    y += 6;
    drawKeyValueRow('Bei Marktkonditionen:', `${formatEuro(monthlyMarket)}`, boxX + 10, boxX + boxW - 10, y);

    y += 6;
    doc.setFillColor(239, 248, 243);
    doc.setDrawColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX + 6, y - 4.5, boxW - 12, 10, 1.6, 1.6, 'FD');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Monatlicher Zinsvorteil:', boxX + 12, y + 1.9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatEuro(monthlySaving)}`, boxX + boxW - 12, y + 1.9, { align: 'right' });

    const yearlySaving = monthlySaving * 12;
    const subsidyAdvantageY = zinsBoxY + zinsBoxH + 6;
    doc.setFillColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.rect(15, subsidyAdvantageY, pageWidth - 30, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Ihr Tilgungszuschuss gesamt:', pageWidth / 2, subsidyAdvantageY + 7.5, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`${formatEuro(summary.maxZuschussGesamt)}`, pageWidth / 2, subsidyAdvantageY + 15.2, { align: 'center' });

    const advantageY = subsidyAdvantageY + 23;
    doc.setFillColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.rect(15, advantageY, pageWidth - 30, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Ihr Zinsvorteil gegenüber Marktkredit (1 Jahr):', pageWidth / 2, advantageY + 7.5, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`${formatEuro(yearlySaving)}`, pageWidth / 2, advantageY + 15.2, { align: 'center' });

    const infoY = advantageY + 24;
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Hinweis zur Zinstilgung:', 15, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text('Der Vergleich zeigt nur die reinen Zinskosten auf Basis der Darlehenssumme.', 15, infoY + 5);

    const qrSize = 22;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = pageHeight - qrSize - 4;
    doc.addImage(qrImage.dataUrl, qrImage.format, qrX, qrY, qrSize, qrSize, undefined, 'FAST');

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    const page3HeaderHeight = 22;
    const page3FooterHeight = 30;

    doc.setFillColor(colors.green[0], colors.green[1], colors.green[2]);
    doc.rect(0, 0, pageWidth, page3HeaderHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KFW - 261 - Ablauf', 10, 12);
    doc.addImage(logoImage.dataUrl, logoImage.format, pageWidth - logoWidth - 10, 4.5, logoWidth, logoHeight);

    const page3QrSize = 20;
    const page3QrX = (pageWidth - page3QrSize) / 2;
    const page3QrY = pageHeight - page3FooterHeight + ((page3FooterHeight - page3QrSize) / 2);
    doc.addImage(qrImage.dataUrl, qrImage.format, page3QrX, page3QrY, page3QrSize, page3QrSize, undefined, 'FAST');

    const imageAreaTop = page3HeaderHeight + 6;
    const imageAreaBottom = pageHeight - page3FooterHeight - 6;
    const imageAreaHeight = imageAreaBottom - imageAreaTop;
    const imageAreaWidth = pageWidth - 20;
    const imageScale = Math.min(imageAreaWidth / ablaufImage.width, imageAreaHeight / ablaufImage.height);
    const imageWidth = ablaufImage.width * imageScale;
    const imageHeight = ablaufImage.height * imageScale;
    const imageX = (pageWidth - imageWidth) / 2;
    const imageY = imageAreaTop + ((imageAreaHeight - imageHeight) / 2);
    doc.addImage(ablaufImage.dataUrl, ablaufImage.format, imageX, imageY, imageWidth, imageHeight, undefined, 'FAST');

    const linkX = 57.37;
    const linkY = 101.61;
    const linkWidth = 106.48 - 57.37;
    const linkHeight = 107.11 - 101.61;
    doc.link(linkX, linkY, linkWidth, linkHeight, { url: 'https://www.energy-advice-bavaria.de' });

    doc.save(`kfw261-zusammenfassung-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function renderFinalResult() {
    const bonus = getBonusBerechnung();
    const einschaetzung = getEffizienzhausEinschaetzung();
    const huelle = getHuelleStufeData();
    const heizung = getHeizungPlanLabel(getCheckedValue('heizungPlan'));
    const lueftung = getLueftungPlanLabel(getCheckedValue('lueftungPlan'));
    const serielleSanierung = getSerielleSanierungPlanLabel(getCheckedValue('serielleSanierungPlan'));

    finalResultText.innerHTML = `
        <h3>Ihre einfache KfW-261-Vorprüfung</h3>
        <p><span>Ausgangslage:</span> ${bonus.wpb.hasWpbBonus ? 'WPB-Voraussetzungen in den Gebäudedaten erfüllt' : 'WPB-Voraussetzungen in den Gebäudedaten nicht erfüllt'} | ${huelle.title}.</p>
        <p><span>Einschätzung:</span> ${einschaetzung.stufe} (${einschaetzung.eeKlasseMoeglich ? 'mit EE-Klassen-Tendenz' : 'Standard-Tendenz'}).</p>
        <p><span>Technik:</span> Heizung ${heizung}, Lüftung ${lueftung}, serielle Sanierung ${serielleSanierung}.</p>
        <p><span>Bonuspunkte:</span> WPB +${bonus.wpbBonusEffektiv} %, serielle Sanierung +${bonus.serialBonusEffektiv} %.</p>
        <p><span>Hinweis:</span> Das Ergebnis ist eine unverbindliche Ersteinschätzung, welche Effizienzhaus-Stufe Sie voraussichtlich erreichen können.</p>
    `;

}

function goToStep2() {
    step1.classList.remove('active');
    step2.classList.add('active');
    step3.classList.remove('active');
    step4.classList.remove('active');

    progressStep1.classList.remove('active');
    progressStep1.classList.add('completed');

    progressStep2.classList.add('active');
    progressStep2.classList.remove('completed');
    progressStep3.classList.remove('active');
    progressStep3.classList.remove('completed');
    progressStep4.classList.remove('active');
    progressStep4.classList.remove('completed');
}

function goToStep3() {
    step2.classList.remove('active');
    step3.classList.add('active');
    step4.classList.remove('active');

    progressStep2.classList.remove('active');
    progressStep2.classList.add('completed');
    progressStep3.classList.add('active');
    progressStep3.classList.remove('completed');
    progressStep4.classList.remove('active');
    progressStep4.classList.remove('completed');
}

function goToStep4() {
    step3.classList.remove('active');
    step4.classList.add('active');

    progressStep3.classList.remove('active');
    progressStep3.classList.add('completed');
    progressStep4.classList.add('active');

    renderFinalResult();
    renderFinanceSummary();
}

function goToStep1() {
    step2.classList.remove('active');
    step3.classList.remove('active');
    step4.classList.remove('active');
    step1.classList.add('active');

    progressStep2.classList.remove('active');
    progressStep2.classList.remove('completed');
    progressStep3.classList.remove('active');
    progressStep3.classList.remove('completed');
    progressStep4.classList.remove('active');
    progressStep4.classList.remove('completed');
    progressStep1.classList.remove('completed');
    progressStep1.classList.add('active');
}

function backToStep2() {
    step3.classList.remove('active');
    step4.classList.remove('active');
    step2.classList.add('active');

    progressStep3.classList.remove('active');
    progressStep3.classList.remove('completed');
    progressStep4.classList.remove('active');
    progressStep2.classList.add('active');
    progressStep2.classList.remove('completed');
    progressStep4.classList.remove('completed');
}

function backToStep3() {
    step4.classList.remove('active');
    step3.classList.add('active');

    progressStep4.classList.remove('active');
    progressStep3.classList.add('active');
    progressStep3.classList.remove('completed');
}

gebaeudeartCards.forEach((card) => {
    card.addEventListener('click', () => {
        gebaeudeartCards.forEach((item) => item.classList.remove('selected'));
        card.classList.add('selected');
        setUnitsByBuildingType(card);
    });
});

baujahrInput.addEventListener('input', updateEnergieausweisQuestion);

klasseHRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
        updateKlasseHCardSelection();
    });
});

['heizungPlan', 'lueftungPlan', 'serielleSanierungPlan'].forEach((name) => {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach((radio) => {
        radio.addEventListener('change', () => {
            updateRadioCardSelectionByName(name);
            updateStep2QuestionVisibility();
        });
    });
});

if (huelleStufeInput) {
    huelleStufeInput.addEventListener('input', () => {
        updateHuelleStageDisplay();
        if (step4.classList.contains('active')) {
            renderFinalResult();
            renderFinanceSummary();
        }
    });
}

nextBtn.addEventListener('click', () => {
    if (!validateStep1()) {
        return;
    }

    goToStep2();
});

backToStep1Btn.addEventListener('click', goToStep1);

nextToStep3Btn.addEventListener('click', () => {
    if (!validateStep2()) {
        return;
    }

    goToStep3();
});

nextToStep4Btn.addEventListener('click', () => {
    if (!validateStep3()) {
        return;
    }

    if (!validateStep2()) {
        backToStep2();
        return;
    }

    goToStep4();
});

backToStep3Btn.addEventListener('click', backToStep3);
backToStep2Btn.addEventListener('click', backToStep2);

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async () => {
        downloadPdfBtn.disabled = true;
        const originalText = downloadPdfBtn.textContent;
        downloadPdfBtn.textContent = 'PDF wird erstellt...';

        try {
            await generatePdfReport();
        } catch (error) {
            alert('Beim Erstellen der PDF ist ein Fehler aufgetreten. Bitte erneut versuchen.');
            console.error(error);
        } finally {
            downloadPdfBtn.disabled = false;
            downloadPdfBtn.textContent = originalText;
        }
    });
}

kfwForm.addEventListener('submit', (event) => {
    event.preventDefault();
});

updateHuelleStageDisplay();
updateStep2QuestionVisibility();
