'use client';
import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import config from '@/lib/config';
import './ContactsPage.css';

// Официальная почта ESC (фолбэк в сообщении об ошибке).
const CONTACT_EMAIL = 'esc@escsport.eu';
const MAX_MESSAGE = 1000;

const EMPTY = { name: '', email: '', message: '', company: '' };

// Клиентская валидация полей
const validate = (f) => {
  const e = {};
  if (!f.name.trim()) e.name = 'Please enter your name';
  else if (f.name.trim().length < 2) e.name = 'Name is too short';
  if (!f.email.trim()) e.email = 'Please enter your email';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!f.message.trim()) e.message = 'Please enter a message';
  else if (f.message.trim().length < 10) e.message = 'Message is too short (min 10 characters)';
  else if (f.message.length > MAX_MESSAGE) e.message = `Message must be under ${MAX_MESSAGE} characters`;
  return e;
};

const ContactsPage = () => {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (status === 'error' || status === 'sent') setStatus('idle');
    if (touched[key]) setErrors(validate({ ...form, [key]: value }));
  };

  const handleBlur = (key) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return; // не даём отправить повторно во время отправки
    const found = validate(form);
    setErrors(found);
    setTouched({ name: true, email: true, message: true });
    if (Object.keys(found).length > 0) return; // есть ошибки валидации — не отправляем
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
      setTouched({});
      setErrors({});
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

          <form className="contacts-form" onSubmit={handleSubmit} noValidate>
            <div className="contacts-field">
              <input
                type="text"
                className={`contacts-input ${touched.name && errors.name ? 'contacts-input-err' : ''}`}
                placeholder="Your full name*"
                value={form.name}
                onChange={update('name')}
                onBlur={handleBlur('name')}
                aria-invalid={!!(touched.name && errors.name)}
              />
              {touched.name && errors.name && <span className="contacts-field-err">{errors.name}</span>}
            </div>

            <div className="contacts-field">
              <input
                type="email"
                className={`contacts-input ${touched.email && errors.email ? 'contacts-input-err' : ''}`}
                placeholder="Email*"
                value={form.email}
                onChange={update('email')}
                onBlur={handleBlur('email')}
                aria-invalid={!!(touched.email && errors.email)}
              />
              {touched.email && errors.email && <span className="contacts-field-err">{errors.email}</span>}
            </div>

            <div className="contacts-field">
              <textarea
                className={`contacts-input contacts-textarea ${touched.message && errors.message ? 'contacts-input-err' : ''}`}
                placeholder="How can we help you?*"
                value={form.message}
                onChange={update('message')}
                onBlur={handleBlur('message')}
                rows={7}
                maxLength={MAX_MESSAGE}
                aria-invalid={!!(touched.message && errors.message)}
              ></textarea>
              <div className="contacts-field-bottom">
                {touched.message && errors.message
                  ? <span className="contacts-field-err">{errors.message}</span>
                  : <span></span>}
                <span className={`contacts-counter ${form.message.length >= MAX_MESSAGE ? 'contacts-counter-max' : ''}`}>
                  {form.message.length} / {MAX_MESSAGE}
                </span>
              </div>
            </div>

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
              By submitting this form, you agree to our{' '}
              <Link href="/privacy" className="contacts-privacy-link">Privacy Policy</Link>.
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
