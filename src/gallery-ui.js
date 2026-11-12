import {ANOMALIES} from './rules.js';

export function renderGallery(gallery,t,inspect,selected=null){
  const $=id=>document.getElementById(id);
  $('gallery-count').textContent=t('galleryCount',{count:gallery.ids().length,total:ANOMALIES.length});
  $('gallery-storage').textContent=t(gallery.saved()?'gallerySaved':'galleryUnsaved');
  $('gallery-grid').textContent='';
  for(const [index,anomaly] of ANOMALIES.entries()){
    const unlocked=gallery.has(anomaly.id),button=document.createElement('button');
    button.className='gallery-card';button.disabled=!unlocked;
    if(unlocked)button.dataset.anomaly=anomaly.id;
    const number=document.createElement('span'),label=document.createElement('strong'),action=document.createElement('small');
    number.className='gallery-number';number.textContent=String(index+1).padStart(2,'0');
    label.textContent=unlocked?t('anomaly.'+anomaly.id):t('galleryLocked');
    action.textContent=unlocked?t('galleryInspect'):t('galleryLockedHint');
    button.append(number,label,action);
    if(unlocked)button.addEventListener('click',()=>inspect(anomaly.id));
    $('gallery-grid').append(button);
  }
  if(selected)$('gallery-view-title').textContent=t('anomaly.'+selected);
}
