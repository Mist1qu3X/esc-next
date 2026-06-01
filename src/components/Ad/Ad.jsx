'use client';
import React from 'react';
import './Ad.css';

const Ad = () => {
    return (
        <section className="ad">
            <div className="ad-divider"></div>
            <div className="ad-content">
                <div className="sponsors">
                    <p className="name-sponsors">SPONSORS</p>
                    <div className="sponsors-logos">
                        <img src="/img/sponsors-1.svg" alt="sponsors-1" />
                        <img src="/img/sponsors-2.svg" alt="sponsors-2" />
                        <img src="/img/sponsors-3.svg" alt="sponsors-3" />
                    </div>
                </div>
                <div className="partners">
                    <p className="name-partners">PARTNERS</p>
                    <div className="partners-logos">
                        <img src="/img/partners-1.svg" alt="partners-1" />
                        <img src="/img/partners-2.svg" alt="partners-2" />
                        <img src="/img/partners-3.svg" alt="partners-3" />
                        <img src="/img/partners-4.svg" alt="partners-4" />
                        <img src="/img/partners-5.svg" alt="partners-5" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Ad;