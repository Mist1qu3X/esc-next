import LegalPage from '@/components/LegalPage/LegalPage';

export const metadata = {
    title: 'Privacy Policy | ESC Shooting',
    description: 'How the European Shooting Confederation collects, uses and protects personal data.',
};

export default function PrivacyPolicy() {
    return (
        <LegalPage title="Privacy Policy" updated="—">
            <p>
                This Privacy Policy explains how the European Shooting Confederation (“ESC”, “we”)
                collects, uses and protects personal data when you use esc-shooting.org.
            </p>

            <h2>1. Data we collect</h2>
            <ul>
                <li>Information you submit through our forms (e.g. name, e-mail, message).</li>
                <li>Technical data such as browser type and pages visited (only with your consent to analytics cookies).</li>
            </ul>

            <h2>2. How we use it</h2>
            <ul>
                <li>To respond to your enquiries and process requests.</li>
                <li>To operate, secure and improve the website.</li>
            </ul>

            <h2>3. Cookies</h2>
            <p>
                We use essential cookies to run the site and, with your consent, analytics cookies.
                See our <a href="/cookies">Cookie Policy</a> and manage your choice via “Cookie Settings” in the footer.
            </p>

            <h2>4. Your rights (GDPR)</h2>
            <p>
                You may request access to, correction or deletion of your personal data. To exercise these rights,
                contact us via the <a href="/contacts">Contacts</a> page.
            </p>

            <h2>5. Contact</h2>
            <p>European Shooting Confederation — see the <a href="/contacts">Contacts</a> page.</p>
        </LegalPage>
    );
}
