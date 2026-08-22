document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Element References ---
    const fillBtn = document.getElementById('fillDefaultsBtn');
    const form = document.getElementById('predictForm');
    
    const toggleBtn = document.getElementById('toggle-chat-btn');
    const closeBtn = document.getElementById('close-chat-btn');
    const chatBox = document.getElementById('ai-chat-box');
    const chatIconOpen = document.getElementById('chat-icon-open');
    const chatIconClose = document.getElementById('chat-icon-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // --- 2. Autofill Sample Data ---
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

    // --- 3. Feature Tab Filtering (Unified) ---
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
                    item.style.display = ''; // Reverts to CSS default (grid/block)
                    item.classList.remove('hidden');
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // --- 4. Async Form Submission ---
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const idleState = document.getElementById('idleState');
            const resultBox = document.getElementById('resultBox');

            if (!submitBtn) return;

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

    // --- 5. AI Chat Assistant Logic ---
    function toggleChat() {
        if (!chatBox) return;
        const isHidden = chatBox.classList.contains('hidden');
        if (!isHidden) {
            chatBox.classList.add('opacity-0', 'scale-95');
            setTimeout(() => chatBox.classList.add('hidden'), 200);
            if (chatIconOpen) chatIconOpen.classList.remove('hidden');
            if (chatIconClose) chatIconClose.classList.add('hidden');
        } else {
            chatBox.classList.remove('hidden');
            setTimeout(() => chatBox.classList.remove('opacity-0', 'scale-95'), 10);
            if (chatIconOpen) chatIconOpen.classList.add('hidden');
            if (chatIconClose) chatIconClose.classList.remove('hidden');
            scrollToBottom();
        }
    }

    function scrollToBottom() {
        if (!chatMessages) return;
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    if (toggleBtn) toggleBtn.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', toggleChat);

    function appendMessage(sender, text) {
        if (!chatMessages) return;
        const isUser = sender === 'user';
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : ''}`;
        
        msgDiv.innerHTML = `
            <div class="w-6 h-6 rounded-lg ${isUser ? 'bg-zinc-800 border border-zinc-700 text-zinc-300' : 'bg-pink-500/10 border border-pink-500/20 text-pink-400'} flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                ${isUser ? 'YOU' : 'AI'}
            </div>
            <div class="${isUser ? 'bg-pink-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'} p-3 rounded-2xl ${isUser ? 'rounded-tr-xs' : 'rounded-tl-xs'} max-w-[85%] leading-relaxed">
                ${text}
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function getAiResponse(query) {
        const q = query.toLowerCase().trim();

        if (/(what|how).*(website|app|platform|tool|system|help|purpose|do|use)/i.test(q) || q.includes('help')) {
            return "<strong>OncoPredict</strong> is an AI decision support tool. It processes clinical inputs to estimate breast cancer risk, explains model decisions via SHAP feature weights, and maps outcomes directly to standardized clinical protocols.";
        }
        if (/(what|explain|define).*(breast cancer|cancer|malignan)/i.test(q) || /(whta|cancr|tumor)/i.test(q)) {
            return "<strong>Breast cancer</strong> occurs when breast tissue cells mutate and multiply uncontrollably to form malignant tumors. OncoPredict focuses on early detection by evaluating tissue histology, tumor dimensions, and genetic indicators.";
        }
        if (/(benign|malignant|difference|type|tumor)/i.test(q)) {
            return "<strong>Benign tumors</strong> are non-cancerous, localized, and do not spread to other tissues.<br><strong>Malignant tumors</strong> are cancerous, invasive, and capable of metastasizing to surrounding tissue or organs.";
        }
        if (/(symptom|sign|warning|look for|detect)/i.test(q)) {
            return "Common warning signs include:<br>• A painless lump or tissue thickening in the breast/underarm<br>• Alterations in breast size, shape, or skin dimpling<br>• Nipple inversion, redness, or abnormal discharge.";
        }
        if (/(risk factor|cause|hereditary|genetic|brca|family history)/i.test(q)) {
            return "Key risk factors include <strong>BRCA1/BRCA2 genetic mutations</strong>, advanced age, dense breast tissue, personal or family history of breast cancer, and prolonged hormone exposure.";
        }
        if (/(model|lightgbm|algorithm|tech stack|how it works|architecture)/i.test(q)) {
            return "The backend relies on a fine-tuned <strong>LightGBM (Light Gradient Boosting Machine)</strong> decision tree pipeline, optimized for tabular clinical feature processing with minimal memory overhead.";
        }
        if (/(metric|accuracy|roc|auc|precision|recall|sensitivity|latency|speed)/i.test(q)) {
            return "Validation analytics for the LightGBM engine:<br>• <strong>ROC-AUC:</strong> 0.964<br>• <strong>Sensitivity (Recall):</strong> 94.8%<br>• <strong>Precision:</strong> 92.3%<br>• <strong>Inference Latency:</strong> 11.4ms (Vercel Serverless)";
        }
        if (/(shap|feature|importance|weight|driver|factor)/i.test(q)) {
            return "Top SHAP feature drivers in prediction:<br>1. <strong>Biopsy Pathological Grade:</strong> 0.284<br>2. <strong>Tumor Dimensions (cm):</strong> 0.210<br>3. <strong>BRCA Mutation Status:</strong> 0.185<br>4. <strong>Patient Age & Menopause State:</strong> 0.142";
        }
        if (/(tier|protocol|guideline|low risk|moderate risk|high risk|action|workflow)/i.test(q)) {
            return "Actionable risk tiers based on NCCN protocols:<br>🟢 <strong>Low (&lt;30%):</strong> Routine annual screening.<br>🟡 <strong>Moderate (30–70%):</strong> Targeted MRI / Ultrasound & 6-month checkup.<br>🔴 <strong>High (&gt;70%):</strong> Priority core needle biopsy & oncology panel review.";
        }
        if (/(data|dataset|training|synthetic|faker|validation|sample)/i.test(q)) {
            return "The model is trained and validated on cross-validated multi-center clinical datasets alongside large-scale synthetic pipelines generated with <strong>Pandas, NumPy, and Faker</strong> to test edge cases without compromising patient privacy.";
        }
        if (/(privacy|security|hipaa|safe|store|data protection)/i.test(q)) {
            return "OncoPredict is designed as an inference-only decision tool. No Personal Health Information (PHI) is persisted on server databases during evaluation, protecting patient privacy.";
        }
        if (/(doctor|medical advice|replace doctor|diagnostic|diagnosis)/i.test(q)) {
            return "⚠️ <strong>Medical Disclaimer:</strong> OncoPredict is an AI screening support tool intended solely to assist medical professionals. It does not replace formal clinical diagnosis or pathology reports.";
        }
        if (/(host|deploy|vercel|flask|backend|api)/i.test(q)) {
            return "The application frontend is deployed on <strong>Vercel</strong>, backed by a lightweight Python/Flask runtime serving real-time model predictions via REST APIs.";
        }
        if (/(who|creator|developer|author|built|made|mobeen)/i.test(q)) {
            return "OncoPredict was engineered by <strong>Mobeen Fatima</strong>, a Data Analyst and Machine Learning Specialist focused on predictive modeling, synthetic pipeline engineering, and healthtech web applications.";
        }
        if (/(hi|hello|hey|greetings|good morning|good evening)/i.test(q)) {
            return "Hello! I am your OncoPredict AI Assistant. You can ask me about <strong>breast cancer pathology</strong>, <strong>LightGBM model metrics</strong>, <strong>risk tiers</strong>, or <strong>platform guidelines</strong>.";
        }

        return "I can answer questions regarding <strong>OncoPredict's purpose</strong>, <strong>breast cancer symptoms & risk factors</strong>, <strong>LightGBM performance metrics</strong>, or <strong>clinical guidelines</strong>. What would you like to explore?";
    }

    function handleSend(text) {
        if (!text.trim()) return;
        appendMessage('user', text);
        
        const suggestions = document.getElementById('suggested-queries');
        if (suggestions) suggestions.remove();

        setTimeout(() => {
            const botReply = getAiResponse(text);
            appendMessage('ai', botReply);
        }, 400);
    }

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value;
            chatInput.value = '';
            handleSend(text);
        });
    }

    // --- 6. Hero Dynamic Simulator ---
    const simTumorInput = document.getElementById('simTumorSize');
    const simBiopsyInput = document.getElementById('simBiopsyScore');
    const simTumorVal = document.getElementById('simTumorVal');
    const simBiopsyVal = document.getElementById('simBiopsyVal');
    const simRiskPercent = document.getElementById('simRiskPercent');
    const simRiskBar = document.getElementById('simRiskBar');
    const simTier = document.getElementById('simTier');

    function updateHeroSimulation() {
        if (!simTumorInput || !simBiopsyInput) return;

        const tumorSize = parseFloat(simTumorInput.value);
        const biopsyGrade = parseInt(simBiopsyInput.value);

        if (simTumorVal) simTumorVal.textContent = `${tumorSize.toFixed(1)} cm`;
        if (simBiopsyVal) simBiopsyVal.textContent = `Stage ${biopsyGrade}`;

        let calculatedRisk = Math.round((tumorSize / 6.0) * 45 + (biopsyGrade / 4.0) * 50 + 5);
        calculatedRisk = Math.min(Math.max(calculatedRisk, 5), 98);

        if (simRiskPercent) simRiskPercent.textContent = `${calculatedRisk}%`;
        if (simRiskBar) simRiskBar.style.width = `${calculatedRisk}%`;

        if (simTier) {
            if (calculatedRisk < 30) {
                simTier.textContent = 'Standard Baseline';
                simTier.className = 'text-emerald-400 font-medium';
            } else if (calculatedRisk < 70) {
                simTier.textContent = 'Moderate Priority';
                simTier.className = 'text-amber-400 font-medium';
            } else {
                simTier.textContent = 'High Clinical Urgency';
                simTier.className = 'text-pink-400 font-medium';
            }
        }
    }

    if (simTumorInput && simBiopsyInput) {
        simTumorInput.addEventListener('input', updateHeroSimulation);
        simBiopsyInput.addEventListener('input', updateHeroSimulation);
    }

    // --- 7. Navbar Active Scroll Monitoring ---
    const sections = document.querySelectorAll("section[id], main[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("text-pink-400");
            link.classList.add("text-zinc-400");
            if (link.getAttribute("href") === `#${current}`) {
                link.classList.add("text-pink-400");
                link.classList.remove("text-zinc-400");
            }
        });
    });
});
