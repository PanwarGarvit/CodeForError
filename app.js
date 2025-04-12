// voice_health_assistant.js

document.addEventListener('DOMContentLoaded', () => {
    const voiceBtn = document.getElementById('voice-btn');
    const statusEl = document.getElementById('status');
    const transcriptionEl = document.getElementById('transcription');
    const responseArea = document.getElementById('response-area');
    const languageSelect = document.getElementById('language-select');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        updateStatus("Speech recognition not supported. Try Chrome or Edge.", 'error');
        voiceBtn.disabled = true;
        return;
    }

    let recognition;
    let isListening = false;

    function updateStatus(message, type = 'info') {
        statusEl.textContent = message;
        statusEl.style.color = type === 'error' ? 'red' : 'green';
    }

    function getLanguageCode() {
        const lang = languageSelect.value;
        const map = {
            hi: 'hi-IN',
            bn: 'bn-IN',
            te: 'te-IN',
            ta: 'ta-IN',
            ml: 'ml-IN',
            en: 'en-IN'
        };
        return map[lang] || 'en-IN';
    }

    function initRecognition() {
        recognition = new SpeechRecognition();
        recognition.lang = getLanguageCode();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            updateStatus("Listening...");
            voiceBtn.classList.add("listening");
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            transcriptionEl.textContent = You said: "${transcript}";
            const aiReply = await fetchAIResponse(transcript);
            displayResponse(aiReply);
        };

        recognition.onerror = (event) => {
            updateStatus(Error: ${event.error}, 'error');
            stopListening();
        };

        recognition.onend = stopListening;
    }

    function stopListening() {
        isListening = false;
        updateStatus("Press the mic to ask");
        voiceBtn.classList.remove("listening");
    }

    function displayResponse(text) {
        responseArea.innerHTML = `
            <h3>Health Information</h3>
            <p>${text}</p>
        `;
    }

    async function fetchAIResponse(question) {
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // <-- Replace with your real key
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful health assistant for rural users. When asked about a health issue, explain the symptoms clearly and give simple advice on what to do next, including when to see a doctor."
                        },
                        {
                            role: "user",
                            content: question
                        }
                    ]
                })
            });

            const data = await response.json();

            // Safety check
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            } else {
                console.error("OpenAI returned unexpected data:", data);
                return "Sorry, I couldn't get a valid response from the assistant.";
            }
        } catch (error) {
            console.error("Error fetching from OpenAI:", error);
            return "Sorry, I couldn't process your request at the moment.";
        }
    }

    voiceBtn.addEventListener('click', async () => {
        if (isListening) {
            recognition.stop();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            initRecognition();
            recognition.start();
        } catch (err) {
            updateStatus("Microphone access denied or error.", 'error');
            console.error(err);
        }
    });

    languageSelect.addEventListener('change', () => {
        updateStatus(Language set to: ${languageSelect.options[languageSelect.selectedIndex].text});
    });

    displayResponse("Welcome to the Health Assistant! Please ask your health-related question.");
});
