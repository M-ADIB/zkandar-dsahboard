import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LAST_UPDATED = 'March 2026'
const CONTACT_EMAIL = 'legal@zkandar.com'
const COMPANY_NAME = 'Zkandar AI'

export function TermsOfServicePage() {
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

                <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-10">Last updated: {LAST_UPDATED}</p>

                <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of terms</h2>
                        <p>
                            By accessing or using the {COMPANY_NAME} Masterclass Hub ("Platform"), you agree to be
                            bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">2. Eligibility</h2>
                        <p>
                            You must be at least 18 years old and have the authority to enter into these Terms on
                            behalf of yourself or your organisation. By using the Platform, you represent and warrant
                            that you meet these requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">3. Platform access</h2>
                        <p>
                            Access to the Platform is granted on a per-cohort or per-programme basis.
                            Your access credentials are personal and non-transferable. You are responsible
                            for maintaining the confidentiality of your account and for all activity under it.
                            Notify us immediately if you suspect unauthorised access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">4. Acceptable use</h2>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Share your account credentials with others</li>
                            <li>Upload content that is illegal, harmful, defamatory, or infringes third-party rights</li>
                            <li>Attempt to reverse-engineer, scrape, or disrupt the Platform</li>
                            <li>Use the Platform for any unauthorised commercial purpose</li>
                            <li>Impersonate any person or entity</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">5. Intellectual property</h2>
                        <p>
                            All content, materials, and software provided through the Platform are owned by or
                            licensed to {COMPANY_NAME}. You are granted a limited, non-exclusive, non-transferable
                            licence to access and use the Platform for your personal learning purposes only.
                            You may not reproduce, distribute, or create derivative works without our prior
                            written consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">6. User-generated content</h2>
                        <p>
                            By submitting content to the Platform (assignments, chat messages, survey responses),
                            you grant {COMPANY_NAME} a non-exclusive, royalty-free licence to use, store, and display
                            that content for the purpose of operating the Platform. You retain ownership of your content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">7. Disclaimers</h2>
                        <p>
                            The Platform is provided "as is" without warranties of any kind, express or implied.
                            {COMPANY_NAME} does not warrant that the Platform will be error-free, uninterrupted,
                            or free of viruses. To the maximum extent permitted by law, we disclaim all warranties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of liability</h2>
                        <p>
                            To the fullest extent permitted by applicable law, {COMPANY_NAME} shall not be liable
                            for any indirect, incidental, special, or consequential damages arising out of your
                            use of the Platform, even if advised of the possibility of such damages.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your access to the Platform at any time,
                            with or without notice, if you breach these Terms or if we cease to operate the Platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">10. Governing law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with applicable law.
                            Any disputes shall be resolved in the competent courts of the jurisdiction where
                            {COMPANY_NAME} is incorporated.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">11. Changes to these terms</h2>
                        <p>
                            We may revise these Terms at any time. Continued use of the Platform after revisions
                            are posted constitutes your acceptance of the updated Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">12. Contact</h2>
                        <p>
                            For questions about these Terms, contact us at:{' '}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-lime hover:underline">{CONTACT_EMAIL}</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">13. Masterclass program terms</h2>
                        <p className="mb-4 text-gray-400 text-sm">The following clauses apply specifically to clients enrolled in the Zkandar AI Masterclass program.</p>
                        <div className="space-y-5">
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Booking Confirmation</p>
                                <p>The full course fee must be paid in advance to secure your seat in the masterclass.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">No Refund Policy</p>
                                <p>Payments are non-refundable once the booking is confirmed.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Payment Validity Window</p>
                                <p>The quoted fee is valid for 7 days from the date of issue. After this period, availability and pricing may be subject to change.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Rescheduling &amp; Flexibility</p>
                                <p>We understand that unexpected situations can arise. If a session needs to be rescheduled, whether from your side or ours, we ask that this be communicated at least 48 hours in advance. From our end, there may occasionally be rescheduling due to travel or professional commitments. In such cases, we will provide advance notice and coordinate a mutually suitable alternative date. We are committed to maintaining flexibility while also protecting the structure and flow of the program for both parties.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Intellectual Property</p>
                                <p>All recorded sessions are for internal team reference only and remain the sole property of the provider. They may not be reused, shared externally, or repurposed in any form.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Team Participation</p>
                                <p>All enrolled team members are expected to attend scheduled sessions consistently to ensure the effectiveness and continuity of the program, for optimal results.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Communication Channels</p>
                                <p>All team communication between sessions will take place exclusively via our dashboard. Standard response time of 24 to 48 hours on business days.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Success Disclaimer</p>
                                <p>While the program provides strategic tools and guidance, results will vary based on the team's implementation and participation, and no specific outcomes are guaranteed.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Media Usage</p>
                                <p>We may share brief, non-sensitive snippets or behind-the-scenes moments from the Masterclass on our social media platforms to capture and showcase the overall vibe and engagement of the session.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm mb-1">Terms Acceptance</p>
                                <p>By proceeding with payment, the client acknowledges and agrees to all terms and conditions stated in the invoice and in this document.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
