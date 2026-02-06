import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Privacy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-sigil-obsidian transition-colors duration-200 py-20 px-6 font-montserrat flex flex-col items-center">
            <div className="sigil-neural-bg overflow-hidden z-0 opacity-20"></div>

            <div className="max-w-[800px] w-full z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sigil-teal hover:text-white transition-colors mb-12 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Return to Sigil Deck</span>
                </button>

                <header className="mb-16 border-b border-white/10 pb-8">
                    <h1 className="text-4xl sm:text-5xl font-michroma text-white mb-4 uppercase tracking-tight">
                        Privacy & Cookie Policy
                    </h1>
                    <p className="text-sigil-silver text-sm opacity-60">
                        Last updated: February 6, 2026
                    </p>
                </header>

                <div className="space-y-12 text-[#FFFFFF] leading-relaxed">
                    <section>
                        <h2 className="text-xl font-michroma text-sigil-teal mb-4 uppercase">1. Ownership & Data Control</h2>
                        <p>
                            Sigil Deck is an official <strong>Cloud Mentor</strong> project. All data processing activities are managed by Cloud Mentor.
                            We are committed to maintaining the highest standards of transparency and security for the global architectural and engineering community.
                            Visit our primary portal at <a href="https://cloudmentor.hu" className="text-sigil-teal hover:underline">cloudmentor.hu</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-michroma text-sigil-teal mb-4 uppercase">2. Google Authentication</h2>
                        <p>
                            To ensure secure identity management, Sigil Deck utilizes <strong>Google OAuth 2.0</strong>.
                            When you sign in, we only access your basic profile information (name and email address).
                            Sigil Deck <strong>never</strong> sees, stores, or has access to your Google password.
                            Your authentication session is managed through secure, encrypted tokens.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-michroma text-sigil-teal mb-4 uppercase">3. Data Sovereignty & Sigils</h2>
                        <p>
                            The prompts you create (known as "Sigils") are considered your intellectual property.
                            They are stored on encrypted cloud servers and are private to your specific account.
                            We do not share your Sigil library with third parties or use them to train external AI models without your explicit consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-michroma text-sigil-teal mb-4 uppercase">4. Cookie Disclosure</h2>
                        <p className="mb-4">
                            We use "power words" (cookies) to ensure the stability and security of the interface:
                        </p>
                        <ul className="list-disc pl-6 space-y-3">
                            <li>
                                <strong>Strictly Necessary:</strong> Essential for Google Auth session management and security CSRF protection.
                            </li>
                            <li>
                                <strong>Performance:</strong> Minimal telemetry to monitor application stability and load times within the Cloud Mentor infrastructure.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-michroma text-sigil-teal mb-4 uppercase">5. Data Deletion</h2>
                        <p>
                            You maintain full control over your digital footprint.
                            To delete your account and all associated Sigils permanently from our vault, please contact our security team at:
                            <br />
                            <a href="mailto:support@cloudmentor.hu" className="text-sigil-teal hover:underline font-bold mt-2 block">support@cloudmentor.hu</a>
                        </p>
                    </section>
                </div>

                <footer className="mt-24 pt-12 border-t border-white/10 text-center text-sigil-silver text-xs opacity-40">
                    © 2026 CLOUD MENTOR SECURITY DIVISION. ALL RIGHTS RESERVED.
                </footer>
            </div>
        </div>
    );
}
