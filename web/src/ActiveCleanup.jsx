import React, { useEffect, useState, useRef } from 'react'
import { analyzeDataUrl } from './aiImageAssistant'
import { calculateAndUpdateCleanupScore } from './firestoreService'
import { AdvancedScoringAlgorithm } from './scoringAlgorithm'

const theme = { green:'#27ae60', card:'#fff', muted:'#6b7280' }

function MemberAvatar({name, src}){
  if (src) return <img src={src} alt={name} style={{width:44,height:44,borderRadius:'50%'}} />
  const initials = name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
  return <div style={{width:44,height:44,borderRadius:'50%',background:'#eef2f0',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#064e3b'}}>{initials}</div>
}

export default function ActiveCleanup({ onEnd }){
  const [running, setRunning] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef(null)
  const [members, setMembers] = useState([
    {id:'u1', name:'Ayşe Y.', avatar:'https://picsum.photos/seed/ayse/48/48'},
    {id:'u2', name:'Mehmet K.', avatar:'https://picsum.photos/seed/mehmet/48/48'}
  ])
  const [groupId] = useState(() => 'grp-' + Math.random().toString(36).slice(2,9))
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  
  // Advanced Scoring variables
  const [weight, setWeight] = useState(5)
  const [difficulty, setDifficulty] = useState(2)
  const [urgency, setUrgency] = useState(2)
  const [completionPercentage, setCompletionPercentage] = useState(75)
  const [hoursSpent, setHoursSpent] = useState(1)
  const [showScoreForm, setShowScoreForm] = useState(false)

  useEffect(()=>{
    if (running) timerRef.current = setInterval(()=> setSeconds(s=>s+1), 1000)
    return ()=> clearInterval(timerRef.current)
  },[running])

  function formatTime(s){
    const mm = Math.floor(s/60).toString().padStart(2,'0')
    const ss = (s%60).toString().padStart(2,'0')
    return `${mm}:${ss}`
  }

  function handleInvite(){
    const createLink = (coords) => {
      const base = window.location.origin + window.location.pathname
      const payload = encodeURIComponent(JSON.stringify({groupId, coords}))
      const link = `${base}?invite=${payload}`
      navigator.clipboard && navigator.clipboard.writeText(link)
      alert('Davet linki kopyalandı: ' + link)
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos=> createLink({lat: pos.coords.latitude, lon: pos.coords.longitude}), ()=> createLink(null))
    } else createLink(null)
  }

  function triggerFinish(){
    if (!confirm('Bölgeyi tamamen temizlediniz mi? Sonuçları görmek için fotoğraf çekelim!')) return
    fileInputRef.current && fileInputRef.current.click()
  }

  async function onAfterFile(e){
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setMessage('Fotoğraf analiz ediliyor...')
    try{
      const { kirlilik_orani } = await analyzeDataUrl(f)
      const percent = kirlilik_orani
      setAnalysisResult({ percent })
      setMessage('')
    } catch(err){
      alert('Fotoğraf analizinde hata: ' + err.message)
      setMessage('')
    }
  }

  async function handleAwardPoints(){
    if (!analysisResult) return
    
    setMessage(`Temizlik puanları hesaplanıyor...`)
    
    try {
      // Advanced scoring hesapla
      const score = AdvancedScoringAlgorithm.calculateTotalScore({
        weight,
        difficulty,
        urgency,
        membersCount: members.length,
        completionPercentage,
        isVerified: true, // Web'te doğrulanmış olarak sayıyoruz
        hoursSpent,
      })

      const result = await calculateAndUpdateCleanupScore(window.firestore, {
        userId: 'current-user-id', // Auth'dan alınması gerekir
        groupId,
        weight,
        difficulty,
        urgency,
        membersCount: members.length,
        completionPercentage,
        isPhotoVerified: true,
        hoursSpent,
      })

      setAnalysisResult(null)
      setRunning(false)
      
      setMessage(`🎉 Tamamlandı! ${Math.round(score)} puan kazandınız!`)
      setTimeout(()=> {
        alert(`Harika! Puan ve rozetler güncellendi.`)
        onEnd && onEnd()
      }, 1000)
    } catch(e) {
      console.error('Award points failed', e)
      setMessage(`Hata: ${e.message}`)
    }
  }

  function handleContinueCleaning(){
    setAnalysisResult(null)
    setMessage('Temizliğe devam ediyoruz...')
    setTimeout(()=> setMessage(''),1200)
  }

  return (
    <div style={{maxWidth:820,margin:'0 auto',padding:16,fontFamily:'Inter, system-ui'}}>
      <div style={{background:theme.green,color:'#fff',padding:14,borderRadius:14,display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 8px 24px rgba(39,174,96,0.12)'}}>
        <div>
          <div style={{fontWeight:800}}>Temizlik devam ediyor... Dünya sana minnettar! 🌍</div>
          <div style={{fontSize:13,opacity:0.95}}>Ekip çalışmasıyla bölgeyi temizleyin.</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:12}}>Süre</div>
          <div style={{fontWeight:700}}>{formatTime(seconds)}</div>
        </div>
      </div>

      <div style={{marginTop:14,background:theme.card,padding:12,borderRadius:12,boxShadow:'0 6px 18px rgba(12,13,20,0.04)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontWeight:700}}>Temizlik Ekibi</div>
          <button onClick={handleInvite} style={{border:'1px solid #c7f3dd',background:'transparent',padding:'6px 10px',borderRadius:10,color:theme.green}}>+ Arkadaşını Davet Et</button>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {members.map(m => (
            <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:'center',width:80}}>
              <MemberAvatar name={m.name} src={m.avatar} />
              <div style={{fontSize:12,marginTop:6}}>{m.name.split(' ')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={onAfterFile} />

      {analysisResult && (
        <div style={{marginTop:16,background:'#f9fafb',padding:16,borderRadius:12,display:'flex',flexDirection:'column',gap:14}}>
          <div style={{fontSize:18,fontWeight:800}}>📊 Temizlik Detayları</div>
          
          {/* Difficulty */}
          <div>
            <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:6}}>Zorluk Seviyesi: {difficulty}/5</label>
            <input 
              type="range" 
              min="1" max="5" 
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              style={{width:'100%', cursor:'pointer'}}
            />
          </div>

          {/* Urgency */}
          <div>
            <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:6}}>Aciliyet: {urgency}/5</label>
            <input 
              type="range" 
              min="1" max="5" 
              value={urgency}
              onChange={(e) => setUrgency(parseInt(e.target.value))}
              style={{width:'100%', cursor:'pointer'}}
            />
          </div>

          {/* Weight */}
          <div>
            <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:6}}>Çalışma Alanı: {weight}/10</label>
            <input 
              type="range" 
              min="1" max="10" 
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              style={{width:'100%', cursor:'pointer'}}
            />
          </div>

          {/* Completion % */}
          <div>
            <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:6}}>Tamamlanma: {completionPercentage}%</label>
            <input 
              type="range" 
              min="0" max="100" 
              step="10"
              value={completionPercentage}
              onChange={(e) => setCompletionPercentage(parseInt(e.target.value))}
              style={{width:'100%', cursor:'pointer'}}
            />
          </div>

          {/* Hours Spent */}
          <div>
            <label style={{fontSize:13,fontWeight:600,display:'block',marginBottom:6}}>Harcanan Saat: {hoursSpent}h</label>
            <input 
              type="range" 
              min="0.5" max="8" 
              step="0.5"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(parseFloat(e.target.value))}
              style={{width:'100%', cursor:'pointer'}}
            />
          </div>

          <div style={{marginTop:8,padding:10,background:'#ecfdf5',borderRadius:8,fontSize:13,color:'#047857'}}>
            📈 Kirlilik: {analysisResult.percent}% | Ekip: {members.length} kişi
          </div>

          <div style={{display:'flex',gap:10}}>
            <button onClick={handleAwardPoints} style={{flex:1,background:theme.green,color:'#fff',padding:'12px 14px',borderRadius:10,border:'none',fontWeight:800,cursor:'pointer'}}>✓ Puanları Kaydet</button>
            <button onClick={handleContinueCleaning} style={{flex:1,background:'transparent',border:'1px solid #e5e7eb',padding:'12px 14px',borderRadius:10,cursor:'pointer'}}>Devam Et</button>
          </div>
        </div>
      )}

      <div style={{marginTop:18,display:'flex',justifyContent:'center'}}>
        <button onClick={triggerFinish} style={{width:'100%',maxWidth:520,background:theme.green,color:'#fff',padding:'14px 18px',fontSize:16,fontWeight:800,borderRadius:14,border:'none',boxShadow:'0 12px 36px rgba(39,174,96,0.18)'}}>TEMİZLİĞİ BİTİR</button>
      </div>

      {message && <div style={{marginTop:12,background:'#f0fdf4',padding:10,borderRadius:10,color:'#064e3b'}}>{message}</div>}
    </div>
  )
}
