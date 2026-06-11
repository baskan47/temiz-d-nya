import React, { useState } from 'react'
import './styles.css'

function Header(){
  const [logoSrc, setLogoSrc] = useState('/assets/alan-logo.svg')
  const [logoError, setLogoError] = useState(false)
  return (
    <header className="alan-header">
      <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {!logoError ? (
            <span className="alan-logo-wrap">
              <img
                src={logoSrc}
                alt="ALAN Reklam Ajansı"
                className="alan-logo-img"
                onError={()=>{
                  if(logoSrc.endsWith('.svg')) setLogoSrc('/assets/alan-logo.png')
                  else setLogoError(true)
                }}
              />
            </span>
          ) : (
            <div className="logo">ALAN Reklam Ajansı</div>
          )}
        </div>
      </div>
      <nav className="alan-nav" aria-label="Ana Menü">
        <a href="#anasayfa">ANASAYFA</a>
        <a href="#hizmetler">HİZMETLER</a>
        <a href="#referans">PROJELERİMİZ</a>
        <a href="#kurumsal">KURUMSAL</a>
        <a href="#iletisim">İLETİŞİM</a>
      </nav>
    </header>
  )
}

function Hero(){
  const bg = 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=8e2c5b5a7f3c4c8a6d6a1d9b6b8f3a2a'
  return (
    <section className="alan-hero" style={{backgroundImage:`url(${bg})`}} id="anasayfa">
      <div className="hero-content">
        <h1>REKLAMDA YENİLİK, MARDİN'DE <span className="alan-accent">ALAN</span></h1>
        <p>Kurumsal kimlik, tabela, baskı ve araç giydirme konusunda uzman çözümler.</p>
      </div>
    </section>
  )
}

function Services(){
  const items = [
    {key:'print', title:'Baskı & Matbaa', desc:'Kurumsal baskı, broşür, katalog ve afiş.'},
    {key:'sign', title:'Tabela & Yönlendirme', desc:'İç ve dış mekan tabela çözümleri.'},
    {key:'invite', title:'Araç Giydirme', desc:'Araç kaplama ve reklam giydirme.'},
    {key:'card', title:'Kurumsal Kimlik', desc:'Logo, kartvizit ve marka kılavuzu.'}
  ]
  return (
    <section className="section" id="hizmetler">
      <div className="section-inner">
        <h2 className="section-title">Hizmetlerimiz</h2>
        <div className="divider" />
        <div className="services-grid">
          {items.map(it => (
            <div className="service-item" key={it.key} tabIndex={0}>
              <div className="service-icon" aria-hidden="true">
                {it.key === 'print' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M6 9V3h12v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="9" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M7 13h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {it.key === 'sign' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 7h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="5" y="8" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
                {it.key === 'invite' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8v8a2 2 0 0 0 2 2h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 8l-9 6L3 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {it.key === 'card' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="service-body">
                <h4>{it.title}</h4>
                <p>{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Portfolio(){
  const imgs = [
    'https://images.unsplash.com/photo-1560975690-7e09f7a3c6d2?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=aa111111111111111111111111111111',
    'https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=bb22222222222222222222222222222222',
    'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=cc33333333333333333333333333333333',
    'https://images.unsplash.com/photo-1520975910570-6b5f1f1f1f1f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=dd44444444444444444444444444444444',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=ee55555555555555555555555555555555',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=ff66666666666666666666666666666666'
  ]
  return (
    <section className="section" id="referans">
      <div className="section-inner">
        <h2 className="section-title">Referans Projelerimiz</h2>
        <div className="divider" />
        <div className="portfolio-grid">
          {imgs.map((src,i)=> (
            <div className="portfolio-item" key={i}><img src={src} alt={`Referans projesi ${i+1}`} loading="lazy" /></div>
          ))}
        </div>
        <div className="portfolio-cta"><button className="outline-btn">Referanslarımız</button></div>
      </div>
    </section>
  )
}

function Footer(){
  return (
    <footer className="alan-footer" id="iletisim">
      <div className="cols">
        <div>
          <h5>İLETİŞİM</h5>
          <p>Telefon: 0555 033 47 70</p>
          <p>WhatsApp: https://wa.me/05552054770</p>
        </div>
        <div>
          <h5>ADRES</h5>
          <p>Yalım Mahallesi 701 Sokak 1/B, Afşin</p>
        </div>
        <div>
          <h5>BİZİ TAKİP EDİN</h5>
          <p>Facebook • X • Instagram • YouTube</p>
        </div>
      </div>
      <div className="bottom-bar">2022 - Alan Reklam Ajansı</div>
    </footer>
  )
}

export default function Landing(){
  return (
    <div className="landing">
      <Header />
      <Hero />
      <Services />
      <Portfolio />
      <Footer />
    </div>
  )
}
