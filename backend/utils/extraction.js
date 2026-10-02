// Smart Medical Information Extraction - NLP simulation
// In production, replace with real NLP model (spaCy, BioBERT, etc)

const MEDICINE_KEYWORDS = [
    'paracetamol', 'dolo', 'azithromycin', 'amoxicillin', 'metformin', 'atorvastatin',
    'crocin', 'aspirin', 'ibuprofen', 'cetirizine', 'omeprazole', 'levothyroxine',
    'insulin', 'amlodipine', 'losartan', 'vitamin', 'calcium', 'iron'
];

const DIAGNOSIS_KEYWORDS = [
    'fever', 'diabetes', 'hypertension', 'asthma', 'covid', 'malaria', 'typhoid',
    'anemia', 'migraine', 'bronchitis', 'pneumonia', 'fracture', 'infection',
    'allergy', 'thyroid', 'cholesterol', 'bp', 'hypertension'
];

const TEST_KEYWORDS = [
    'cbc', 'blood test', 'x-ray', 'mri', 'ct scan', 'ultrasound', 'ecg', 'sugar',
    'hemoglobin', 'platelet', 'cholesterol', 'thyroid', 'creatinine', 'urine'
];

export function extractMedicalInfo(text) {
    const lower = text.toLowerCase();

    const medicines = [];
    MEDICINE_KEYWORDS.forEach(med => {
        if (lower.includes(med)) {
            // Try to find dosage near medicine
            const regex = new RegExp(`${med}[^\\n]{0,30}(\\d+\\s*mg|\\d+\\s*ml|\\d+\\s*tablet)`, 'i');
            const match = text.match(regex);
            medicines.push({
                name: med.charAt(0).toUpperCase() + med.slice(1),
                dosage: match ? match[1] : 'As prescribed',
                context: extractContext(text, med)
            });
        }
    });

    const diagnosis = [];
    DIAGNOSIS_KEYWORDS.forEach(diag => {
        if (lower.includes(diag)) {
            diagnosis.push({
                condition: diag.charAt(0).toUpperCase() + diag.slice(1),
                context: extractContext(text, diag)
            });
        }
    });

    const tests = [];
    TEST_KEYWORDS.forEach(test => {
        if (lower.includes(test)) {
            // Extract values like "Hemoglobin 12.5" etc
            const regex = new RegExp(`${test}[^\\n]{0,40}(\\d+\\.?\\d*\\s*%|\\d+\\.?\\d*\\s*mg|\\d+\\.?\\d*)`, 'i');
            const match = text.match(regex);
            tests.push({
                name: test.toUpperCase(),
                value: match ? match[1] : 'See report',
                context: extractContext(text, test)
            });
        }
    });

    // Extract dates - multiple formats
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})|(\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{2,4})/gi;
    const dates = [...text.matchAll(dateRegex)].map(m => m[0]).slice(0, 5);

    // Extract doctor/hospital
    const doctorRegex = /(dr\.?\s*[a-z]+\s*[a-z]*|doctor\s*[a-z]+)/gi;
    const doctors = [...text.matchAll(doctorRegex)].map(m => m[0]).slice(0, 3);

    const hospitalRegex = /(hospital|clinic|medical|health\s*center)[^\\n]{0,30}/gi;
    const hospitals = [...text.matchAll(hospitalRegex)].map(m => m[0]).slice(0, 2);

    return {
        medicines: medicines.length ? medicines : [{ name: 'No medicines detected', dosage: '-', context: '' }],
        diagnosis: diagnosis.length ? diagnosis : [{ condition: 'General Consultation', context: 'Routine checkup' }],
        tests: tests,
        dates: dates.length ? dates : [new Date().toLocaleDateString()],
        doctors,
        hospitals,
        summary: generateSummary(medicines, diagnosis, tests, dates),
        confidence: Math.floor(70 + Math.random() * 25) // 70-95%
    };
}

function extractContext(text, keyword) {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + 60);
    return text.substring(start, end).replace(/\n/g, ' ').trim();
}

function generateSummary(medicines, diagnosis, tests, dates) {
    let summary = '';
    if (diagnosis.length) summary += `Diagnosed with ${diagnosis[0].condition}. `;
    if (medicines.length && medicines[0].name !== 'No medicines detected') summary += `Prescribed ${medicines.map(m => m.name).join(', ')}. `;
    if (tests.length) summary += `Tests: ${tests.map(t => t.name).join(', ')}. `;
    if (!summary) summary = 'Medical document processed. Information extracted for timeline.';
    return summary;
}

export function detectConflicts(records) {
    const conflicts = [];

    // Check for conflicting medicines
    const allMeds = records.flatMap(r => r.extracted?.medicines || []);
    const medMap = {};
    allMeds.forEach(med => {
        const key = med.name.toLowerCase();
        if (!medMap[key]) medMap[key] = [];
        medMap[key].push(med);
    });

    Object.keys(medMap).forEach(medName => {
        const entries = medMap[medName];
        if (entries.length > 1) {
            const dosages = [...new Set(entries.map(e => e.dosage))];
            if (dosages.length > 1) {
                conflicts.push({
                    type: 'dosage_conflict',
                    severity: 'medium',
                    message: `Different dosages found for ${medName}: ${dosages.join(' vs ')}`,
                    medicine: medName,
                    details: entries
                });
            }
        }
    });

    // Check for diagnosis contradictions (simplified)
    const allDiagnosis = records.flatMap(r => r.extracted?.diagnosis?.map(d => d.condition.toLowerCase()) || []);
    if (allDiagnosis.includes('diabetes') && allDiagnosis.includes('no diabetes')) {
        conflicts.push({
            type: 'diagnosis_conflict',
            severity: 'high',
            message: 'Contradictory diabetes diagnosis found in records',
            details: []
        });
    }

    // Missing information detection
    const hasRecentTest = records.some(r => {
        const daysAgo = (Date.now() - new Date(r.uploadDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo < 90 && r.extracted?.tests?.length > 0;
    });

    if (!hasRecentTest && records.length > 0) {
        conflicts.push({
            type: 'missing_info',
            severity: 'low',
            message: 'No recent lab tests found in last 90 days. Consider updating.',
            details: []
        });
    }

    return conflicts;
}

export function organizeTimeline(records) {
    // Sort by date extracted or upload date
    const sorted = [...records].sort((a, b) => {
        const dateA = a.extracted?.dates?.[0] ? new Date(a.extracted.dates[0]) : new Date(a.uploadDate);
        const dateB = b.extracted?.dates?.[0] ? new Date(b.extracted.dates[0]) : new Date(b.uploadDate);
        return dateA - dateB;
    });

    return sorted.map((record, index) => ({
        id: record.id,
        order: index + 1,
        date: record.extracted?.dates?.[0] || new Date(record.uploadDate).toLocaleDateString(),
        type: record.fileType || 'document',
        title: record.originalName,
        summary: record.extracted?.summary,
        medicines: record.extracted?.medicines,
        diagnosis: record.extracted?.diagnosis,
        tests: record.extracted?.tests,
        verified: record.verified || false,
        confidence: record.extracted?.confidence || 0
    }));
}
