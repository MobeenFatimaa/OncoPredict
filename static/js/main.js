document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENT REFERENCES
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

    const featureContainer =
        document.getElementById("featureContainer");

    const featureCount =
        document.getElementById("featureCount");


    // =========================================================
    // LOAD FEATURES FROM BACKEND
    // =========================================================

    async function loadFeaturesFromBackend() {

        if (!featureContainer) return;

        try {

            const response = await fetch("/api/features", {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(
                    `Feature API returned ${response.status}`
                );
            }

            const data = await response.json();

            if (
                data.status !== "success" ||
                !Array.isArray(data.features) ||
                data.features.length === 0
            ) {
                throw new Error(
                    "Backend returned no model features."
                );
            }

            // If Jinja already rendered inputs,
            // don't duplicate them.
            const existingInputs =
                featureContainer.querySelectorAll(
                    "input[name], select[name]"
                );

            if (existingInputs.length > 0) {

                if (featureCount) {
                    featureCount.textContent =
                        existingInputs.length;
                }

                return;
            }

            renderFeatures(data.features);

        } catch (error) {

            console.error(
                "Feature loading error:",
                error
            );

            const loadingState =
                document.getElementById(
                    "featureLoadingState"
                );

            if (loadingState) {

                loadingState.innerHTML = `
                    <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                        <svg
                            class="w-6 h-6 text-rose-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v4m0 4h.01M10.3 3h3.4L21 16.5a2 2 0 0 1-1.73 3H4.73A2 2 0 0 1 3 16.5L10.3 3z"
                            />
                        </svg>
                    </div>

                    <p class="text-sm font-medium text-rose-300">
                        Diagnostic Parameters Unavailable
                    </p>

                    <p class="text-xs text-zinc-500 mt-1 max-w-md">
                        The Vercel inference function could not load
                        the model feature configuration.
                    </p>

                    <button
                        type="button"
                        id="retryFeaturesBtn"
                        class="mt-4 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition"
                    >
                        Retry Connection
                    </button>
                `;

                const retryBtn =
                    document.getElementById(
                        "retryFeaturesBtn"
                    );

                if (retryBtn) {

                    retryBtn.addEventListener(
                        "click",
                        loadFeaturesFromBackend
                    );
                }
            }
        }
    }


    // =========================================================
    // RENDER FEATURES DYNAMICALLY
    // =========================================================

    function renderFeatures(features) {

        if (!featureContainer) return;

        featureContainer.innerHTML = "";

        features.forEach((feature) => {

            const item =
                document.createElement("div");

            const category =
                getFeatureCategory(feature);

            item.className =
                "feature-item flex flex-col justify-end bg-zinc-900/40 p-3 rounded-xl border border-zinc-900/80 hover:border-zinc-800 transition-colors";

            item.dataset.category = category;

            const label =
                document.createElement("label");

            label.htmlFor = feature;

            label.className =
                "block text-xs font-medium text-zinc-300 mb-1.5 capitalize tracking-wide";

            label.textContent =
                cleanFeatureName(feature);


            if (isSelectFeature(feature)) {

                const wrapper =
                    document.createElement("div");

                wrapper.className = "relative";

                const select =
                    document.createElement("select");

                select.name = feature;
                select.id = feature;
                select.required = true;

                select.className =
                    "w-full appearance-none bg-black/80 border border-zinc-800 rounded-xl px-3 py-2 pr-9 text-xs text-zinc-100 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/80 transition cursor-pointer";

                const positive =
                    document.createElement("option");

                positive.value = "1";
                positive.textContent =
                    "Yes / Positive";

                const negative =
                    document.createElement("option");

                negative.value = "0";
                negative.textContent =
                    "No / Negative";
                negative.selected = true;

                select.appendChild(positive);
                select.appendChild(negative);


                const arrow =
                    document.createElement("span");

                arrow.className =
                    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-pink-500";

                arrow.innerHTML = "⌄";

                wrapper.appendChild(select);
                wrapper.appendChild(arrow);

                item.appendChild(label);
                item.appendChild(wrapper);

            } else {

                const input =
                    document.createElement("input");

                input.type = "number";
                input.step = "any";
                input.name = feature;
                input.id = feature;
                input.required = true;

                input.placeholder =
                    getPlaceholder(feature);

                input.className =
                    "w-full bg-black/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-500/80 focus:ring-1 focus:ring-pink-500/80 transition";

                item.appendChild(label);
                item.appendChild(input);
            }

            featureContainer.appendChild(item);
        });


        if (featureCount) {
            featureCount.textContent =
                features.length;
        }

        initializeTabs();
    }


    // =========================================================
    // FEATURE HELPERS
    // =========================================================

    function cleanFeatureName(feature) {

        return feature
            .replace("_Yes", "")
            .replace("_Male", "")
            .replace("_High", "")
            .replace("_Low", "")
            .replaceAll("_", " ");
    }


    function getFeatureCategory(feature) {

        const lifestyleKeywords = [
            "Age",
            "Gender",
            "BMI",
            "Activity",
            "Smok",
            "Alcohol",
            "Diet",
            "Genetic",
            "History",
            "Menopause"
        ];

        return lifestyleKeywords.some(
            keyword => feature.includes(keyword)
        )
            ? "lifestyle"
            : "clinical";
    }


    function isSelectFeature(feature) {

        return (
            feature.endsWith("_Yes") ||
            feature.endsWith("_Male") ||
            feature.includes("Biopsy") ||
            feature.includes("Mammogram") ||
            feature.includes("Menopause") ||
            feature.includes("Activity") ||
            feature.includes("Genetic")
        );
    }


    function getPlaceholder(feature) {

        if (feature.includes("Age")) {
            return "52";
        }

        if (feature.includes("BMI")) {
            return "24.5";
        }

        if (feature.includes("Tumor")) {
            return "1.5";
        }

        if (feature.includes("Pressure")) {
            return "120";
        }

        if (feature.includes("Cholesterol")) {
            return "180";
        }

        if (feature.includes("Income")) {
            return "55000";
        }

        if (feature.includes("Exercise")) {
            return "4";
        }

        return "0.0";
    }


    // =========================================================
    // AUTOFILL
    // =========================================================

    function autofillForm() {

        if (!form) return;

        form.querySelectorAll(
            'input[type="number"]'
        ).forEach(input => {

            const name =
                input.name.toLowerCase();

            if (name.includes("age")) {
                input.value = 38;

            } else if (name.includes("bmi")) {
                input.value = 22.4;

            } else if (name.includes("tumor")) {
                input.value = 0.8;

            } else if (name.includes("pressure")) {
                input.value = 118;

            } else if (name.includes("cholesterol")) {
                input.value = 175;

            } else if (name.includes("income")) {
                input.value = 55000;

            } else if (name.includes("exercise")) {
                input.value = 4;

            } else {
                input.value = 0;
            }
        });


        form.querySelectorAll("select")
            .forEach(select => {
                select.value = "0";
            });
    }


    if (fillBtn) {

        fillBtn.addEventListener(
            "click",
            autofillForm
        );
    }


    // =========================================================
    // TABS
    // =========================================================

    function initializeTabs() {

        const tabButtons =
            document.querySelectorAll(
                ".tab-btn"
            );

        const featureItems =
            document.querySelectorAll(
                ".feature-item"
            );

        tabButtons.forEach(button => {

            button.onclick = () => {

                const filter =
                    button.dataset.filter;

                tabButtons.forEach(btn => {

                    btn.classList.remove(
                        "bg-pink-600",
                        "text-white",
                        "shadow-md",
                        "shadow-pink-600/20"
                    );

                    btn.classList.add(
                        "text-zinc-400"
                    );
                });


                button.classList.add(
                    "bg-pink-600",
                    "text-white",
                    "shadow-md",
                    "shadow-pink-600/20"
                );

                button.classList.remove(
                    "text-zinc-400"
                );


                featureItems.forEach(item => {

                    if (
                        filter === "all" ||
                        item.dataset.category === filter
                    ) {

                        item.style.display = "";

                    } else {

                        item.style.display = "none";
                    }
                });
            };
        });
    }


    initializeTabs();


    // =========================================================
    // FORM SUBMISSION
    // =========================================================

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const submitBtn =
                    document.getElementById(
                        "submitBtn"
                    );

                const idleState =
                    document.getElementById(
                        "idleState"
                    );

                const resultBox =
                    document.getElementById(
                        "resultBox"
                    );


                if (!submitBtn) return;


                // Validate
                const requiredFields =
                    form.querySelectorAll(
                        "[required]"
                    );

                for (const field of requiredFields) {

                    if (!field.value) {

                        field.focus();

                        alert(
                            "Please complete all diagnostic parameters."
                        );

                        return;
                    }
                }


                submitBtn.disabled = true;

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


                const formData =
                    new FormData(form);

                const payload = {};

                formData.forEach(
                    (value, key) => {
                        payload[key] = value;
                    }
                );


                try {

                    const response =
                        await fetch(
                            "/api/predict",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        response.ok &&
                        data.status === "success"
                    ) {

                        if (idleState) {
                            idleState.classList.add(
                                "hidden"
                            );
                        }

                        if (resultBox) {
                            resultBox.classList.remove(
                                "hidden"
                            );
                        }


                        const statusBanner =
                            document.getElementById(
                                "statusBanner"
                            );

                        const resultLabel =
                            document.getElementById(
                                "resultLabel"
                            );

                        const resultSubtitle =
                            document.getElementById(
                                "resultSubtitle"
                            );

                        const actionText =
                            document.getElementById(
                                "actionText"
                            );


                        if (
                            data.diagnosis ===
                            "Malignant"
                        ) {

                            if (statusBanner) {

                                statusBanner.className =
                                    "p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-rose-900/10";
                            }

                            if (resultLabel) {
                                resultLabel.textContent =
                                    "MALIGNANT";
                            }

                            if (resultSubtitle) {
                                resultSubtitle.textContent =
                                    "Elevated risk indicators detected.";
                            }

                            if (actionText) {
                                actionText.textContent =
                                    "High likelihood of malignancy detected. Flag for immediate secondary clinical review, additional diagnostic imaging, and biopsy verification.";
                            }

                        } else {

                            if (statusBanner) {

                                statusBanner.className =
                                    "p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-emerald-900/10";
                            }

                            if (resultLabel) {
                                resultLabel.textContent =
                                    "BENIGN";
                            }

                            if (resultSubtitle) {
                                resultSubtitle.textContent =
                                    "Low risk profile within safe diagnostic ranges.";
                            }

                            if (actionText) {
                                actionText.textContent =
                                    "Parameters indicate a low-risk profile. Continue routine patient monitoring according to standard clinical protocol.";
                            }
                        }


                        const risk =
                            Number(
                                data.risk_score || 0
                            );

                        const confidence =
                            Number(
                                data.confidence || 0
                            );


                        const riskValue =
                            document.getElementById(
                                "riskScoreVal"
                            );

                        const riskBar =
                            document.getElementById(
                                "riskBar"
                            );

                        const confidenceValue =
                            document.getElementById(
                                "confidenceVal"
                            );

                        const confidenceBar =
                            document.getElementById(
                                "confidenceBar"
                            );


                        if (riskValue) {
                            riskValue.textContent =
                                `${risk}%`;
                        }

                        if (riskBar) {
                            riskBar.style.width =
                                `${risk}%`;
                        }

                        if (confidenceValue) {
                            confidenceValue.textContent =
                                `${confidence}%`;
                        }

                        if (confidenceBar) {
                            confidenceBar.style.width =
                                `${confidence}%`;
                        }


                    } else {

                        alert(
                            `Inference Error: ${
                                data.error ||
                                "Failed to process diagnosis."
                            }`
                        );
                    }

                } catch (error) {

                    console.error(
                        "Prediction error:",
                        error
                    );

                    alert(
                        "Server Connection Failed. Check the Vercel function logs."
                    );

                } finally {

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
            }
        );
    }


    // =========================================================
    // CHAT ASSISTANT
    // =========================================================

    function scrollToBottom() {

        if (!chatMessages) return;

        requestAnimationFrame(() => {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;
        });
    }


    function toggleChat() {

        if (!chatBox) return;

        const hidden =
            chatBox.classList.contains(
                "hidden"
            );


        if (hidden) {

            chatBox.classList.remove(
                "hidden"
            );

            setTimeout(() => {

                chatBox.classList.remove(
                    "opacity-0",
                    "scale-95"
                );

            }, 10);


            if (chatIconOpen) {
                chatIconOpen.classList.add(
                    "hidden"
                );
            }

            if (chatIconClose) {
                chatIconClose.classList.remove(
                    "hidden"
                );
            }

            scrollToBottom();

        } else {

            chatBox.classList.add(
                "opacity-0",
                "scale-95"
            );

            setTimeout(() => {

                chatBox.classList.add(
                    "hidden"
                );

            }, 200);


            if (chatIconOpen) {
                chatIconOpen.classList.remove(
                    "hidden"
                );
            }

            if (chatIconClose) {
                chatIconClose.classList.add(
                    "hidden"
                );
            }
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


    function appendMessage(
        sender,
        text
    ) {

        if (!chatMessages) return;

        const isUser =
            sender === "user";

        const message =
            document.createElement("div");

        message.className =
            `flex gap-2.5 items-start ${
                isUser
                    ? "flex-row-reverse"
                    : ""
            }`;

        message.innerHTML = `
            <div class="w-6 h-6 rounded-lg ${
                isUser
                    ? "bg-zinc-800 border border-zinc-700 text-zinc-300"
                    : "bg-pink-500/10 border border-pink-500/20 text-pink-400"
            } flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                ${isUser ? "YOU" : "AI"}
            </div>

            <div class="${
                isUser
                    ? "bg-pink-600 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-300"
            } p-3 rounded-2xl max-w-[85%] leading-relaxed">
                ${text}
            </div>
        `;

        chatMessages.appendChild(
            message
        );

        scrollToBottom();
    }


    function getAiResponse(query) {

        const q =
            query.toLowerCase().trim();


        if (
            q.includes("help") ||
            q.includes("what is oncopredict")
        ) {

            return `
                <strong>OncoPredict</strong>
                is an AI decision-support prototype
                for breast cancer risk assessment.
                It uses a machine-learning model to
                estimate the likelihood of a benign
                or malignant classification from the
                provided diagnostic parameters.
            `;
        }


        if (
            q.includes("benign") ||
            q.includes("malignant") ||
            q.includes("tumor")
        ) {

            return `
                <strong>Benign</strong> tumors are
                non-cancerous and localized, while
                <strong>malignant</strong> tumors are
                cancerous and may invade surrounding
                tissues. OncoPredict uses the trained
                classification model to estimate whether
                the provided feature profile is more
                consistent with a benign or malignant
                result.
            `;
        }


        if (
            q.includes("symptom") ||
            q.includes("warning")
        ) {

            return `
                Common warning signs can include a
                new breast lump, changes in breast
                size or shape, skin changes, nipple
                inversion, or unusual discharge.
            `;
        }


        if (
            q.includes("risk factor") ||
            q.includes("genetic") ||
            q.includes("brca")
        ) {

            return `
                Important risk factors include age,
                family history, inherited mutations
                such as BRCA1/BRCA2, dense breast
                tissue, and certain hormonal factors.
            `;
        }


        // =====================================================
        // UPDATED MODEL RESPONSE
        // SCIKIT-LEARN LOGISTIC REGRESSION
        // =====================================================

        if (
            q.includes("model") ||
            q.includes("logistic regression") ||
            q.includes("logistic") ||
            q.includes("algorithm") ||
            q.includes("scikit") ||
            q.includes("sklearn") ||
            q.includes("machine learning")
        ) {

            return `
                <strong>OncoPredict uses a
                scikit-learn Logistic Regression
                classifier</strong> for its breast cancer
                risk classification.

                Logistic Regression is a supervised
                machine-learning algorithm commonly used
                for binary classification. In this system,
                it evaluates the provided clinical and
                diagnostic features and estimates the
                probability of the input belonging to the
                benign or malignant class.

                Before prediction, the input features are
                processed using the trained
                <strong>scaler</strong> so that the feature
                values are presented to the model in the
                same numerical scale used during training.

                The trained model is stored as
                <strong>model.joblib</strong>, while the
                scaler and feature configuration are stored
                separately for consistent inference.
            `;
        }


        if (
            q.includes("accuracy") ||
            q.includes("metric") ||
            q.includes("auc") ||
            q.includes("precision") ||
            q.includes("recall")
        ) {

            return `
                The dashboard reports the project's
                configured validation metrics, which can
                include accuracy, ROC-AUC, precision,
                recall, sensitivity, specificity, and
                inference performance.

                These metrics describe how the trained
                Logistic Regression classifier performed
                during model evaluation. They should be
                interpreted together rather than relying
                on accuracy alone.
            `;
        }


        if (
            q.includes("privacy") ||
            q.includes("security")
        ) {

            return `
                The application is designed as an
                inference-oriented prototype and should
                not be used to store identifiable patient
                information.
            `;
        }


        if (
            q.includes("doctor") ||
            q.includes("medical advice") ||
            q.includes("diagnosis")
        ) {

            return `
                ⚠️ <strong>Medical Disclaimer:</strong>
                OncoPredict is a decision-support prototype
                and does not replace professional medical
                diagnosis, pathology, or clinical judgment.
                Predictions should be reviewed by qualified
                healthcare professionals.
            `;
        }


        if (
            q.includes("hello") ||
            q.includes("hi") ||
            q.includes("hey")
        ) {

            return `
                Hello! I am your
                <strong>OncoPredict AI Assistant</strong>.
                Ask me about the Logistic Regression model,
                risk factors, diagnostic features, model
                metrics, or dashboard functionality.
            `;
        }


        return `
            I can help with
            <strong>OncoPredict</strong>,
            scikit-learn Logistic Regression,
            breast cancer risk factors,
            model metrics, diagnostic features,
            and dashboard functionality.
        `;
    }


    function handleSend(text) {

        if (!text.trim()) return;

        appendMessage(
            "user",
            text
        );


        const suggestions =
            document.getElementById(
                "suggested-queries"
            );

        if (suggestions) {
            suggestions.remove();
        }


        setTimeout(() => {

            appendMessage(
                "ai",
                getAiResponse(text)
            );

        }, 400);
    }


    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const text =
                    chatInput
                        ? chatInput.value
                        : "";

                if (chatInput) {
                    chatInput.value = "";
                }

                handleSend(text);
            }
        );
    }


    // =========================================================
    // QUICK CHAT BUTTONS
    // =========================================================

    window.sendQuickQuery =
        function (text) {

            handleSend(text);
        };


    // =========================================================
    // HERO SIMULATOR
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


        if (simTumorVal) {

            simTumorVal.textContent =
                `${tumorSize.toFixed(1)} cm`;
        }


        if (simBiopsyVal) {

            simBiopsyVal.textContent =
                `Stage ${biopsyGrade}`;
        }


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

            } else if (
                calculatedRisk < 70
            ) {

                simTier.textContent =
                    "Moderate Priority";

                simTier.className =
                    "text-amber-400 font-medium";

            } else {

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

        updateHeroSimulation();
    }


    // =========================================================
    // NAVBAR ACTIVE SECTION
    // =========================================================

    const sections =
        document.querySelectorAll(
            "section[id], main[id]"
        );

    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    window.addEventListener(
        "scroll",
        () => {

            let current = "";

            sections.forEach(
                section => {

                    const sectionTop =
                        section.offsetTop -
                        120;

                    if (
                        window.scrollY >=
                        sectionTop
                    ) {

                        current =
                            section.getAttribute(
                                "id"
                            );
                    }
                }
            );


            navLinks.forEach(
                link => {

                    link.classList.remove(
                        "text-pink-400"
                    );

                    link.classList.add(
                        "text-zinc-400"
                    );


                    if (
                        link.getAttribute(
                            "href"
                        ) ===
                        `#${current}`
                    ) {

                        link.classList.add(
                            "text-pink-400"
                        );

                        link.classList.remove(
                            "text-zinc-400"
                        );
                    }
                }
            );
        }
    );


    // =========================================================
    // INITIALIZE
    // =========================================================

    loadFeaturesFromBackend();

});


document.addEventListener("DOMContentLoaded", function () {

    const featureCount =
        document.getElementById("featureCount");

    const featureItems =
        document.querySelectorAll(
            ".feature-item"
        );

    if (featureCount) {

        featureCount.textContent =
            featureItems.length;
    }

});
