import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-sigil-obsidian transition-colors duration-200">
        <div className="text-gray-500 dark:text-sigil-teal animate-pulse font-montserrat">Initialising Deck...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-sigil-obsidian transition-colors duration-200 relative overflow-x-hidden">
      <div className="sigil-neural-bg overflow-hidden z-0"></div>

      <header className="fixed top-0 w-full p-8 flex justify-between items-center z-30">
        <div className="flex items-center">
          <a href="https://cloudmentor.hu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all">
            <svg className="h-[32px] w-auto text-sigil-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19c.3 0 .5-.1.7-.2.6-.4.8-1.2.4-1.8l-1.5-2.5c-.2-.3-.5-.5-.9-.5H7.8c-.4 0-.7.2-.9.5L5.4 17c-.4.6-.2 1.4.4 1.8.2.1.4.2.7.2h11zM12 5c-3.3 0-6 2.7-6 6 0 .3 0 .5.1.8-.6.5-1 1.2-1 2.1 0 1.6 1.3 3 3 3h4c1.7 0 3-1.4 3-3 0-.9-.4-1.7-1.1-2.2.1-.3.1-.5.1-.8 0-3.3-2.7-6-6-6z" />
            </svg>
            <span className="text-gray-900 dark:text-white font-montserrat font-bold tracking-tight text-lg group-hover:text-sigil-teal transition-colors">Cloud Mentor</span>
          </a>
          <div className="h-6 w-px bg-sigil-silver/30 mx-4 hidden sm:block"></div>
          <span className="text-sm tracking-[0.3em] font-michroma text-sigil-teal uppercase">Sigil Deck</span>
        </div>
        <div className="flex gap-8 text-[11px] tracking-widest text-sigil-silver font-montserrat font-bold opacity-60">
          <a href="#" className="hover:text-sigil-teal transition-colors uppercase">Documentation</a>
          <a href="#" className="hover:text-sigil-teal transition-colors uppercase">Support</a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 z-20">
          <h1 className="text-[3rem] font-michroma tracking-[0.15em] text-gray-900 dark:text-white uppercase mb-6">
            Sigil Deck
          </h1>
          <h2 className="text-[1.1rem] font-montserrat font-light tracking-[0.15em] text-white/85">
            Where every prompt is a power word.
          </h2>
        </div>

        {/* Vault Door (Login Box) */}
        <div className="max-w-xl w-full p-[1px] rounded-3xl bg-gradient-to-br from-sigil-teal/40 via-transparent to-sigil-teal/10 shadow-[0_0_50px_-12px_rgba(0,217,213,0.3)]">
          <div className="p-12 md:p-16 rounded-[23px] bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 space-y-12">

            <div className="flex justify-center">
              <button
                onClick={handleGoogleLogin}
                className="group relative flex items-center gap-4 bg-white/10 hover:bg-white/15 border border-white/10 dark:border-white/20 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-sigil-teal/20"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-white font-montserrat font-bold tracking-wide">Continue with Google</span>
              </button>
            </div>

            <p className="text-center text-xs font-montserrat font-medium tracking-widest text-sigil-silver/40 pt-4 italic">
              &gt; "Speak your intent, and the machine shall answer."
            </p>
          </div>
        </div>

        {/* Machine Layer SEO Block */}
        <div className="max-w-[700px] w-full mt-32 text-center pb-20 opacity-40 group hover:opacity-100 transition-opacity duration-700 z-20">
          <h3 className="text-[0.85rem] uppercase tracking-[0.4em] font-michroma text-sigil-teal mb-6">The Professional AI Prompt Manager by Cloud Mentor</h3>
          <p className="text-[0.85rem] leading-loose font-montserrat font-medium text-sigil-silver mx-auto italic">
            "Sigil Deck is a dedicated AI prompt library developed by Cloud Mentor. It provides a secure, cloud-integrated environment for architects and engineers to manage their AI workflows. By utilizing Google Authentication, Sigil Deck ensures that your most valuable AI power words and commands are archived with enterprise-grade security. Elevate your generative AI potential through the official Cloud Mentor prompt management portal."
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 border-t border-white/10 transition-colors bg-black/20 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] tracking-[0.2em] font-montserrat font-bold text-sigil-silver opacity-60">
              © 2026 CLOUD MENTOR. ALL RIGHTS RESERVED.
            </p>
            <p className="text-[10px] tracking-[0.1em] font-montserrat font-medium text-sigil-teal/60 uppercase">
              A Cloud Mentor Project | Built for the AI-Powered Future.
            </p>
          </div>
          <div className="text-[11px] font-montserrat font-bold tracking-widest text-[#FFF]">
            Visit the main site: <a href="https://cloudmentor.hu" target="_blank" rel="noopener noreferrer" className="text-sigil-teal hover:text-white transition-colors underline underline-offset-8 decoration-sigil-teal/60">cloudmentor.hu</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
