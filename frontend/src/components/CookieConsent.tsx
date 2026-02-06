import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const consent = localStorage.getItem('sigil-deck-consent');
        if (!consent) {
            // Delay visibility for a smooth entrance
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleConsent = (type: 'all' | 'necessary' | 'pref') => {
        localStorage.setItem('sigil-deck-consent', type);
        if (type === 'pref') {
            navigate('/privacy');
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[100] flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="max-w-[500px] w-full bg-[#0A0A0A]/95 backdrop-blur-xl border border-sigil-teal/40 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <h3 className="text-white font-michroma text-[0.85rem] uppercase tracking-widest mb-4">
                    Privacy & Cookies
                </h3>

                <p className="text-sigil-silver/80 text-xs sm:text-[13px] leading-relaxed mb-8">
                    We use "power words" (cookies) to improve your experience on Sigil Deck and to analyze traffic within the Cloud Mentor ecosystem. Your data is managed according to the highest security standards.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={() => handleConsent('all')}
                        className="w-full sm:w-auto px-6 py-3 bg-[#00A3FF] hover:bg-[#0082CC] text-white font-montserrat font-bold text-xs uppercase tracking-widest rounded-lg transition-all min-h-[44px]"
                    >
                        Accept All
                    </button>

                    <button
                        onClick={() => handleConsent('pref')}
                        className="w-full sm:w-auto px-6 py-3 border border-white/20 hover:border-sigil-teal/60 text-white font-montserrat font-bold text-xs uppercase tracking-widest rounded-lg transition-all min-h-[44px]"
                    >
                        Preferences
                    </button>

                    <button
                        onClick={() => handleConsent('necessary')}
                        className="w-full sm:w-auto text-sigil-silver/60 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors min-h-[44px] sm:ml-auto"
                    >
                        Necessary Only
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex justify-center sm:justify-start">
                    <Link
                        to="/privacy"
                        className="text-[10px] text-sigil-teal hover:underline uppercase tracking-tighter opacity-80"
                    >
                        Read the full Sigil protocol
                    </Link>
                </div>
            </div>
        </div>
    );
}
