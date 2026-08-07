'use client';
import { useState } from 'react';
import Link from 'next/link';
import './ContactsPage.css';

// Официальная почта для формы обратной связи.
const CONTACT_EMAIL = 'esc@escsport.eu';

const ContactsPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Пока нет backend-эндпоинта — собираем письмо и открываем почтовый клиент на esc@escsport.eu.
  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Website enquiry from ${form.name.trim() || 'visitor'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <section className="contacts-hero">
        <div className="breadcrumbs-row">
          <Link href="/" className="breadcrumb-home">HOME</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">CONTACTS</span>
        </div>
        <h1 className="contacts-title">CONTACTS</h1>
      </section>

      <section className="contacts-body">
        <div className="contacts-form-wrap">
          <h2 className="contacts-form-title">CONTACT US</h2>
          <p className="contacts-form-subtitle">
            Have a question about competitions, media, or membership?<br />
            Get in touch with our team
          </p>

          <form className="contacts-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="contacts-input"
              placeholder="Your full name*"
              value={form.name}
              onChange={update('name')}
              required
            />
            <input
              type="email"
              className="contacts-input"
              placeholder="Email*"
              value={form.email}
              onChange={update('email')}
              required
            />
            <textarea
              className="contacts-input contacts-textarea"
              placeholder="How can we help you?*"
              value={form.message}
              onChange={update('message')}
              rows={7}
              required
            ></textarea>

            <p className="contacts-privacy">
              By submitting this form, you agree to our Privacy Policy.
            </p>

            <button type="submit" className="contacts-submit">SEND</button>
          </form>
        </div>
      </section>
    </>
  );
};

export default ContactsPage;
