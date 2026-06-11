import React, { useState } from 'react'

const DANGER_TYPES = [
  {id:'medical', label:'Tıbbi Atık', icon:'💉'},
  {id:'chemical', label:'Kimyasal Madde', icon:'⚗️'},
  {id:'explosive', label:'Patlayıcı/\nSüpheli Paket', icon:'💥'},
  {id:'sharp', label:'Kesici/Delici\nAlet', icon:'🔪'},
]

export default function MobileEmergency({ onBack }){
  const [photo, setPhoto] = useState(null)
  const [selectedDanger, setSelectedDanger] = useState(null)
  const [lifeThreat, setLifeThreat] = useState(false)
  const [description, setDescription] = useState('')

  function handlePhotoUpload(e){
    const file = e.target.files[0]
    if(file){
      const reader = new FileReader()
      reader.onload = (ev)=>setPhoto(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  function handleSubmit(){
    if(!photo) return alert('Lütfen fotoğraf yükleyiniz')
    if(!selectedDanger) return alert('Lütfen tehlike türü seçiniz')
    
    alert('Acil durum bildirimi gönderildi!\n' + 
      'Tür: ' + DANGER_TYPES.find(d=>d.id===selectedDanger)?.label + '\n' +
      'Hayati Tehlike: ' + (lifeThreat?'Evet':'Hayır'))
    
    // Reset form
    setPhoto(null)
    setSelectedDanger(null)
    setLifeThreat(false)
    setDescription('')
  }

  return (
    <div className="mobile-screen emergency-screen">
      <div className="mobile-screen-header" style={{background:'#dc2626'}}>
        <button className="back-btn" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h2>ACİL DURUM BİLDİRİ</h2>
        <div style={{width:24}}></div>
      </div>

      <div className="mobile-content">
        {/* Photo Upload */}
        <div className="emergency-upload">
          <label htmlFor="emergency-photo" style={{cursor:'pointer',width:'100%'}}>
            <div className="upload-area">
              {photo ? (
                <img src={photo} alt="emergency" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:12}} />
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <div style={{fontWeight:600,fontSize:15,marginTop:8}}>FOTOĞRAF YÜKLE</div>
                  <div style={{fontSize:13,opacity:0.9}}>(Zorunlu)</div>
                </>
              )}
            </div>
          </label>
          <input 
            id="emergency-photo" 
            type="file" 
            accept="image/*" 
            capture="environment"
            style={{display:'none'}}
            onChange={handlePhotoUpload}
          />
          <div className="emergency-warning">
            DİKKAT: Tehlikeli Maddeye KESİNLİKLE Dokunmayınız!
          </div>
        </div>

        {/* Danger Types */}
        <div className="section" style={{margin:'16px 0'}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>Tehlike Türü</h3>
          <div className="danger-types">
            {DANGER_TYPES.map(type=> (
              <button 
                key={type.id}
                className={`danger-btn ${selectedDanger===type.id?'active':''}`}
                onClick={()=>setSelectedDanger(type.id)}
              >
                <div style={{fontSize:28,marginBottom:4}}>{type.icon}</div>
                <div style={{fontSize:12,fontWeight:600,whiteSpace:'pre-line',lineHeight:1.2}}>{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Life Threat Toggle */}
        <div className="emergency-toggle">
          <span style={{fontWeight:600}}>Hayati Tehlike Var mı?</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={lifeThreat} onChange={(e)=>setLifeThreat(e.target.checked)} />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Description */}
        <textarea 
          className="emergency-textarea"
          placeholder="Ek Açıklama (Opsiyonel)"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          rows="3"
        />

        {/* Submit Button */}
        <button className="emergency-submit" onClick={handleSubmit}>
          BİLDİRİMİ GÖNDER
        </button>

        {/* Emergency Calls */}
        <div style={{display:'flex',gap:12,marginTop:16}}>
          <button className="emergency-call-btn" onClick={()=>window.open('tel:112')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            112 Acil Ara
          </button>
          <button className="emergency-call-btn" onClick={()=>window.open('tel:155')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Polis Ara
          </button>
        </div>
      </div>
    </div>
  )
}
