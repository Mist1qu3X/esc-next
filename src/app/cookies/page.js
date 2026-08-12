import LegalPage from '@/components/LegalPage/LegalPage';

export const metadata = {
    title: 'Cookie Policy | ESC Shooting',
    description: 'How the European Shooting Confederation uses cookies.',
};

export default function CookiePolicy() {
    return (
        <LegalPage title="Cookie Policy" updated="—">
            <p>
                This Cookie Policy explains how esc-shooting.org uses cookies and how you can control them.
            </p>

            <h2>1. What are cookies</h2>
            <p>Cookies are small text files stored on your device that help the website function and remember your preferences.</p>

            <h2>2. Types we use</h2>
            <ul>
                <li><strong>Essential</strong> — required for the site to work (always on).</li>
                <li><strong>Analytics</strong> — help us understand usage and improve the site (only with your consent).</li>
            </ul>

            <h2>3. Managing your choice</h2>
            <p>
                On your first visit a consent banner appears at the bottom of the screen. You can change your
                choice at any time via the <strong>“Cookie Settings”</strong> link in the footer.
            </p>

            <h2>4. More information</h2>
            <p>See our <a href="/privacy">Privacy Policy</a> for details on how we handle personal data.</p>
        </LegalPage>
    );
}
