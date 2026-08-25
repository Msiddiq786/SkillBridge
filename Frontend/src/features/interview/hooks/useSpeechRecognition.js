import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Helper to detect corrupted repetitive transcripts caused by browser mic loops
 * (e.g. "list is mutable and list is mutable and list is mutable")
 */
function detectSuspiciousRepetition(text) {
    if (!text || typeof text !== 'string') return false;
    const words = text.trim().toLowerCase().split(/\s+/);
    if (words.length < 6) return false;

    const maxPhraseLen = Math.min(10, Math.floor(words.length / 3));
    for (let phraseLen = 2; phraseLen <= maxPhraseLen; phraseLen++) {
        for (let i = 0; i <= words.length - phraseLen * 3; i++) {
            const phrase1 = words.slice(i, i + phraseLen).join(' ');
            const phrase2 = words.slice(i + phraseLen, i + phraseLen * 2).join(' ');
            const phrase3 = words.slice(i + phraseLen * 2, i + phraseLen * 3).join(' ');
            if (phrase1 === phrase2 && phrase2 === phrase3 && phrase1.length > 4) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Custom Speech Recognition Hook using Browser Web Speech API
 * - Explicit State Machine: IDLE | RECORDING | STOPPING | READY | ERROR
 * - Strict Separation of Final and Interim Transcripts (Zero Duplication)
 * - Single Active Recognition Instance & Clean Lifecycle
 * - Default Language: en-IN (configurable)
 * - Anti-repetition / Corrupted Transcript Quality Check
 * - Safe manual editing & reset actions
 */
export const useSpeechRecognition = (defaultLang = 'en-IN') => {
    const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'RECORDING' | 'STOPPING' | 'READY' | 'ERROR'
    const [finalTranscript, setFinalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
    const [error, setError] = useState(null);
    const [selectedLang, setSelectedLang] = useState(defaultLang);

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const isStoppingRef = useRef(false);
    const prefixTranscriptRef = useRef(''); // Holds text from previous recordings in the same answer session

    // Check browser support
    const SpeechRecognition = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
        : null;

    const isSupported = Boolean(SpeechRecognition);

    // Clean up recognition instance and timer
    const cleanupInstance = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onstart = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            } catch {
                /* silent */
            }
            recognitionRef.current = null;
        }
    }, []);

    // Unmount cleanup
    useEffect(() => {
        if (!isSupported) {
            setPermissionState('unsupported');
        }
        return () => {
            cleanupInstance();
        };
    }, [isSupported, cleanupInstance]);

    // Timer management during recording
    useEffect(() => {
        if (status === 'RECORDING') {
            timerRef.current = setInterval(() => {
                setRecordingSeconds(sec => sec + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [status]);

    /**
     * Start Recording
     * - Optional { clear: true } resets previous answer transcript completely
     */
    const startListening = useCallback((options = {}) => {
        if (!isSupported) {
            setPermissionState('unsupported');
            setError("Voice recording is not supported in this browser. Please use Google Chrome, Microsoft Edge, or type your answer.");
            setStatus('ERROR');
            return;
        }

        // Prevent double recording instances
        if (status === 'RECORDING') {
            return;
        }

        // Clean up any stale instance
        cleanupInstance();
        setError(null);
        isStoppingRef.current = false;

        if (options.clear) {
            setFinalTranscript('');
            prefixTranscriptRef.current = '';
        } else {
            // If appending to existing text, save it as prefix
            prefixTranscriptRef.current = finalTranscript.trim();
        }

        setInterimTranscript('');
        setRecordingSeconds(0);

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = selectedLang || 'en-IN';
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setStatus('RECORDING');
                setError(null);
                setPermissionState('granted');
            };

            recognition.onresult = (event) => {
                let sessionFinal = '';
                let sessionInterim = '';

                // Iterate over all results in the current recognition session
                for (let i = 0; i < event.results.length; i++) {
                    const res = event.results[i];
                    if (res && res[0]) {
                        if (res.isFinal) {
                            sessionFinal += res[0].transcript + ' ';
                        } else {
                            sessionInterim += res[0].transcript;
                        }
                    }
                }

                sessionFinal = sessionFinal.trim();
                sessionInterim = sessionInterim.trim();

                // Merge prefix (if user appended) + new session final
                const prefix = prefixTranscriptRef.current;
                const combinedFinal = prefix
                    ? (sessionFinal ? `${prefix} ${sessionFinal}` : prefix)
                    : sessionFinal;

                setFinalTranscript(combinedFinal);
                setInterimTranscript(sessionInterim);
            };

            recognition.onerror = (event) => {
                console.warn("Speech recognition error event:", event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setPermissionState('denied');
                    setError("Microphone permission was denied. Please allow microphone access in your browser address bar or use text input.");
                    setStatus('ERROR');
                } else if (event.error === 'no-speech') {
                    // Benign pause in speech, don't crash
                } else if (event.error === 'audio-capture') {
                    setError("No microphone detected. Please plug in a microphone or select text input.");
                    setStatus('ERROR');
                } else if (event.error === 'network') {
                    setError("Network connection issue with speech recognition service.");
                    setStatus('ERROR');
                } else {
                    setError(`Speech recognition notice: ${event.error}`);
                }
            };

            recognition.onend = () => {
                setInterimTranscript('');
                if (isStoppingRef.current) {
                    setStatus('READY');
                    isStoppingRef.current = false;
                } else if (status === 'RECORDING') {
                    // Ended unexpectedly by browser silence timeout -> mark ready
                    setStatus('READY');
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Failed to initialize SpeechRecognition:", err);
            setError("Could not start microphone. Please verify browser permissions or type instead.");
            setStatus('ERROR');
        }
    }, [isSupported, status, finalTranscript, selectedLang, cleanupInstance, SpeechRecognition]);

    /**
     * Stop Recording
     */
    const stopListening = useCallback(() => {
        if (status !== 'RECORDING') return;

        setStatus('STOPPING');
        isStoppingRef.current = true;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                try {
                    recognitionRef.current.abort();
                } catch {
                    /* silent */
                }
            }
        }

        // Failsafe timer to transition to READY if onend doesn't fire immediately
        setTimeout(() => {
            setInterimTranscript('');
            setStatus('READY');
            isStoppingRef.current = false;
        }, 400);
    }, [status]);

    /**
     * Reset Transcript & Session
     */
    const resetTranscript = useCallback(() => {
        cleanupInstance();
        setFinalTranscript('');
        setInterimTranscript('');
        prefixTranscriptRef.current = '';
        setRecordingSeconds(0);
        setError(null);
        setStatus('IDLE');
        isStoppingRef.current = false;
    }, [cleanupInstance]);

    /**
     * Manual Edit / Override
     */
    const setManualTranscript = useCallback((text) => {
        const clean = typeof text === 'string' ? text : '';
        setFinalTranscript(clean);
        prefixTranscriptRef.current = clean;
        setInterimTranscript('');
        if (status === 'IDLE' && clean.trim().length > 0) {
            setStatus('READY');
        }
    }, [status]);

    // Live display string
    const displayTranscript = (
        finalTranscript + (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '')
    ).trim();

    // Check for suspicious repetitions
    const isSuspiciousRepeat = detectSuspiciousRepetition(finalTranscript);

    // Format recording timer MM:SS
    const formattedRecordingTime = `${Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;

    return {
        isSupported,
        status, // 'IDLE' | 'RECORDING' | 'STOPPING' | 'READY' | 'ERROR'
        isListening: status === 'RECORDING',
        isStopping: status === 'STOPPING',
        isReady: status === 'READY',
        transcript: displayTranscript,
        finalTranscript,
        interimTranscript,
        rawTranscript: finalTranscript,
        recordingSeconds,
        formattedRecordingTime,
        permissionState,
        error,
        isSuspiciousRepeat,
        selectedLang,
        setSelectedLang,
        startListening,
        stopListening,
        resetTranscript,
        setManualTranscript
    };
};
