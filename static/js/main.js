document.addEventListener('DOMContentLoaded', () => {
    const fillBtn = document.getElementById('fillDefaultsBtn');
    const form = document.getElementById('predictForm');

    // 1. Autofill Sample Data
    if (fillBtn) {
        fillBtn.addEventListener('click', () => {
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

            document.querySelectorAll('select').forEach(select => {
                select.value = "0";
            });
        });
    }

    // 2. Tab Filtering logic for feature categories
    const tabButtons = document.querySelectorAll('.tab-btn');
    const featureItems = document.querySelectorAll('.feature-item');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            tabButtons.forEach(btn => {
                btn.classList.remove('bg-pink-600', 'text-white', 'shadow-md', 'shadow-pink-600/20');
                btn.classList.add('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-900');
            });

            button.classList.add('bg-pink-600', 'text-white', 'shadow-md', 'shadow-pink-600/20');
            button.classList.remove('text-zinc-400', 'hover:text-white', 'hover:bg-zinc-900');

            featureItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // 3. Async Form Submission
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const idleState = document.getElementById('idleState');
            const resultBox = document.getElementById('resultBox');

            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Running Inference Engine...</span>
            `;

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
                    if (idleState) idleState.classList.add('hidden');
                    if (resultBox) resultBox.classList.remove('hidden');

                    const statusBanner = document.getElementById('statusBanner');
                    const resultLabel = document.getElementById('resultLabel');
                    const resultSubtitle = document.getElementById('resultSubtitle');
                    const actionText = document.getElementById('actionText');

                    if (data.diagnosis === 'Malignant') {
                        if (statusBanner) statusBanner.className = "p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-rose-900/10";
                        if (resultLabel) resultLabel.innerText = "MALIGNANT";
                        if (resultSubtitle) resultSubtitle.innerText = "Elevated risk indicators detected.";
                        if (actionText) actionText.innerText = "High likelihood of malignancy detected. Flag for immediate secondary clinical review, additional diagnostic imaging, and biopsy verification.";
                    } else {
                        if (statusBanner) statusBanner.className = "p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-emerald-900/10";
                        if (resultLabel) resultLabel.innerText = "BENIGN";
                        if (resultSubtitle) resultSubtitle.innerText = "Low risk profile within safe diagnostic ranges.";
                        if (actionText) actionText.innerText = "Parameters indicate a low-risk profile. Continue routine patient monitoring according to standard clinical protocol.";
                    }

                    if (document.getElementById('riskScoreVal')) document.getElementById('riskScoreVal').innerText = `${data.risk_score}%`;
                    if (document.getElementById('riskBar')) document.getElementById('riskBar').style.width = `${data.risk_score}%`;

                    if (document.getElementById('confidenceVal')) document.getElementById('confidenceVal').innerText = `${data.confidence}%`;
                    if (document.getElementById('confidenceBar')) document.getElementById('confidenceBar').style.width = `${data.confidence}%`;

                } else {
                    alert(`Inference Error: ${data.error || 'Failed to process diagnosis.'}`);
                }
            } catch (err) {
                alert("Server Connection Failed. Check server logs on Vercel.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span>Execute Diagnostic Assessment</span>
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                `;
            }
        });
    }
});
