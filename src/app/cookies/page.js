import LegalPage from '@/components/LegalPage/LegalPage';

export const metadata = {
    title: 'Cookie Policy | ESC Shooting',
    description: 'How esc-shooting.org uses cookies and similar browser storage, and how you can control them.',
};

// Гибрид: сохраняет стиль и структуру официального документа ESC (Cookies.pdf),
// но приведён в соответствие с реальным поведением нового сайта — без рекламных
// cookies (ANID/NID/IDE) и корзины, которых здесь нет. Аналитика — только по согласию.
export default function CookiePolicy() {
    return (
        <LegalPage title="Cookie Policy">
            <p>
                A cookie is a small piece of text sent to your browser by a website you visit. It helps the site remember
                information about your visit, which can make it easier to visit the site again and make the site more useful to you.
                This website also uses similar browser storage (local storage) for the same purposes.
            </p>
            <p>
                For example, we use cookies and local storage to remember your cookie-consent choice, to remember articles you
                save, to protect your data, and — with your consent — to count how many visitors we receive to a page so we can
                improve the site. We do not use advertising cookies and do not show personalized ads.
            </p>
            <p>This page describes the types of cookies used by esc-shooting.org.</p>

            <h2>Types of cookies used by esc-shooting.org</h2>
            <p>
                Some or all of the cookies described below may be stored in your browser. You can also manage cookies in your
                browser (though browsers for mobile devices may not offer this visibility).
            </p>

            <h2>Functionality</h2>
            <p>
                Cookies used for functionality allow users to interact with a service or site to access features that are
                fundamental to that service. Things considered fundamental to the service include preferences such as your
                cookie-consent choice and the articles you have saved, and product optimizations that help maintain and improve
                the service. This information is stored on your device and is not sent to or read by our servers.
            </p>

            <h2>Security</h2>
            <p>
                Cookies used for security authenticate users, prevent fraud, and protect users as they interact with a service.
                Some cookies are used to prevent spam, fraud and abuse, ensuring that requests within a browsing session are made
                by the user and not by other sites.
            </p>

            <h2>Analytics</h2>
            <p>
                Cookies used for analytics help collect data that allows a service to understand how users interact with it. These
                insights allow us to improve content and to build better features that improve the user’s experience.
            </p>
            <p>
                We use analytics only if you accept them in the consent banner. They are never enabled unless you give your
                consent, and they are not used for advertising or personalized ads.
            </p>

            <h2>Third-party content</h2>
            <p>
                Some pages embed content from third parties — for example videos and live streams from YouTube and Facebook. When
                you view such content, the provider may set its own cookies on your device (for example YouTube’s ‘YSC’ cookie),
                governed by that provider’s own privacy and cookie policies. The ESC does not control these cookies.
            </p>

            <h2>Managing cookies</h2>
            <p>
                On your first visit a consent banner appears at the bottom of the screen, where you can accept or reject
                non-essential cookies. You can change your choice at any time via the “Cookie Settings” link in the footer.
                In addition, most browsers allow you to manage how cookies are set and used as you’re browsing, and to clear
                cookies and browsing data — some also let you manage cookies on a site-by-site basis.
            </p>
            <p>
                For how the ESC handles your personal data, see our <a href="/privacy">Privacy Policy</a>.
            </p>
        </LegalPage>
    );
}
