import React from 'react'

export default function FooterControls({onCreateGroup, onHome, onEmergency, rankingsVisible, onToggleRankings, onScores}){
  return (
    <div style={{position:'fixed',left:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:12,background:'#fff',boxShadow:'0 -2px 8px rgba(0,0,0,0.06)'}}>
      <div>
        <button onClick={onCreateGroup}>Gönüllü Grup Oluştur</button>
      </div>
      <div>
        <button onClick={onHome}>Ana Ekran</button>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button onClick={()=>onEmergency('112')}>Acil: 112</button>
        <button onClick={()=>onEmergency('itfaiye')}>İtfaiye</button>
        <button onClick={()=>onEmergency('belediye')}>Belediye</button>
        <button onClick={onScores}>🏅 Puanlarım</button>
        <button onClick={onToggleRankings}>{rankingsVisible? 'Sıralamayı Gizle':'Sıralamaları Gör'}</button>
      </div>
    </div>
  )
}
