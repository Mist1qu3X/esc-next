import LegalPage from '@/components/LegalPage/LegalPage';

export const metadata = {
    title: 'Terms of Use | ESC Shooting',
    description: 'Terms and conditions for using the European Shooting Confederation website.',
};

// Составлено на основе реальных данных ESC (юр. лицо в Лозанне, швейцарское право,
// ESC Statutes & General Regulations). Отдельного официального документа у ESC нет.
export default function TermsOfUse() {
    return (
        <LegalPage title="Terms of Use">
            <p>
                This website (esc-shooting.org) is operated by the European Shooting Confederation (“ESC”),
                Voie du Chariot 3, 1003 Lausanne, Switzerland. By accessing or using the website you agree to these Terms of Use.
                If you do not agree, please do not use the website.
            </p>

            <h2>1. Use of the website</h2>
            <p>
                The website provides official information about ESC events, results, rankings, records, documents and
                member federations. You agree to use it only for lawful purposes and not to disrupt its operation, misuse it,
                or attempt to gain unauthorised access to any part of it or its underlying systems.
            </p>

            <h2>2. Sporting rules and official documents</h2>
            <p>
                The organisation and conduct of ESC competitions are governed by the ESC Statutes and the ESC General
                Regulations, available in the <a href="/documents">Documents</a> section. In the event of any discrepancy,
                the official documents and official results prevail over the information presented on this website.
            </p>

            <h2>3. Intellectual property</h2>
            <p>
                All content, logos, emblems and materials on this website are the property of the ESC or its partners and are
                protected by applicable law. They may not be copied, reproduced or reused without prior written permission,
                except for personal, non-commercial use.
            </p>

            <h2>4. Accuracy of information</h2>
            <p>
                We aim to keep information accurate and up to date, but it is provided “as is” and “as available”, without
                warranties of any kind. Official results and documents prevail in case of any discrepancy.
            </p>

            <h2>5. Limitation of liability</h2>
            <p>
                To the extent permitted by law, the ESC is not liable for any loss or damage arising from the use of, or
                inability to use, this website, or from reliance on any information presented on it.
            </p>

            <h2>6. External links and third-party content</h2>
            <p>
                The website may link to or embed third-party content and sites (member federations, the entry system,
                streaming platforms such as YouTube and Facebook). The ESC is not responsible for the content, availability or
                practices of those third parties.
            </p>

            <h2>7. Privacy and cookies</h2>
            <p>
                Your use of the website is also subject to our <a href="/privacy">Privacy Policy</a> and{' '}
                <a href="/cookies">Cookie Policy</a>.
            </p>

            <h2>8. Changes to these Terms</h2>
            <p>
                The ESC may update these Terms of Use from time to time. The current version is always available on this page,
                and your continued use of the website after any change constitutes acceptance of the updated Terms.
            </p>

            <h2>9. Governing law</h2>
            <p>
                These Terms of Use are governed by the substantive laws of Switzerland, without regard to conflicts of laws
                principles.
            </p>

            <h2>10. Contact</h2>
            <p>
                Questions about these terms: <a href="mailto:esc@escsport.eu">esc@escsport.eu</a> or the{' '}
                <a href="/contacts">Contacts</a> page.
            </p>
        </LegalPage>
    );
}
