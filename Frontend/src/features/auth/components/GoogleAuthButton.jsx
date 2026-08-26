import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// Global singleton tracking for Google Identity Services
let isGisInitialized = false;
let activeGisCallback = null;

const GoogleAuthButton = ({ onSuccess }) => {
    const { handleGoogleLogin } = useAuth();
    const btnContainerRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const onSuccessRef = useRef(onSuccess);
    const handleGoogleLoginRef = useRef(handleGoogleLogin);

    useEffect(() => {
        onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    useEffect(() => {
        handleGoogleLoginRef.current = handleGoogleLogin;
    }, [handleGoogleLogin]);

    // Update global callback handler for the currently active component instance
    useEffect(() => {
        activeGisCallback = async (response) => {
            if (!response?.credential) {
                setErrorMsg("Google sign-in was cancelled.");
                return;
            }

            setIsProcessing(true);
            setErrorMsg(null);

            try {
                const data = await handleGoogleLoginRef.current({ credential: response.credential });
                if (data?.user && onSuccessRef.current) {
                    onSuccessRef.current();
                }
            } catch (err) {
                const msg = err.response?.data?.message || "Google sign-in failed. Please try again.";
                setErrorMsg(msg);
            } finally {
                setIsProcessing(false);
            }
        };

        return () => {
            if (activeGisCallback) {
                activeGisCallback = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!clientId) {
            return;
        }

        let intervalId = null;

        const setupGis = () => {
            if (window.google?.accounts?.id && btnContainerRef.current) {
                try {
                    // Initialize GIS only ONCE globally
                    if (!isGisInitialized) {
                        window.google.accounts.id.initialize({
                            client_id: clientId,
                            callback: (response) => {
                                if (typeof activeGisCallback === 'function') {
                                    activeGisCallback(response);
                                }
                            },
                            auto_select: false,
                            cancel_on_tap_outside: true
                        });
                        isGisInitialized = true;
                    }

                    // Clear any previous render and render button
                    btnContainerRef.current.innerHTML = "";

                    window.google.accounts.id.renderButton(btnContainerRef.current, {
                        type: "standard",
                        theme: "filled_black",
                        size: "large",
                        text: "continue_with",
                        shape: "rectangular",
                        width: 350,
                        logo_alignment: "left"
                    });

                    return true;
                } catch (e) {
                    console.error("GIS render error:", e);
                }
            }
            return false;
        };

        if (!setupGis()) {
            intervalId = setInterval(() => {
                if (setupGis()) {
                    clearInterval(intervalId);
                }
            }, 250);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [clientId]);

    if (!clientId) {
        return (
            <div className="google-auth-unconfigured">
                <span className="google-unconf-badge">Google Sign-In is not configured.</span>
                <span className="google-unconf-sub">Add VITE_GOOGLE_CLIENT_ID to .env to enable.</span>
            </div>
        );
    }

    return (
        <div className="google-auth-wrapper">
            {isProcessing && (
                <div className="google-auth-loading">
                    <span>Signing in with Google...</span>
                </div>
            )}

            <div
                ref={btnContainerRef}
                className={`google-btn-container ${isProcessing ? 'google-btn--disabled' : ''}`}
            />

            {errorMsg && (
                <div className="google-auth-error">
                    <span>{errorMsg}</span>
                </div>
            )}
        </div>
    );
};

export default GoogleAuthButton;
