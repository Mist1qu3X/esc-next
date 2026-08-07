'use client';
import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import config from '@/lib/config';
import './ContactsPage.css';

// Официальная почта ESC (фолбэк в сообщении об ошибке).
const CONTACT_EMAIL = 'esc@escsport.eu';

const EMPTY = { name: '', email: '', message: '', company: '' };

const ContactsPage = () => {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      await axios.post(`${config.API_URL}/api/contact-messages`, {
        data: {
          name: form.name,
          email: form.email,
          message: form.message,
          company: form.company, // honeypot — живые люди оставляют пустым
        },
      });
      setStatus('sent');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
    }
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

            {/* Honeypot: скрыто от людей, ловит ботов. Не трогать. */}
            <input
              type="text"
              className="contacts-hp"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={update('company')}
              aria-hidden="true"
            />

            <p className="contacts-privacy">
              By submitting this form, you agree to our Privacy Policy.
            </p>

            {status === 'sent' && (
              <p className="contacts-note contacts-note-ok">
                Thanks — your message has been sent. We&apos;ll get back to you soon.
              </p>
            )}
            {status === 'error' && (
              <p className="contacts-note contacts-note-err">
                Something went wrong. Please try again, or email us directly at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>
            )}

            <button type="submit" className="contacts-submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'SENDING…' : 'SEND'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default ContactsPage;
