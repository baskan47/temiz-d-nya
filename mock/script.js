const MAX = 5;
let participants = 3;
let isMissionActive = false;
let isCleaned = false;
let ecoPoints = 0;

const epEl = document.getElementById('ep');
const statusEl = document.getElementById('status');
const actionBtn = document.getElementById('actionBtn');

function renderStatus(){
  if(isCleaned){
    statusEl.innerHTML = '<div class="done">🎉 BÖLGE TEMİZLENDİ!</div>';
    actionBtn.textContent = 'GÖREV TAMAMLANDI';
    actionBtn.disabled = true;
    actionBtn.className = 'btn';
    epEl.textContent = Math.round(ecoPoints);
    return;
  }

  if(isMissionActive){
    statusEl.innerHTML = '<div class="statusText">⚡ TEMİZLİK DEVAM EDİYOR...</div>';
    actionBtn.textContent = 'TEMİZLİĞİ BİTİR VE FOTOĞRAF ÇEK';
    actionBtn.disabled = false;
    actionBtn.className = 'btn blue';
    epEl.textContent = Math.round(ecoPoints);
    return;
  }

  // default state
  let peopleHtml = '<div class="people">';
  for(let i=0;i<MAX;i++){
    const cls = i < participants ? 'p active' : 'p inactive';
    peopleHtml += `<div class="${cls}">👤</div>`;
  }
  peopleHtml += '</div>';
  peopleHtml += `<div style="margin-top:8px;color:#666">${participants} / ${MAX} Gönüllü</div>`;
  statusEl.innerHTML = `<div><strong>Alanya Sahil Yolu - Bölge #104</strong></div>${peopleHtml}`;

  if(participants === MAX){
    actionBtn.textContent = 'TEMİZLİĞİ BAŞLAT';
    actionBtn.className = 'btn green';
    actionBtn.disabled = false;
  } else {
    actionBtn.textContent = 'GRUBA KATIL';
    actionBtn.className = 'btn';
    actionBtn.disabled = false;
  }
  epEl.textContent = Math.round(ecoPoints);
}

function joinGroup(){
  if(participants < MAX){
    participants++;
    if(participants === MAX){
      setTimeout(()=> alert('🚀 Grup Tamamlandı! Başkanım, 5 kişi olduk! Temizliğe başlayabiliriz.'), 100);
    }
  }
  renderStatus();
}

function startCleaning(){
  if(participants === MAX && !isMissionActive && !isCleaned){
    isMissionActive = true;
  }
  renderStatus();
}

function finishCleaning(){
  if(isMissionActive && !isCleaned){
    isMissionActive = false;
    isCleaned = true;
    ecoPoints += 150;
  }
  renderStatus();
}

actionBtn.addEventListener('click', ()=>{
  if(isCleaned) return;
  if(isMissionActive) return finishCleaning();
  if(participants === MAX) return startCleaning();
  return joinGroup();
});

// initial render
renderStatus();
