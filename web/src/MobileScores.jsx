import React from 'react'

export default function MobileScores({ onBack }){
  const recent = [
    {id:1, text:'Mardin Gönüllüleri: +50 Puan', time:'2 gün önce'},
    {id:2, text:'İzmir Temizleyicileri: +30 Puan', time:'5 gün önce'},
    {id:3, text:'Ankara Topluluğu: +20 Puan', time:'1 hafta önce'},
  ]

  const badges = [
    {id:'b1', label:'Doğa Dostu', emoji:'🌿'},
    {id:'b2', label:'Temizlik Kahramanı', emoji:'⭐'},
  ]

  return (
    <div style={{padding:16,paddingBottom:92}}>
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <h3 style={{margin:0}}>Profil & Puan Özeti</h3>
        <button onClick={onBack} style={{background:'transparent',border:'none',color:'#6b7280'}}>Kapat</button>
      </header>

      <section style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',padding:20,borderRadius:16,color:'#fff',boxShadow:'0 10px 30px rgba(16,185,129,0.25)',marginBottom:12}}>
        <div style={{fontSize:13,opacity:0.95}}>Toplam Puanım</div>
        <div style={{fontSize:32,fontWeight:800,marginTop:6}}>1250</div>
        <div style={{marginTop:8,fontSize:13}}>Son 30 günde: +120 Puan</div>
      </section>

      <section style={{marginBottom:12}}>
        <h4 style={{margin:'0 0 8px 0'}}>Son Aktiviteler</h4>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {recent.map(r => (
            <div key={r.id} style={{background:'#fff',padding:12,borderRadius:12,boxShadow:'0 4px 12px rgba(0,0,0,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:14,fontWeight:600}}>{r.text}</div>
              <div style={{fontSize:12,color:'#6b7280'}}>{r.time}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 style={{margin:'0 0 8px 0'}}>Rozetler</h4>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {badges.map(b => (
            <div key={b.id} style={{display:'flex',alignItems:'center',gap:8,background:'#fff',padding:'8px 12px',borderRadius:12,boxShadow:'0 4px 12px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:18}}>{b.emoji}</div>
              <div style={{fontSize:13,fontWeight:700}}>{b.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
