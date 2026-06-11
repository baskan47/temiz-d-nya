import React from 'react'

export default function MobileMapDetail({ onBack }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#e5e7eb',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Map Background (Simulated) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath fill=\'%23a3e635\' fill-opacity=\'0.2\' d=\'M0 0h100v100H0z\'/%3E%3Cpath stroke=\'%23fff\' stroke-width=\'2\' d=\'M20 0v100M50 0v100M80 0v100M0 20h100M0 50h100M0 80h100\'/%3E%3C/svg%3E") #e0f2fe'
            }}></div>

            {/* Markers (Simulated) */}
            <div style={{ position: 'absolute', top: '30%', left: '40%', zIndex: 1 }}>
                <div style={{ width: 40, height: 40, background: '#ef4444', borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div style={{ background: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>İnşaat Atığı</div>
            </div>

            <div style={{ position: 'absolute', top: '50%', left: '20%', zIndex: 1 }}>
                <div style={{ width: 32, height: 32, background: '#3b82f6', borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                </div>
            </div>

            <div style={{ position: 'absolute', top: '45%', left: '70%', zIndex: 1 }}>
                <div style={{ width: 50, height: 50, background: '#10b981', borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M2 22s5-3 10-3 10 3 10 3" /><path d="M12 19V5" /><path d="M12 5l-4 4" /><path d="M12 5l4 4" /></svg>
                </div>
                <div style={{ background: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Maçka Parkı</div>
            </div>


            {/* Header */}
            <div style={{ position: 'relative', zIndex: 10, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent' }}>
                <button onClick={onBack} style={{ background: '#fff', width: 40, height: 40, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <div style={{ background: '#fff', padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: 14, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    Kirli Bölge Detayları
                </div>
                <button style={{ background: '#fff', width: 40, height: 40, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
                </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ position: 'relative', zIndex: 10, padding: '0 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
                <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Hepsi</button>
                <button style={{ background: '#fff', color: '#374151', border: 'none', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>Tıbbi Atık</button>
                <button style={{ background: '#fff', color: '#374151', border: 'none', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>Plastik Atık</button>
                <button style={{ background: '#fff', color: '#374151', border: 'none', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>Moloz</button>
            </div>

            {/* Map Controls */}
            <div style={{ position: 'absolute', right: 16, top: 100, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                    <button style={{ padding: 10, border: 'none', background: 'transparent', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
                    <button style={{ padding: 10, border: 'none', background: 'transparent', cursor: 'pointer' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
                </div>
                <button style={{ background: '#fff', width: 44, height: 44, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /></svg>
                </button>
            </div>

            {/* New Report Button */}
            <div style={{ position: 'absolute', right: 16, bottom: 240, zIndex: 20 }}>
                <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 24, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', cursor: 'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Yeni Rapor
                </button>
            </div>

            {/* Bottom Sheet Details */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                background: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 40,
                zIndex: 20,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                boxSizing: 'border-box'
            }}>
                <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px auto' }}></div>

                {/* Detail Content */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.05em', marginBottom: 4 }}>BEŞİKTAŞ SAHİLİ</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>Plastik ve Evsel Atık</div>
                        </div>
                        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            KRİTİK
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: 24, height: 24, background: '#d1d5db', borderRadius: '50%', border: '2px solid #fff' }}></div>
                            <div style={{ width: 24, height: 24, background: '#9ca3af', borderRadius: '50%', border: '2px solid #fff', marginLeft: -8 }}></div>
                            <div style={{ width: 24, height: 24, background: '#e5e7eb', color: '#6b7280', borderRadius: '50%', border: '2px solid #fff', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>+12</div>
                        </div>
                        <div style={{ fontSize: 13, color: '#4b5563' }}>12 kişi bu bölgeyi raporladı</div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                            Bölgeye Git
                        </button>
                        <button style={{ width: 52, background: '#f3f4f6', border: 'none', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
