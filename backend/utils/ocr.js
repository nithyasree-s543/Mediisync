// OCR Service - uses tesseract.js for images, text extraction for PDFs (mock for demo)
import fs from 'fs';

export async function extractTextFromFile(filePath, mimeType) {
    try {
        if (mimeType.startsWith('image/')) {
            // For demo, we will use tesseract.js if available, otherwise mock
            // Dynamic import to avoid heavy load at startup
            try {
                const { createWorker } = await import('tesseract.js');
                const worker = await createWorker('eng');
                const { data } = await worker.recognize(filePath);
                await worker.terminate();
                if (data.text && data.text.trim().length > 10) {
                    return data.text;
                }
            } catch (e) {
                console.log('Tesseract fallback to mock:', e.message);
            }
        }

        // For PDF or fallback, read as text if possible or return mock medical text
        if (mimeType === 'application/pdf') {
            // In real app, use pdf-parse library
            // For demo, return simulated extraction
            return generateMockMedicalText();
        }

        // Try reading as text
        if (mimeType.startsWith('text/')) {
            return fs.readFileSync(filePath, 'utf8');
        }

        // Fallback mock for demo purposes
        return generateMockMedicalText();

    } catch (error) {
        console.error('OCR Error:', error);
        return generateMockMedicalText();
    }
}

function generateMockMedicalText() {
    const templates = [
        `Dr. Rajesh Kumar
City Care Hospital, Chennai
Date: ${new Date().toLocaleDateString()}
Patient Complaint: Fever and headache for 3 days
Diagnosis: Viral Fever
Prescription:
- Paracetamol 500mg - 1 tablet twice daily for 5 days
- Azithromycin 250mg - 1 tablet daily for 3 days
- Cetirizine 10mg at night
Tests Advised: CBC, Blood Sugar
Follow up after 5 days`,

        `Apollo Clinic - Lab Report
Date: ${new Date(Date.now() - 86400000 * 2).toLocaleDateString()}
Test: Complete Blood Count (CBC)
Hemoglobin: 13.5 g/dL (Normal: 12-16)
WBC: 7500 /cmm
Platelet Count: 2.5 Lakhs
Blood Sugar Fasting: 98 mg/dL
Doctor: Dr. Priya Sharma`,

        `MedPlus Pharmacy Bill
Date: ${new Date(Date.now() - 86400000 * 10).toLocaleDateString()}
Medicines:
1. Metformin 500mg - 30 tablets
2. Atorvastatin 10mg - 15 tablets
3. Vitamin D3 60k - 4 tablets
Diagnosis: Diabetes Type 2, High Cholesterol
Prescribed by Dr. Anand`,

        `X-Ray Report - Chest PA View
Date: ${new Date(Date.now() - 86400000 * 30).toLocaleDateString()}
Findings: Lungs clear, no consolidation. Cardiac silhouette normal.
Impression: Normal chest X-ray
Radiologist: Dr. Mehta
Hospital: Global Health Center`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}
