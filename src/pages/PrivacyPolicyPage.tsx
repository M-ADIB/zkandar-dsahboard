import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'March 2026'
const CONTACT_EMAIL = 'privacy@zkandar.com'
const COMPANY_NAME = 'Zkandar AI'

export function PrivacyPolicyPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <div className="max-w-3xl mx-auto px-6 py-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-10"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

                <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">1. Who we are</h2>
                        <p>
                            {COMPANY_NAME} operates the Masterclass Hub platform ("Platform"). This Privacy Policy explains how
                            we collect, use, disclose, and safeguard your information when you use our Platform.
                            Please read it carefully. If you disagree with its terms, please discontinue use of the Platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">2. Information we collect</h2>
                        <p>We may collect the following categories of personal data:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong className="text-white">Account data:</strong> email address, full name, role, company affiliation.</li>
                            <li><strong className="text-white">Usage data:</strong> pages visited, features used, session duration, IP address, browser type.</li>
                            <li><strong className="text-white">Content data:</strong> assignment submissions, chat messages, survey responses, uploaded files.</li>
                            <li><strong className="text-white">Communication data:</strong> messages you send us via email or support channels.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">3. How we use your information</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>To provide, operate, and maintain the Platform</li>
                            <li>To personalise your learning experience</li>
                            <li>To send transactional communications (account confirmations, session updates)</li>
                            <li>To monitor and analyse usage for product improvement</li>
                            <li>To detect, investigate, and prevent fraudulent or unauthorised activity</li>
                            <li>To comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">4. Data sharing and disclosure</h2>
                        <p>
                            We do not sell your personal data. We may share it with trusted third-party service providers
                            (hosting, analytics, email delivery) under data processing agreements that require them to
                            protect your data. We may also disclose data when required by law or to protect our legal rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">5. Data retention</h2>
                        <p>
                            We retain your personal data for as long as your account is active or as needed to provide
                            the Platform. You may request deletion of your data at any time (see Section 7).
                            Certain data may be retained longer to satisfy legal obligations or resolve disputes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">6. Security</h2>
                        <p>
                            We implement technical and organisational measures to protect your data, including
                            encryption in transit (TLS), row-level security at the database layer, and access
                            controls. No system is 100% secure; we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">7. Your rights</h2>
                        <p>
                            Depending on your jurisdiction, you may have the right to:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Access the personal data we hold about you</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data ("right to erasure")</li>
                            <li>Export your data in a machine-readable format</li>
                            <li>Object to or restrict processing of your data</li>
                            <li>Lodge a complaint with your local data protection authority</li>
                        </ul>
                        <p className="mt-3">
                            To exercise any of these rights, email us at{' '}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-lime hover:underline">{CONTACT_EMAIL}</a>.
                            We will respond within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">8. Cookies</h2>
                        <p>
                            We use essential cookies to maintain your session. We may use analytics cookies
                            (e.g. PostHog) to understand how the Platform is used. You can manage cookie
                            preferences through your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">9. Changes to this policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of material
                            changes by posting the new policy on this page and updating the "Last updated" date.
                            Continued use of the Platform after changes constitutes acceptance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">10. Contact us</h2>
                        <p>
                            For any privacy-related questions or requests, contact us at:{' '}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-lime hover:underline">{CONTACT_EMAIL}</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
