'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import './FullStaffPage.css';

// Инициалы-заглушка, если в Strapi не заполнено поле initials и нет фото
const fallbackInitials = (name) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const FullStaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // Тот же источник, что и блок LEADERSHIP на /discover, но без среза первых трёх
        const res = await cachedGet(
          `${config.API_URL}/api/leaders?populate=*&sort=order:asc&pagination[limit]=100`
        );
        setStaff(res.data?.data || []);
      } catch (e) {
        console.error('Ошибка загрузки Full Staff:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
    if (img.url) return img.url.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
    return null;
  };

  return (
    <>
      <section className="fs-hero">
        <div className="fs-breadcrumbs-row">
          <Link href="/discover" className="fs-breadcrumb-parent">About Us</Link>
          <span className="fs-breadcrumb-separator">›</span>
          <span className="fs-breadcrumb-active">Full Staff</span>
        </div>
        <div className="fs-next-layer">
          <span className="fs-line"></span>
          <span className="fs-subtitle">LEADERSHIP</span>
        </div>
        <h1 className="fs-title">FULL STAFF</h1>
      </section>

      <section className="fs-grid-section">
        {loading ? (
          <div className="fs-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="fs-card skeleton-card" key={i}>
                <div className="fs-card-photo skeleton"></div>
                <div className="fs-card-info">
                  <div className="skeleton" style={{ width: '70%', height: 16, borderRadius: 3 }}></div>
                  <div className="skeleton" style={{ width: '45%', height: 10, borderRadius: 3 }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="fs-empty">
            <i className="fa-regular fa-user"></i>
            <p>No staff members published yet.</p>
          </div>
        ) : (
          <div className="fs-grid">
            {staff.map((person) => (
              <article className="fs-card" key={person.id}>
                <div className="fs-card-photo">
                  {person.image ? (
                    <img
                      src={getImageUrl(person.image)}
                      alt={person.name}
                      className="fs-card-photo-img"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="fs-card-initials">
                      {person.initials || fallbackInitials(person.name)}
                    </span>
                  )}
                </div>
                <div className="fs-card-info">
                  <h2 className="fs-card-name">{person.name}</h2>
                  <p className="fs-card-role">{person.role}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default FullStaffPage;
