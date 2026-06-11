import React, { useEffect, useState } from 'react'
import { watchGroups, createGroup, startCleaning } from './groupService'
import { appName } from './config'

export default function VolunteerGroups(){
  const [groups, setGroups] = useState([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    if(window.firestore){
      const unsub = watchGroups(window.firestore, setGroups)
      return ()=>unsub && unsub()
    }
    // mock
    setGroups([{ id:'g-1', name:'Gönüllü G1', members:[{name:'Ali'}], status:'active', points:120 }])
  },[])

  async function handleCreate(){
    if(!newName) return alert('Grup adı girin')
    setCreating(true)
    try{
      if(window.firestore){
        await createGroup(window.firestore, { name: newName, members: [], owner: (window.auth && window.auth.currentUser) ? window.auth.currentUser.uid : null })
      }else{
        setGroups(g=>[...g,{ id:Date.now().toString(), name:newName, members:[], status:'open', points:0 }])
      }
      setNewName('')
    }catch(e){ console.error(e); alert('Grup oluşturma hatası') }
    setCreating(false)
  }

  async function handleStart(g){
    if(!g) return
    if(window.firestore){
      await startCleaning(window.firestore, g.id)
    }else{
      setGroups(gs=>gs.map(x=> x.id===g.id ? {...x, status:'active'} : x))
    }
  }

  return (
    <div>
      <div className="card" style={{marginBottom:12}}>
        <h4>{appName} — Gönüllü Temizlik Grupları</h4>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input placeholder="Yeni grup adı" value={newName} onChange={e=>setNewName(e.target.value)} />
          <button onClick={handleCreate} disabled={creating}>Grup Oluştur</button>
        </div>
      </div>

      <div className="card">
        <h4>Aktif / Açık Gruplar</h4>
        <div style={{display:'grid',gap:8}}>
          {groups.map(g=> (
            <div key={g.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>{g.name}</div>
                <div style={{fontSize:13,color:'#666'}}>Üye: {g.members?.length || 0} - Durum: {g.status} - Puan: {g.points || 0}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>handleStart(g)}>{g.status==='active'? 'Devam Et':'Temizliği Başlat'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
