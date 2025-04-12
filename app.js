document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const voiceBtn = document.getElementById('voice-btn');
    const statusEl = document.getElementById('status');
    const transcriptionEl = document.getElementById('transcription');
    const responseArea = document.getElementById('response-area');
    const languageSelect = document.getElementById('language-select');
    
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        updateStatus("Speech recognition not supported in your browser. Try Chrome or Edge.", 'error');
        voiceBtn.disabled = true;
        return;
    }
    
    let recognition;
    let isListening = false;
    
    // ======================
    // TRANSLATION DICTIONARY
    // ======================
    const translations = {
        // Status messages
        listening: {
            en: "Listening... Speak your health question",
            hi: "सुन रहा हूँ... अपना स्वास्थ्य प्रश्न बोलें",
            bn: "শুনছি... আপনার স্বাস্থ্য প্রশ্ন জিজ্ঞাসা করুন",
            te: "వినడం... మీ ఆరోగ్య ప్రశ్నను అడగండి",
            ta: "கேட்கிறது... உங்கள் ஆரோக்கிய கேள்வியைக் கேளுங்கள்",
            ml: "കേൾക്കുന്നു... നിങ്ങളുടെ ആരോഗ്യ ചോദ്യം ഉച്ചരിക്കുക"
        },
        pressToAsk: {
            en: "Press the microphone button to ask your health question",
            hi: "अपना स्वास्थ्य प्रश्न पूछने के लिए माइक्रोफ़ोन बटन दबाएं",
            bn: "আপনার স্বাস্থ্য প্রশ্ন জিজ্ঞাসা করতে মাইক্রোফোন বাটন টিপুন",
            te: "మీ ఆరోగ్య ప్రశ్నను అడగడానికి మైక్రోఫోన్ బటన్ నొ�్కండి",
            ta: "உங்கள் ஆரோக்கிய கேள்வியைக் கேட்க மைக்ரோஃபோன் பொத்தானை அழுத்தவும்",
            ml: "നിങ്ങളുടെ ആരോഗ്യ ചോദ്യം ചോദിക്കാൻ മൈക്രോഫോൺ ബട്ടൺ അമർത്തുക"
        },
        processing: {
            en: "Processing your question...",
            hi: "आपके प्रश्न को संसाधित किया जा रहा है...",
            bn: "আপনার প্রশ্ন প্রক্রিয়া করা হচ্ছে...",
            te: "మీ ప్రశ్నను ప్రాసెస్ చేస్తున్నాము...",
            ta: "உங்கள் கேள்வியை செயலாக்குகிறது...",
            ml: "നിങ്ങളുടെ ചോദ്യം പ്രോസസ്സ് ചെയ്യുന്നു..."
        },
        
        // Common UI elements
        commonQuestions: {
            en: "Common Health Questions:",
            hi: "सामान्य स्वास्थ्य प्रश्न:",
            bn: "সাধারণ স্বাস্থ্য প্রশ্ন:",
            te: "సాధారణ ఆరోగ్య ప్రశ్నలు:",
            ta: "பொது ஆரோக்ய கேள்விகள்:",
            ml: "സാധാരണ ആരോഗ്യ ചോദ്യങ്ങൾ:"
        },
        disclaimer: {
            en: "Note: This is for informational purposes only. Consult a doctor for medical advice.",
            hi: "नोट: यह केवल सूचनात्मक उद्देश्यों के लिए है। चिकित्सीय सलाह के लिए डॉक्टर से परामर्श करें।",
            bn: "দ্রষ্টব্য: এটি শুধুমাত্র তথ্যগত উদ্দেশ্যে। চিকিৎসা পরামর্শের জন্য একজন ডাক্তারের সাথে পরামর্শ করুন।",
            te: "గమనిక: ఇది సమాచార ప్రయోజనాల కోసం మాత్రమే. వైద్య సలహా కోసం డాక్టర్ను సంప్రదించండి.",
            ta: "குறிப்பு: இது தகவல் நோக்கங்களுக்காக மட்டுமே. மருத்துவ ஆலோசனைக்கு ஒரு மருத்துவரை அணுகவும்.",
            ml: "ശ്രദ്ധിക്കുക: ഇത് വിവരണാത്മക ആവശ്യത്തിന് മാത്രമാണ്. മെഡിക്കൽ ഉപദേശത്തിന് ഒരു ഡോക്ടറെ സമീപിക്കുക."
        },
        
        // Common question buttons
        malariaSymptoms: {
            en: "Malaria Symptoms",
            hi: "मलेरिया के लक्षण",
            bn: "ম্যালেরিয়ার লক্ষণ",
            te: "మలేరియా లక్షణాలు",
            ta: "மலேரியா அறிகுறிகள்",
            ml: "മലേറിയ ലക്ഷണങ്ങൾ"
        },
        diarrheaPrevention: {
            en: "Diarrhea Prevention",
            hi: "दस्त रोकथाम",
            bn: "ডায়রিয়া প্রতিরোধ",
            te: "అతిసారం నివారణ",
            ta: "வயிற்றுப்போக்கு தடுப்பு",
            ml: "വയറിളക്കം തടയൽ"
        },
        
        // Default response content
        healthInfo: {
            en: "Health Information",
            hi: "स्वास्थ्य जानकारी",
            bn: "স্বাস্থ্য তথ্য",
            te: "ఆరోగ్య సమాచారం",
            ta: "ஆரோக்கிய தகவல்",
            ml: "ആരോഗ്യ വിവരങ്ങൾ"
        },
        describeSymptoms: {
            en: "Describe your symptoms clearly to a healthcare provider",
            hi: "अपने लक्षणों को स्वास्थ्य सेवा प्रदाता को स्पष्ट रूप से बताएं",
            bn: "আপনার লক্ষণগুলি একটি স্বাস্থ্যসেবা প্রদানকারীকে স্পষ্টভাবে বর্ণনা করুন",
            te: "మీ లక్షణాలను హెల్త్ కేర్ ప్రొవైడర్‌కు స్పష్టంగా వివరించండి",
            ta: "உங்கள் அறிகுறிகளை ஒரு சுகாதார பணியாளருக்கு தெளிவாக விவரிக்கவும்",
            ml: "ഒരു ഡോക്ടറോട് നിങ്ങളുടെ ലക്ഷണങ്ങൾ വ്യക്തമായി വിവരിക്കുക"
        }
        // ... (more translations would continue here)
    };

    // ======================
    // CORE FUNCTIONS
    // ======================
    
    function getTranslation(key, lang = languageSelect.value) {
        return translations[key]?.[lang] || translations[key]?.en || key;
    }

    function updateStatus(message, type = 'info') {
        statusEl.textContent = message;
        statusEl.style.color = type === 'error' ? '#e74c3c' : '#2c7873';
    }

    function initRecognition() {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = function() {
            isListening = true;
            voiceBtn.classList.add('listening');
            updateStatus(getTranslation('listening'));
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            transcriptionEl.textContent = `${getTranslation('youAsked')}: "${transcript}"`;
            processQuestion(transcript);
        };
        
        recognition.onerror = function(event) {
            console.error('Recognition error:', event.error);
            updateStatus(`${getTranslation('error')}: ${event.error}`, 'error');
            stopListening();
        };
        
        recognition.onend = stopListening;
    }

    function stopListening() {
        isListening = false;
        voiceBtn.classList.remove('listening');
        if (statusEl.textContent.includes(getTranslation('listening'))) {
            updateStatus(getTranslation('pressToAsk'));
        }
    }

    function processQuestion(question) {
        updateStatus(getTranslation('processing'));
        setTimeout(() => {
            const response = generateMockResponse(question);
            displayResponse(response);
            speakResponse(response);
        }, 1500);
    }

    function getLanguageCode() {
        const lang = languageSelect.value;
        const codeMap = {
            'hi': 'hi-IN', 'bn': 'bn-IN', 'te': 'te-IN',
            'ta': 'ta-IN', 'ml': 'ml-IN', 'en': 'en-IN'
        };
        return codeMap[lang] || 'en-IN';
    }

    function displayResponse(response) {
        responseArea.innerHTML = `
            <h3>${response.title}</h3>
            <p>${response.content}</p>
            ${response.bullets ? `<ul>${response.bullets.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
            
            <div class="common-questions">
                <h3>${getTranslation('commonQuestions')}</h3>
                <button class="question-btn" data-question="malaria symptoms">${getTranslation('malariaSymptoms')}</button>
                <button class="question-btn" data-question="diarrhea prevention">${getTranslation('diarrheaPrevention')}</button>
                <button class="question-btn" data-question="burns first aid">${getTranslation('burnsFirstAid')}</button>
                <button class="question-btn" data-question="pregnancy care">${getTranslation('pregnancyCare')}</button>
            </div>
            
            <footer>
                <p>${getTranslation('disclaimer')}</p>
            </footer>
        `;
        
        // Reattach event listeners to new buttons
        document.querySelectorAll('.question-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const question = this.getAttribute('data-question');
                transcriptionEl.textContent = `${getTranslation('youAsked')}: "${question}"`;
                processQuestion(question);
            });
        });
        
        updateStatus(getTranslation('responseReady'));
    }

    function speakResponse(response) {
        if (!SpeechSynthesis) return;
        
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = `${response.title}. ${response.content}. ${response.bullets?.join(', ') || ''}`;
        utterance.lang = getLanguageCode();
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }

    function generateMockResponse(question) {
        const lang = languageSelect.value;
        const lowerQuestion = question.toLowerCase();
        let responseKey = "";

        // Language-specific keyword detection
        const keywordMap = {
            malaria: {
                en: /malaria/i,
                hi: /मलेरिया/i,
                bn: /ম্যালেরিয়া/i,
                te: /మలేరియా/i,
                ta: /மலேரியா/i,
                ml: /മലേറിയ/i
            },
            // ... (similar for other conditions)
        };

        for (const [key, patterns] of Object.entries(keywordMap)) {
            if (patterns[lang].test(lowerQuestion)) {
                responseKey = key;
                break;
            }
        }

        // Response templates
        const responses = {
            malaria: {
                title: getTranslation('malariaInfo'),
                content: getTranslation('malariaContent'),
                bullets: [
                    getTranslation('malariaSymptom1'),
                    getTranslation('malariaPrevention1'),
                    getTranslation('malariaTreatment1')
                ]
            },
            // ... (other conditions)
        };

        return responseKey ? responses[responseKey] : {
            title: getTranslation('healthInfo'),
            content: getTranslation('consultDoctor'),
            bullets: [
                getTranslation('describeSymptoms'),
                getTranslation('visitCenter'),
                getTranslation('followTreatment')
            ]
        };
    }

    // ======================
    // EVENT LISTENERS
    // ======================
    
    voiceBtn.addEventListener('click', async function() {
        try {
            if (isListening) {
                recognition.stop();
                return;
            }
            
            updateStatus(getTranslation('requestingMic'));
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            initRecognition();
            recognition.lang = getLanguageCode();
            recognition.start();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            handleMicrophoneError(error);
        }
    });

    languageSelect.addEventListener('change', function() {
        updateStatus(`${getTranslation('languageSet')}: ${this.options[this.selectedIndex].text}`);
        // Refresh display if showing default content
        if (!responseArea.innerHTML.includes("<h3>")) {
            displayResponse({
                title: getTranslation('welcomeTitle'),
                content: getTranslation('welcomeContent'),
                bullets: [
                    getTranslation('tip1'),
                    getTranslation('tip2'),
                    getTranslation('tip3')
                ]
            });
        }
    });

    // Initialize with welcome message
    displayResponse({
        title: getTranslation('welcomeTitle'),
        content: getTranslation('welcomeContent'),
        bullets: [
            getTranslation('tip1'),
            getTranslation('tip2'),
            getTranslation('tip3')
        ]
    });
});