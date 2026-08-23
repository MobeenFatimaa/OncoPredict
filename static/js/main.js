document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // 1. ELEMENT REFERENCES
    // =========================================================

    const fillBtn = document.getElementById("fillDefaultsBtn");
    const form = document.getElementById("predictForm");

    const toggleBtn = document.getElementById("toggle-chat-btn");
    const closeBtn = document.getElementById("close-chat-btn");

    const chatBox = document.getElementById("ai-chat-box");
    const chatIconOpen = document.getElementById("chat-icon-open");
    const chatIconClose = document.getElementById("chat-icon-close");

    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");


    // =========================================================
    // 2. AUTOFILL SAMPLE DATA
    // =========================================================

    if (fillBtn) {

        fillBtn.addEventListener("click", () => {

            document
                .querySelectorAll('input[type="number"]')
                .forEach((input) => {

                    const name = (input.name || "").toLowerCase();

                    if (name.includes("age")) {
                        input.value = 38;
                    }

                    else if (name.includes("bmi")) {
                        input.value = 22.4;
                    }

                    else if (name.includes("tumor")) {
                        input.value = 0.8;
                    }

                    else if (name.includes("pressure")) {
                        input.value = 118;
                    }

                    else if (name.includes("cholesterol")) {
                        input.value = 175;
                    }

                    else if (name.includes("income")) {
                        input.value = 55000;
                    }

                    else if (name.includes("exercise")) {
                        input.value = 4;
                    }

                    else {
                        input.value = 0;
                    }

                });


            document
                .querySelectorAll("select")
                .forEach((select) => {
                    select.value = "0";
                });

        });

    }


    // =========================================================
    // 3. FEATURE TAB FILTERING
    // =========================================================

    const tabButtons = document.querySelectorAll(".tab-btn");
    const featureItems = document.querySelectorAll(".feature-item");

    tabButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const filter = button.getAttribute("data-filter");

            tabButtons.forEach((btn) => {

                btn.classList.remove(
                    "bg-pink-600",
                    "text-white",
                    "shadow-md",
                    "shadow-pink-600/20"
                );

                btn.classList.add(
                    "text-zinc-400",
                    "hover:text-white",
                    "hover:bg-zinc-900"
                );

            });


            button.classList.add(
                "bg-pink-600",
                "text-white",
                "shadow-md",
                "shadow-pink-600/20"
            );

            button.classList.remove(
                "text-zinc-400",
                "hover:text-white",
                "hover:bg-zinc-900"
            );


            featureItems.forEach((item) => {

                const category = item.getAttribute("data-category");

                if (filter === "all" || category === filter) {

                    item.style.display = "";

                }

                else {

                    item.style.display = "none";

                }

            });

        });

    });


    // =========================================================
    // 4. FORM SUBMISSION / MODEL PREDICTION
    // =========================================================

    if (form) {

        form.addEventListener("submit", async function (e) {

            e.preventDefault();

            const submitBtn = document.getElementById("submitBtn");
            const idleState = document.getElementById("idleState");
            const resultBox = document.getElementById("resultBox");

            if (!submitBtn) {
                return;
            }


            // Disable button
            submitBtn.disabled = true;


            // Loading state
            submitBtn.innerHTML = `
                <svg
                    class="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    ></circle>

                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>

                <span>
                    Running Inference Engine...
                </span>
            `;


            // Build JSON payload
            const formData = new FormData(this);
            const payload = {};

            formData.forEach((value, key) => {
                payload[key] = value;
            });


            try {

                const response = await fetch("/api/predict", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(payload)

                });


                let data;

                try {
                    data = await response.json();
                }

                catch (jsonError) {

                    throw new Error(
                        `Server returned an invalid response. HTTP ${response.status}`
                    );

                }


                if (response.ok && data.status === "success") {

                    if (idleState) {
                        idleState.classList.add("hidden");
                    }

                    if (resultBox) {
                        resultBox.classList.remove("hidden");
                    }


                    const statusBanner =
                        document.getElementById("statusBanner");

                    const resultLabel =
                        document.getElementById("resultLabel");

                    const resultSubtitle =
                        document.getElementById("resultSubtitle");

                    const actionText =
                        document.getElementById("actionText");


                    // =================================================
                    // MALIGNANT RESULT
                    // =================================================

                    if (data.diagnosis === "Malignant") {

                        if (statusBanner) {

                            statusBanner.className =
                                "p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-lg shadow-rose-900/10 flex flex-col items-center text-center transition-all";

                        }


                        if (resultLabel) {
                            resultLabel.innerText = "MALIGNANT";
                        }


                        if (resultSubtitle) {

                            resultSubtitle.innerText =
                                "Elevated risk indicators detected.";

                        }


                        if (actionText) {

                            actionText.innerText =
                                "High likelihood of malignancy detected. Flag for immediate secondary clinical review, additional diagnostic imaging, and biopsy verification.";

                        }

                    }


                    // =================================================
                    // BENIGN RESULT
                    // =================================================

                    else {

                        if (statusBanner) {

                            statusBanner.className =
                                "p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-900/10 flex flex-col items-center text-center transition-all";

                        }


                        if (resultLabel) {
                            resultLabel.innerText = "BENIGN";
                        }


                        if (resultSubtitle) {

                            resultSubtitle.innerText =
                                "Low risk profile within safe diagnostic ranges.";

                        }


                        if (actionText) {

                            actionText.innerText =
                                "Parameters indicate a low-risk profile. Continue routine patient monitoring according to standard clinical protocol.";

                        }

                    }


                    // =================================================
                    // RISK SCORE
                    // =================================================

                    const riskScore =
                        Number(data.risk_score);


                    const confidence =
                        Number(data.confidence);


                    const safeRisk = Number.isFinite(riskScore)
                        ? Math.min(Math.max(riskScore, 0), 100)
                        : 0;


                    const safeConfidence = Number.isFinite(confidence)
                        ? Math.min(Math.max(confidence, 0), 100)
                        : 0;


                    const riskScoreVal =
                        document.getElementById("riskScoreVal");

                    const riskBar =
                        document.getElementById("riskBar");

                    const confidenceVal =
                        document.getElementById("confidenceVal");

                    const confidenceBar =
                        document.getElementById("confidenceBar");


                    if (riskScoreVal) {

                        riskScoreVal.innerText =
                            `${safeRisk.toFixed(1)}%`;

                    }


                    if (riskBar) {

                        riskBar.style.width =
                            `${safeRisk}%`;

                    }


                    if (confidenceVal) {

                        confidenceVal.innerText =
                            `${safeConfidence.toFixed(1)}%`;

                    }


                    if (confidenceBar) {

                        confidenceBar.style.width =
                            `${safeConfidence}%`;

                    }

                }


                // =================================================
                // SERVER ERROR
                // =================================================

                else {

                    const errorMessage =
                        data?.error ||
                        "Failed to process diagnosis.";

                    alert(
                        `Inference Error: ${errorMessage}`
                    );

                }

            }


            // =====================================================
            // CONNECTION ERROR
            // =====================================================

            catch (err) {

                console.error(
                    "Prediction request failed:",
                    err
                );


                alert(
                    "Server Connection Failed. Please check your Flask API and Vercel deployment logs."
                );

            }


            // =====================================================
            // RESTORE BUTTON
            // =====================================================

            finally {

                submitBtn.disabled = false;


                submitBtn.innerHTML = `
                    <span>
                        Execute Diagnostic Assessment
                    </span>

                    <svg
                        class="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                    </svg>
                `;

            }

        });

    }


    // =========================================================
    // 5. AI CHAT ASSISTANT
    // =========================================================

    function scrollToBottom() {

        if (!chatMessages) {
            return;
        }


        requestAnimationFrame(() => {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        });

    }


    function toggleChat() {

        if (!chatBox) {
            return;
        }


        const isHidden =
            chatBox.classList.contains("hidden");


        if (!isHidden) {

            chatBox.classList.add(
                "opacity-0",
                "scale-95"
            );


            setTimeout(() => {

                chatBox.classList.add("hidden");

            }, 200);


            if (chatIconOpen) {
                chatIconOpen.classList.remove("hidden");
            }


            if (chatIconClose) {
                chatIconClose.classList.add("hidden");
            }


            if (toggleBtn) {
                toggleBtn.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }

        }


        else {

            chatBox.classList.remove("hidden");


            setTimeout(() => {

                chatBox.classList.remove(
                    "opacity-0",
                    "scale-95"
                );

            }, 10);


            if (chatIconOpen) {
                chatIconOpen.classList.add("hidden");
            }


            if (chatIconClose) {
                chatIconClose.classList.remove("hidden");
            }


            if (toggleBtn) {
                toggleBtn.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }


            scrollToBottom();

        }

    }


    if (toggleBtn) {
        toggleBtn.addEventListener(
            "click",
            toggleChat
        );
    }


    if (closeBtn) {
        closeBtn.addEventListener(
            "click",
            toggleChat
        );
    }


    // =========================================================
    // SAFE HTML ESCAPING
    // =========================================================

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent = value;

        return div.innerHTML;

    }


    // =========================================================
    // APPEND CHAT MESSAGE
    // =========================================================

    function appendMessage(sender, text) {

        if (!chatMessages) {
            return;
        }


        const isUser =
            sender === "user";


        const msgDiv =
            document.createElement("div");


        msgDiv.className =
            `flex gap-2.5 items-start ${
                isUser ? "flex-row-reverse" : ""
            }`;


        const safeText =
            isUser
                ? escapeHtml(text)
                : text;


        msgDiv.innerHTML = `

            <div
                class="w-6 h-6 rounded-lg ${
                    isUser
                        ? "bg-zinc-800 border border-zinc-700 text-zinc-300"
                        : "bg-pink-500/10 border border-pink-500/20 text-pink-400"
                } flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono"
            >
                ${isUser ? "YOU" : "AI"}
            </div>


            <div
                class="${
                    isUser
                        ? "bg-pink-600 text-white"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-300"
                } p-3 rounded-2xl ${
                    isUser
                        ? "rounded-tr-xs"
                        : "rounded-tl-xs"
                } max-w-[85%] leading-relaxed"
            >
                ${safeText}
            </div>

        `;


        chatMessages.appendChild(msgDiv);

        scrollToBottom();

    }


    // =========================================================
    // AI RESPONSE ENGINE
    // =========================================================

    function getAiResponse(query) {

        const q =
            query
                .toLowerCase()
                .trim();


        // -------------------------------------------------------
        // PLATFORM
        // -------------------------------------------------------

        if (
            /(what|how).*(website|app|platform|tool|system|purpose|do|use)/i.test(q) ||
            q.includes("help") ||
            q.includes("what is oncobredict") ||
            q.includes("what is oncopredict")
        ) {

            return `
                <strong>OncoPredict</strong> is an AI decision support tool.
                It processes clinical inputs to estimate breast cancer risk,
                explains model decisions through feature importance,
                and maps outputs to risk-stratification workflows.
            `;

        }


        // -------------------------------------------------------
        // BREAST CANCER
        // -------------------------------------------------------

        if (
            /(what|explain|define).*(breast cancer|cancer|malignan)/i.test(q) ||
            /(whta|cancr|tumor)/i.test(q)
        ) {

            return `
                <strong>Breast cancer</strong> occurs when abnormal breast
                cells grow uncontrollably and may form tumors.
                OncoPredict focuses on risk estimation using clinical,
                pathological, demographic, and lifestyle indicators.
            `;

        }


        // -------------------------------------------------------
        // BENIGN / MALIGNANT
        // -------------------------------------------------------

        if (
            /(benign|malignant|difference|type|tumor)/i.test(q)
        ) {

            return `
                <strong>Benign tumors</strong> are generally non-cancerous
                and localized, while <strong>malignant tumors</strong>
                are cancerous and may invade surrounding tissues or spread
                to other parts of the body.
            `;

        }


        // -------------------------------------------------------
        // SYMPTOMS
        // -------------------------------------------------------

        if (
            /(symptom|sign|warning|look for|detect)/i.test(q)
        ) {

            return `
                Common warning signs may include:<br>
                • A breast lump or unusual thickening<br>
                • Changes in breast size or shape<br>
                • Skin dimpling or unusual skin changes<br>
                • Nipple inversion or abnormal discharge
            `;

        }


        // -------------------------------------------------------
        // RISK FACTORS
        // -------------------------------------------------------

        if (
            /(risk factor|cause|hereditary|genetic|brca|family history)/i.test(q)
        ) {

            return `
                Important breast cancer risk factors can include
                <strong>BRCA1/BRCA2 mutations</strong>, increasing age,
                family or personal history, dense breast tissue,
                and certain hormonal or lifestyle factors.
            `;

        }


        // -------------------------------------------------------
        // MODEL
        // -------------------------------------------------------

        if (
            /(model|lightgbm|algorithm|tech stack|how it works|architecture|predict)/i.test(q)
        ) {

            return `
                The backend uses a
                <strong>LightGBM (Light Gradient Boosting Machine)</strong>
                pipeline designed for tabular clinical feature processing.
                The model evaluates the supplied feature vector and returns
                a classification together with risk and confidence values.
            `;

        }


        // -------------------------------------------------------
        // METRICS
        // -------------------------------------------------------

        if (
            /(metric|accuracy|roc|auc|precision|recall|sensitivity|latency|speed)/i.test(q)
        ) {

            return `
                Current validation figures displayed by the platform:<br>
                • <strong>ROC-AUC:</strong> 0.964<br>
                • <strong>Sensitivity (Recall):</strong> 94.8%<br>
                • <strong>Precision:</strong> 92.3%<br>
                • <strong>Inference Latency:</strong> 11.4ms
            `;

        }


        // -------------------------------------------------------
        // FEATURE IMPORTANCE / SHAP
        // -------------------------------------------------------

        if (
            /(shap|feature|importance|weight|driver|factor)/i.test(q)
        ) {

            return `
                The displayed top diagnostic drivers are:<br>
                1. <strong>Biopsy Pathological Grade:</strong> 0.284<br>
                2. <strong>Tumor Dimensions:</strong> 0.210<br>
                3. <strong>Genetic Biomarkers:</strong> 0.185<br>
                4. <strong>Patient Age & Menopause State:</strong> 0.142
            `;

        }


        // -------------------------------------------------------
        // RISK TIERS
        // -------------------------------------------------------

        if (
            /(tier|protocol|guideline|low risk|moderate risk|high risk|action|workflow)/i.test(q)
        ) {

            return `
                The platform presents three risk tiers:<br>
                🟢 <strong>Low (&lt;30%):</strong>
                Standard baseline monitoring.<br>
                🟡 <strong>Moderate (30–70%):</strong>
                Secondary evaluation and monitoring.<br>
                🔴 <strong>High (&gt;70%):</strong>
                Priority clinical review and diagnostic verification.
            `;

        }


        // -------------------------------------------------------
        // DATASET
        // -------------------------------------------------------

        if (
            /(data|dataset|training|synthetic|faker|validation|sample)/i.test(q)
        ) {

            return `
                The platform is designed around clinical-style tabular
                inputs and can be evaluated using real or synthetic
                datasets. Synthetic data pipelines can be useful for
                testing edge cases while avoiding exposure of real patient
                information.
            `;

        }


        // -------------------------------------------------------
        // PRIVACY
        // -------------------------------------------------------

        if (
            /(privacy|security|hipaa|safe|store|data protection)/i.test(q)
        ) {

            return `
                OncoPredict is designed as an inference-oriented decision
                support interface. Avoid entering personally identifiable
                or sensitive patient information into demonstration
                environments unless the deployment has been appropriately
                secured and configured.
            `;

        }


        // -------------------------------------------------------
        // MEDICAL DISCLAIMER
        // -------------------------------------------------------

        if (
            /(doctor|medical advice|replace doctor|diagnostic|diagnosis)/i.test(q)
        ) {

            return `
                ⚠️ <strong>Medical Disclaimer:</strong>
                OncoPredict is an AI screening and decision-support concept.
                It does not replace a qualified healthcare professional,
                pathology report, imaging interpretation, or formal clinical
                diagnosis.
            `;

        }


        // -------------------------------------------------------
        // DEPLOYMENT
        // -------------------------------------------------------

        if (
            /(host|deploy|vercel|flask|backend|api)/i.test(q)
        ) {

            return `
                The application uses a Python/Flask backend and exposes
                prediction functionality through a REST-style API endpoint.
                The frontend is structured for deployment through Vercel
                using the project's deployment configuration.
            `;

        }


        // -------------------------------------------------------
        // CREATOR
        // -------------------------------------------------------

        if (
            /(who|creator|developer|author|built|made|mobeen)/i.test(q)
        ) {

            return `
                OncoPredict was engineered by
                <strong>Mobeen Fatima</strong>, with the project focused
                on machine learning, predictive modeling, synthetic data
                engineering, and health-tech web application development.
            `;

        }


        // -------------------------------------------------------
        // GREETING
        // -------------------------------------------------------

        if (
            /^(hi|hello|hey|greetings|good morning|good evening)\b/i.test(q)
        ) {

            return `
                Hello! I am your OncoPredict AI Assistant.
                You can ask me about <strong>breast cancer risk factors</strong>,
                <strong>LightGBM</strong>,
                <strong>model metrics</strong>,
                <strong>feature importance</strong>,
                or <strong>risk tiers</strong>.
            `;

        }


        // -------------------------------------------------------
        // DEFAULT
        // -------------------------------------------------------

        return `
            I can answer questions about
            <strong>OncoPredict's purpose</strong>,
            <strong>breast cancer risk factors</strong>,
            <strong>LightGBM</strong>,
            <strong>model metrics</strong>,
            <strong>feature importance</strong>,
            and <strong>risk stratification</strong>.
            What would you like to explore?
        `;

    }


    // =========================================================
    // SEND CHAT MESSAGE
    // =========================================================

    function handleSend(text) {

        if (!text || !text.trim()) {
            return;
        }


        const cleanedText =
            text.trim();


        appendMessage(
            "user",
            cleanedText
        );


        const suggestions =
            document.getElementById(
                "suggested-queries"
            );


        if (suggestions) {
            suggestions.remove();
        }


        setTimeout(() => {

            const botReply =
                getAiResponse(cleanedText);


            appendMessage(
                "ai",
                botReply
            );

        }, 400);

    }


    // =========================================================
    // QUICK QUERY FUNCTION
    // IMPORTANT:
    // Exposed globally because HTML uses onclick=""
    // =========================================================

    window.sendQuickQuery = function (text) {

        handleSend(text);

    };


    // =========================================================
    // CHAT FORM SUBMIT
    // =========================================================

    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            (e) => {

                e.preventDefault();


                if (!chatInput) {
                    return;
                }


                const text =
                    chatInput.value;


                chatInput.value = "";


                handleSend(text);


                chatInput.focus();

            }
        );

    }


    // =========================================================
    // 6. HERO DYNAMIC SIMULATOR
    // =========================================================

    const simTumorInput =
        document.getElementById(
            "simTumorSize"
        );

    const simBiopsyInput =
        document.getElementById(
            "simBiopsyScore"
        );

    const simTumorVal =
        document.getElementById(
            "simTumorVal"
        );

    const simBiopsyVal =
        document.getElementById(
            "simBiopsyVal"
        );

    const simRiskPercent =
        document.getElementById(
            "simRiskPercent"
        );

    const simRiskBar =
        document.getElementById(
            "simRiskBar"
        );

    const simTier =
        document.getElementById(
            "simTier"
        );


    function updateHeroSimulation() {

        if (
            !simTumorInput ||
            !simBiopsyInput
        ) {
            return;
        }


        const tumorSize =
            parseFloat(
                simTumorInput.value
            );


        const biopsyGrade =
            parseInt(
                simBiopsyInput.value,
                10
            );


        if (
            !Number.isFinite(tumorSize) ||
            !Number.isFinite(biopsyGrade)
        ) {
            return;
        }


        if (simTumorVal) {

            simTumorVal.textContent =
                `${tumorSize.toFixed(1)} cm`;

        }


        if (simBiopsyVal) {

            simBiopsyVal.textContent =
                `Stage ${biopsyGrade}`;

        }


        // Demonstration-only simulator formula.
        let calculatedRisk =
            Math.round(
                (tumorSize / 6.0) * 45 +
                (biopsyGrade / 4.0) * 50 +
                5
            );


        calculatedRisk =
            Math.min(
                Math.max(
                    calculatedRisk,
                    5
                ),
                98
            );


        if (simRiskPercent) {

            simRiskPercent.textContent =
                `${calculatedRisk}%`;

        }


        if (simRiskBar) {

            simRiskBar.style.width =
                `${calculatedRisk}%`;

        }


        if (simTier) {

            if (calculatedRisk < 30) {

                simTier.textContent =
                    "Standard Baseline";

                simTier.className =
                    "text-emerald-400 font-medium";

            }

            else if (calculatedRisk < 70) {

                simTier.textContent =
                    "Moderate Priority";

                simTier.className =
                    "text-amber-400 font-medium";

            }

            else {

                simTier.textContent =
                    "High Clinical Urgency";

                simTier.className =
                    "text-pink-400 font-medium";

            }

        }

    }


    if (
        simTumorInput &&
        simBiopsyInput
    ) {

        simTumorInput.addEventListener(
            "input",
            updateHeroSimulation
        );


        simBiopsyInput.addEventListener(
            "input",
            updateHeroSimulation
        );


        // FIX:
        // Calculate the correct initial value.
        updateHeroSimulation();

    }


    // =========================================================
    // 7. NAVBAR ACTIVE SECTION MONITORING
    // =========================================================

    const sections =
        document.querySelectorAll(
            "section[id], main[id]"
        );


    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    function updateActiveNav() {

        let current = "";


        sections.forEach((section) => {

            const sectionTop =
                section.offsetTop - 140;


            if (
                window.scrollY >= sectionTop
            ) {

                current =
                    section.getAttribute(
                        "id"
                    );

            }

        });


        navLinks.forEach((link) => {

            link.classList.remove(
                "text-pink-400"
            );

            link.classList.add(
                "text-zinc-400"
            );


            if (
                link.getAttribute("href") ===
                `#${current}`
            ) {

                link.classList.add(
                    "text-pink-400"
                );

                link.classList.remove(
                    "text-zinc-400"
                );

            }

        });

    }


    window.addEventListener(
        "scroll",
        updateActiveNav,
        { passive: true }
    );


    // Run once on initial load.
    updateActiveNav();


    // =========================================================
    // 8. ESCAPE KEY CLOSES CHAT
    // =========================================================

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                chatBox &&
                !chatBox.classList.contains("hidden")
            ) {

                toggleChat();

            }

        }
    );

});
