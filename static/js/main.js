document.addEventListener('DOMContentLoaded', () => {
    const fillBtn = document.getElementById('fillDefaultsBtn');
    const form = document.getElementById('predictForm');

    // 1. Autofill Sample Data (Benign / Low-Risk Profile)
    if (fillBtn) {
        fillBtn.addEventListener('click', () => {
            // Set numeric inputs to normal/low-risk clinical ranges
            document.querySelectorAll('input[type="number"]').forEach(input => {
                const name = input.name.toLowerCase();
                if (name.includes('age')) input.value = 38;
                else if (name.includes('bmi')) input.value = 22.4;
                else if (name.includes('tumor')) input.value = 0.8;
                else if (name.includes('pressure')) input.value = 118;
                else if (name.includes('cholesterol')) input.value = 175;
                else if (name.includes('income')) input.value = 55000;
                else if (name.includes('exercise')) input.value = 4;
                else input.value = 0;
            });

            // Set all categorical dropdowns to 0 (No / Negative / Low Risk)
            document.querySelectorAll('select').forEach(select => {
                select.value = "0";
            });
        });
    }

    // 2. Handle Asynchronous Form Submission
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const idleState = document.getElementById('idleState');
            const resultBox = document.getElementById('resultBox');

            // Button loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Running Inference Engine...</span>
            `;

            // Extract form inputs into key-value JSON
            const formData = new FormData(this);
            const payload = {};
            formData.forEach((value, key) => { payload[key] = value; });

            try {
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok && data.status === 'success') {
                    // Hide empty state & expose results panel
                    idleState.classList.add('hidden');
                    resultBox.classList.remove('hidden');

                    const statusBanner = document.getElementById('statusBanner');
                    const resultLabel = document.getElementById('resultLabel');
                    const resultSubtitle = document.getElementById('resultSubtitle');
                    const actionText = document.getElementById('actionText');

                    // Update UI elements based on prediction classification
                    if (data.diagnosis === 'Malignant') {
                        statusBanner.className = "p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-rose-900/10";
                        resultLabel.innerText = "MALIGNANT";
                        resultSubtitle.innerText = "Elevated risk indicators detected.";
                        actionText.innerText = "High likelihood of malignancy detected. Flag for immediate secondary clinical review, additional diagnostic imaging, and biopsy verification.";
                    } else {
                        statusBanner.className = "p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-emerald-900/10";
                        resultLabel.innerText = "BENIGN";
                        resultSubtitle.innerText = "Low risk profile within safe diagnostic ranges.";
                        actionText.innerText = "Parameters indicate a low-risk profile. Continue routine patient monitoring according to standard clinical protocol.";
                    }

                    // Update progress bars & numeric values
                    document.getElementById('riskScoreVal').innerText = `${data.risk_score}%`;
                    document.getElementById('riskBar').style.width = `${data.risk_score}%`;

                    document.getElementById('confidenceVal').innerText = `${data.confidence}%`;
                    document.getElementById('confidenceBar').style.width = `${data.confidence}%`;

                } else {
                    alert(`Inference Error: ${data.error || 'Failed to process diagnosis.'}`);
                }
            } catch (err) {
                alert("Server Connection Failed. Please check if your Flask/Vercel server is running.");
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span>Execute Diagnostic Assessment</span>
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                `;
            }
        });
    }
});
