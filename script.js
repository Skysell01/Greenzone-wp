document.addEventListener('DOMContentLoaded', function () {
    
    // ==========================================
    // 0. Configuration & Integrations (Webhook)
    // ==========================================
    const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzZtuSbhSGmNoPIqtxtjnQ1BqxV1N6exryvi5pJFWuC6zUcw56UKdv3JHxyZtNJgrVlGw/exec";

    // ==========================================
    // 1. Sticky Header Scroll Effect
    // ==========================================
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ==========================================
    // 2. FAQ Accordion Toggle
    // ==========================================
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            const faqItem = this.parentElement;
            const faqAnswer = faqItem.querySelector('.faq-answer');
            const isActive = faqItem.classList.contains('active');

            // Close all other FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-answer').style.maxHeight = null;
            });

            // Toggle current FAQ
            if (!isActive) {
                faqItem.classList.add('active');
                faqAnswer.style.maxHeight = faqAnswer.scrollHeight + "px";
            }
        });
    });

    // ==========================================
    // 3. Multi-Step Assessment Form Wizard
    // ==========================================
    let currentStep = 1;
    const totalSteps = 3;
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const valError = document.getElementById('wizard-val-error');
    
    const form = document.getElementById('diabetes-lead-form');
    const successScreen = document.getElementById('wizard-success');
    const formNavigation = document.querySelector('.form-navigation');
    const wizardProgress = document.querySelector('.wizard-progress');

    // Values stored from steps
    let selectedSugarLevel = "";
    let selectedSymptoms = [];

    // Card Selection Logic (Step 1 & Step 2)
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
        card.addEventListener('click', function () {
            const step = parseInt(this.getAttribute('data-step'));
            const val = this.getAttribute('data-value');
            valError.style.display = 'none'; // Clear error on select

            if (step === 1) {
                // Radio button behavior for Step 1
                document.querySelectorAll('.option-card[data-step="1"]').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                selectedSugarLevel = val;
                document.getElementById('sugar-level-input').value = val;
            } else if (step === 2) {
                // Checkbox behavior for Step 2
                this.classList.toggle('selected');
                
                if (this.classList.contains('selected')) {
                    if (!selectedSymptoms.includes(val)) {
                        selectedSymptoms.push(val);
                    }
                } else {
                    selectedSymptoms = selectedSymptoms.filter(item => item !== val);
                }
                document.getElementById('symptoms-input').value = selectedSymptoms.join(', ');
            }
        });
    });

    // Next / Submit Button Click
    nextBtn.addEventListener('click', function () {
        valError.style.display = 'none';

        if (currentStep === 1) {
            // Validate Step 1
            if (!selectedSugarLevel) {
                valError.textContent = "आगे बढ़ने के लिए कृपया शुगर लेवल चुनें।";
                valError.style.display = 'block';
                return;
            }
            goToStep(2);
        } else if (currentStep === 2) {
            // Validate Step 2
            if (selectedSymptoms.length === 0) {
                valError.textContent = "आगे बढ़ने के लिए कृपया कम से कम एक लक्षण चुनें।";
                valError.style.display = 'block';
                return;
            }
            goToStep(3);
        } else if (currentStep === 3) {
            // Validate Step 3 fields
            const nameInput = document.getElementById('patient-name');
            const phoneInput = document.getElementById('patient-phone');

            if (!nameInput.value.trim()) {
                valError.textContent = "कृपया मरीज का नाम दर्ज करें।";
                valError.style.display = 'block';
                nameInput.focus();
                return;
            }

            const phonePattern = /^[6-9]\d{9}$/;
            if (!phoneInput.value.trim() || !phonePattern.test(phoneInput.value.trim())) {
                valError.textContent = "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।";
                valError.style.display = 'block';
                phoneInput.focus();
                return;
            }

            // All valid - Submit form
            submitLeadForm(nameInput.value.trim(), phoneInput.value.trim());
        }
    });

    // Previous Button Click
    prevBtn.addEventListener('click', function () {
        valError.style.display = 'none';
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    });

    // Function to navigate steps
    function goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Show target step
        document.getElementById(`step-${step}`).classList.add('active');
        currentStep = step;

        // Update progress bar
        const percentage = (step / totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `स्टेप ${step}/${totalSteps}`;

        // Toggle buttons
        if (step === 1) {
            prevBtn.style.display = 'none';
            nextBtn.textContent = "अगला स्टेप →";
        } else if (step === 2) {
            prevBtn.style.display = 'block';
            nextBtn.textContent = "अगला स्टेप →";
        } else if (step === 3) {
            prevBtn.style.display = 'block';
            nextBtn.textContent = "फ्री डॉक्टर सलाह बुक करें";
        }
    }

    // Submit Lead function
    function submitLeadForm(name, phone) {
        const lead = {
            name: name,
            phone: phone,
            sugarLevel: selectedSugarLevel,
            symptoms: selectedSymptoms.join(', '),
            time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        };

        // Save to LocalStorage
        let leads = JSON.parse(localStorage.getItem('greenzone_leads')) || [];
        leads.push(lead);
        localStorage.setItem('greenzone_leads', JSON.stringify(leads));

        // Save to Google Sheet via Apps Script Webhook
        if (GOOGLE_SHEET_WEBHOOK_URL) {
            fetch(GOOGLE_SHEET_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: lead.name,
                    mobile: lead.phone,
                    sugarLevel: lead.sugarLevel,
                    symptoms: lead.symptoms
                })
            }).catch(error => {
                console.error("Error saving lead to Google Sheet:", error);
            });
        }

        // Create Whatsapp Redirect URL
        const whatsappNumber = "918962625757";
        // Translating symptom labels to Hindi for WhatsApp message readability
        const sugarLevelMap = {
            "Normal (100 - 140)": "नॉर्मल (100 - 140 mg/dL)",
            "Mild High (140 - 200)": "थोड़ा ज्यादा (140 - 200 mg/dL)",
            "Dangerously High (200 - 300)": "खतरनाक रूप से ज्यादा (200 - 300 mg/dL)",
            "Critical (300+)": "अति गंभीर (300+ mg/dL)"
        };
        const symptomMap = {
            "Pairon me Jalan/Jhanjhanahat": "पैरों में जलन और झनझनाहट",
            "Weakness/Thakan": "कमजोरी और थकान",
            "Frequent Toilet/Thirst": "बार-बार पेशाब आना और गला सूखना",
            "Dhundla Dikhna": "आंखों में धुंधलापन"
        };
        
        const hindiSugarLevel = sugarLevelMap[lead.sugarLevel] || lead.sugarLevel;
        const hindiSymptoms = selectedSymptoms.map(sym => symptomMap[sym] || sym).join(', ');

        const messageText = `नमस्ते डॉक्टर साहब,\n\nमैंने आपकी वेबसाइट पर फ्री कंसल्टेशन के लिए रजिस्टर किया है। मेरे विवरण नीचे दिए गए हैं:\n\n👤 *नाम:* ${lead.name}\n📞 *मोबाइल नंबर:* ${lead.phone}\n🩸 *शुगर लेवल:* ${hindiSugarLevel}\n⚠️ *लक्षण:* ${hindiSymptoms}\n\nकृपया मुझसे सीधे कॉल पर संपर्क करें। धन्यवाद!`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageText)}`;

        // Hide form and show success screen
        form.style.display = 'none';
        formNavigation.style.display = 'none';
        wizardProgress.style.display = 'none';
        
        const wsRedirectBtn = document.getElementById('btn-success-whatsapp-redirect');
        wsRedirectBtn.href = whatsappUrl;
        
        successScreen.style.display = 'block';
        
        // Autoredirect to WhatsApp after 2 seconds
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
        }, 2000);
    }

    // ==========================================
    // 4. Admin Panel Keyboard Shortcut (Ctrl+Alt+A)
    // ==========================================
    const adminModal = document.getElementById('admin-modal');
    const adminClose = document.getElementById('admin-modal-close');
    const leadsTableBody = document.getElementById('leads-table-body');
    const noLeadsMsg = document.getElementById('no-leads-msg');
    const clearLeadsBtn = document.getElementById('btn-clear-leads');

    // Show modal shortcut
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            loadLeadsTable();
            adminModal.style.display = 'flex';
        }
    });

    // Close modal
    adminClose.addEventListener('click', function () {
        adminModal.style.display = 'none';
    });

    // Close modal on click outside content
    window.addEventListener('click', function (e) {
        if (e.target === adminModal) {
            adminModal.style.display = 'none';
        }
    });

    // Clear leads
    clearLeadsBtn.addEventListener('click', function () {
        if (confirm("क्या आप सचमुच सभी मरीजों की जानकारी डिलीट करना चाहते हैं?")) {
            localStorage.removeItem('greenzone_leads');
            loadLeadsTable();
        }
    });

    // Load table data
    function loadLeadsTable() {
        leadsTableBody.innerHTML = "";
        const leads = JSON.parse(localStorage.getItem('greenzone_leads')) || [];

        if (leads.length === 0) {
            noLeadsMsg.style.display = 'block';
            return;
        }

        noLeadsMsg.style.display = 'none';
        
        const sugarLevelMap = {
            "Normal (100 - 140)": "नॉर्मल (100-140)",
            "Mild High (140 - 200)": "थोड़ा ज्यादा (140-200)",
            "Dangerously High (200 - 300)": "खतरनाक (200-300)",
            "Critical (300+)": "गंभीर (300+)"
        };
        const symptomMap = {
            "Pairon me Jalan/Jhanjhanahat": "पैरों में जलन/झनझनाहट",
            "Weakness/Thakan": "कमजोरी/थकान",
            "Frequent Toilet/Thirst": "बार-बार पेशाब/प्यास",
            "Dhundla Dikhna": "धुंधला दिखना"
        };

        // Populate table rows in reverse chronological order
        leads.reverse().forEach(lead => {
            const mappedSugar = sugarLevelMap[lead.sugarLevel] || lead.sugarLevel;
            const mappedSymptoms = lead.symptoms.split(', ').map(sym => symptomMap[sym] || sym).join(', ');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lead.time}</td>
                <td><strong>${escapeHTML(lead.name)}</strong></td>
                <td><a href="tel:${lead.phone}" style="color: var(--primary-light); font-weight:600;">${escapeHTML(lead.phone)}</a></td>
                <td><span style="color:var(--danger); font-weight:700;">${escapeHTML(mappedSugar)}</span></td>
                <td>${escapeHTML(mappedSymptoms)}</td>
            `;
            leadsTableBody.appendChild(row);
        });
    }

    // Escape HTML helper
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
