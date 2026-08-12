import LegalPage from '@/components/LegalPage/LegalPage';

export const metadata = {
    title: 'Terms of Use | ESC Shooting',
    description: 'Terms and conditions for using the European Shooting Confederation website.',
};

export default function TermsOfUse() {
    return (
        <LegalPage title="Terms of Use" updated="—">
            <p>
                By accessing esc-shooting.org you agree to these Terms of Use. If you do not agree,
                please do not use the website.
            </p>

            <h2>1. Use of the website</h2>
            <p>
                The website provides official information about ESC events, results, rankings, records and
                member federations. You agree to use it only for lawful purposes.
            </p>

            <h2>2. Intellectual property</h2>
            <p>
                All content, logos and materials on this website are the property of ESC or its partners and
                may not be reproduced without permission.
            </p>

            <h2>3. Accuracy of information</h2>
            <p>
                We aim to keep information accurate and up to date, but provide it “as is” without warranties.
                Official results and documents prevail in case of discrepancy.
            </p>

            <h2>4. External links</h2>
            <p>
                The website may link to third-party sites (federations, streaming platforms). ESC is not
                responsible for their content.
            </p>

            <h2>5. Contact</h2>
            <p>Questions about these terms — see the <a href="/contacts">Contacts</a> page.</p>
        </LegalPage>
    );
}
