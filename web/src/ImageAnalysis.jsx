import React, { useState } from 'react'
import { analyzeDataUrl } from './aiImageAssistant'

const theme = { green:'#27ae60', card:'#fff', muted:'#6b7280' }

function formatResult(stage, percent, status, message, actionRequired, warning=''){
  return {
    aşama: stage,
    analiz_sonucu: {
      kirlilik_orani: `%${percent}`,
      onay_durumu: status,
      kullanıcı_mesajı: message,
      aksiyon_gerekli: actionRequired,
      uyarı: warning
    }
  }
}

function DropCard({title, hint, icon, onFile}){
  const [dragOver, setDragOver] = useState(false)
  const inputRef = React.useRef(null)
  return (
    <div
      onDragOver={(e)=>{e.preventDefault(); setDragOver(true)}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={(e)=>{e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f) onFile(f)}}
      onClick={()=>inputRef.current && inputRef.current.click()}
      style={{background: theme.card, borderRadius:16, padding:18, boxShadow: dragOver? '0 8px 24px rgba(39,174,96,0.12)' : '0 6px 18px rgba(15,23,42,0.06)', cursor:'pointer', display:'flex', gap:12, alignItems:'center'}}
    >
      <div style={{width:56,height:56,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:12,background:dragOver? theme.green : '#f3faf5', color: dragOver? '#fff' : theme.green, fontSize:24}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700, marginBottom:6}}>{title}</div>
        <div style={{fontSize:13,color:theme.muted}}>{hint}</div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{ const f = e.target.files && e.target.files[0]; if(f) onFile(f)}} />
    </div>
  )
}

export default function ImageAnalysis({ onStartCleanup }){
  const [beforeResult, setBeforeResult] = useState(null)
  const [afterResult, setAfterResult] = useState(null)
  const [lastActionJson, setLastActionJson] = useState(null)

  async function runBeforeAnalysis(file){
    const { kirlilik_orani } = await analyzeDataUrl(file)
    const percent = kirlilik_orani
    let status, msg, actionRequired, warning=''
    if (percent > 50) {
      status = 'Onaylandı'
      msg = `Kirlilik oranı %${percent} olarak tespit edildi. Bu bölgenin temizlenmesi gerektiği onaylanmıştır.`
      actionRequired = 'Evet (Fotoğraf yükle)'
    } else {
      status = 'Onaylanmadı'
      msg = `Kirlilik oranı %${percent} olarak tespit edildi. Bu bölgenin temizlik için yeterince kirli olmadığı değerlendirilmiştir.`
      actionRequired = 'Hayır'
    }
    const json = formatResult('Aşama 1: Temizlik Öncesi', percent, status, msg, actionRequired, warning)
    setBeforeResult(json)
    setLastActionJson(json)
    if (percent > 50 && typeof onStartCleanup === 'function') onStartCleanup()
  }

  async function runAfterAnalysis(file){
    const { kirlilik_orani } = await analyzeDataUrl(file)
    const percent = kirlilik_orani
    let status, msg, actionRequired, warning=''
    if (percent <= 10) {
      status = 'Temizlik Tamamlandı'
      msg = `Harika! Temizlik başarılı bir şekilde tamamlanmıştır. Kirlilik oranı %${percent}.`
      actionRequired = 'Hayır'
    } else {
      status = 'Temizlik Bitmedi'
      msg = `Dikkat! Temizlik işlemi henüz bitmemiş görünüyor. Kirlilik oranı hala %${percent}.`
      actionRequired = "Evet (Devam Et / Bitir)"
      warning = "Eksik puan uyarısı: Kullanıcı 'Bitir' seçerse eksik puan verilecektir."
    }
    const json = formatResult('Aşama 2: Temizlik Sonrası', percent, status, msg, actionRequired, warning)
    setAfterResult(json)
    setLastActionJson(json)
  }

  return (
    <div style={{maxWidth:820,margin:'0 auto',padding:16,fontFamily:'Inter, system-ui'}}>
      <div style={{background: theme.green, color:'#fff', padding:14, borderRadius:16, display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 24px rgba(39,174,96,0.12)'}}>
        <div style={{fontSize:22}}>✨</div>
        <div>
          <div style={{fontWeight:800}}>Temizlik Devam Ediyor... Dünya Sana Minnettar!</div>
          <div style={{fontSize:13,opacity:0.95}}>Fotoğrafları yükleyin, AI hızlıca onaylayacak.</div>
        </div>
      </div>

      <div style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr',gap:12}}>
        <DropCard title="Temizlik Öncesi (Zorunlu)" hint="Kirlilik oranı için fotoğraf yükleyin veya sürükleyip bırakın" icon="📷" onFile={runBeforeAnalysis} />
        <DropCard title="Temizlik Sonrası (Analiz İçin)" hint="Temizlik sonrası fotoğrafı yükleyin" icon="✅" onFile={runAfterAnalysis} />
      </div>

      <div style={{marginTop:18,background:'#fff',borderRadius:14,padding:12,boxShadow:'0 6px 18px rgba(12,13,20,0.04)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontWeight:700}}>Temizlik Ekibi</div>
          <button onClick={()=>{navigator.clipboard && navigator.clipboard.writeText('invite-link'); alert('Davet linki kopyalandı!')}} style={{border:'1px dashed #d1fae5',background:'transparent',padding:'6px 10px',borderRadius:10,color:theme.green}}>+ Arkadaşını Davet Et</button>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <img src="https://picsum.photos/seed/u1/48/48" style={{width:44,height:44,borderRadius:999}} />
          <img src="https://picsum.photos/seed/u2/48/48" style={{width:44,height:44,borderRadius:999}} />
          <img src="https://picsum.photos/seed/u3/48/48" style={{width:44,height:44,borderRadius:999}} />
          <div style={{fontSize:13,color:theme.muted}}>3 katılımcı</div>
        </div>
      </div>

      <div style={{marginTop:20,display:'flex',justifyContent:'center'}}>
        <button style={{width:'100%',maxWidth:520,background:theme.green,color:'#fff',padding:'14px 18px',fontSize:16,fontWeight:800,borderRadius:14,border:'none',boxShadow:'0 10px 30px rgba(39,174,96,0.18)'}}>TEMİZLİĞİ BİTİR VE PUANLARI TOPLA</button>
      </div>

      {lastActionJson && (
        <section style={{marginTop:16}}>
          <pre style={{background:'#eef2ff',padding:12,borderRadius:10,whiteSpace:'pre-wrap'}}>{JSON.stringify(lastActionJson,null,2)}</pre>
        </section>
      )}
    </div>
  )
}
