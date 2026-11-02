'use strict';
// Homework assignments: local IndexedDB. Nothing is uploaded to GitHub.
const HOMEWORK_GROUPS=[...CLASSES,'กิจกรรมชาย','กิจกรรมหญิง'];
let homeworkSlot='',homeworkRoom='',homeworkDate='',homeworkEdit='',homeworkFilter='ทั้งหมด';
let homeworkData=[],homeworkAlertDay='';
const hwTomorrow=(d,days)=>{let z=new Date(d+'T12:00:00');z.setDate(z.getDate()+days);return localDate(z)};
function homeworkFormView(){
 let slot=slots.find(s=>s.id===homeworkSlot),item=homeworkData.find(a=>a.id===homeworkEdit)||{};
 let d=item.assigned||homeworkDate||localDate(),room=item.room||homeworkRoom||slot?.room||CLASSES[0];
 let due=item.due||hwTomorrow(d,7);
 return pageTitle(item.id?'แก้ไขการบ้าน':'สั่งการบ้าน','เลือกห้องและกำหนดส่งได้ทันที ไม่ต้องกรอกข้อมูลซ้ำ')
 +'<form id="homeworkForm" class="card panel"><div class="field"><label>ห้องเรียน</label><select name="room">'+HOMEWORK_GROUPS.map(x=>'<option '+(x===room?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>'
 +'<div class="field"><label>ชื่องาน *</label><div class="pills">'+['ใบงาน','แบบฝึกหัด','งานกลุ่ม','ชิ้นงาน','แบบทดสอบ'].map(x=>'<button type="button" data-hwtitle="'+x+'">'+x+'</button>').join('')+'</div><input required maxlength="200" name="title" value="'+esc(item.title||'')+'" placeholder="แตะประเภทงานด้านบน หรือพิมพ์ชื่อเฉพาะ"></div>'
 +'<div class="field"><label>รายละเอียด (ไม่บังคับ)</label><textarea name="details" rows="2" placeholder="คำสั่งหรือหัวข้อเพิ่มเติม">'+esc(item.details||'')+'</textarea></div>'
 +'<div class="grid2"><div class="field"><label>วันที่มอบหมาย</label><input name="assigned" type="date" value="'+d+'" required></div><div class="field"><label>กำหนดส่ง *</label><input name="due" type="date" value="'+due+'" required></div></div>'
 +'<div class="field"><label>เลือกวันส่งอย่างรวดเร็ว</label><div class="pills">'+[1,3,7,14].map(n=>'<button type="button" data-hwdays="'+n+'">'+(n===1?'พรุ่งนี้':n===7?'อีก 1 สัปดาห์':n===14?'อีก 2 สัปดาห์':'อีก 3 วัน')+'</button>').join('')+'</div></div>'
 +'<div class="field"><label>สถานะ</label><select name="status">'+['รอส่ง','กำลังตรวจ','ปิดงาน'].map(x=>'<option '+((item.status||'รอส่ง')===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div>'
 +'<div class="actions"><button class="btn" type="submit">บันทึกการบ้าน</button><button class="btn secondary" type="button" data-nav="homework">ยกเลิก</button></div></form>';
}
function hwDueTag(item){let t=localDate(),days=Math.round((new Date(item.due+'T12:00:00')-new Date(t+'T12:00:00'))/86400000);return item.status==='ปิดงาน'?'ปิดงานแล้ว':days<0?'เลยกำหนด '+(-days)+' วัน':days===0?'ส่งวันนี้':days===1?'ส่งพรุ่งนี้':'เหลือ '+days+' วัน'}
function hwCard(a){return '<div class="card panel"><div class="section" style="margin:0 0 5px"><strong>'+esc(a.room)+' · '+esc(a.title)+'</strong><span class="tag">'+esc(hwDueTag(a))+'</span></div><div class="muted">กำหนดส่ง '+dateText(a.due)+' · '+esc(a.status)+'</div>'+(a.details?'<div class="muted" style="margin-top:7px">'+esc(a.details)+'</div>':'')+'<div class="actions" style="margin-top:10px"><button class="btn secondary small" data-hwedit="'+esc(a.id)+'">แก้ไข</button>'+(a.status!=='ปิดงาน'?'<button class="btn secondary small" data-hwclose="'+esc(a.id)+'">✓ ปิดงาน</button>':'<button class="btn secondary small" data-hwreopen="'+esc(a.id)+'">เปิดงานอีกครั้ง</button>')+'<button class="btn danger small" data-hwdelete="'+esc(a.id)+'">ลบ</button></div></div>'}
function homeworkPage(){
 let subset=homeworkData.filter(a=>homeworkFilter==='ทั้งหมด'||a.room===homeworkFilter).sort((a,b)=>(a.status==='ปิดงาน')-(b.status==='ปิดงาน')||a.due.localeCompare(b.due));
 let active=homeworkData.filter(a=>a.status!=='ปิดงาน');
 return pageTitle('การบ้านและกำหนดส่ง','ติดตามการบ้านรายห้อง พร้อมประวัติย้อนหลัง')
 +'<button class="btn full" data-hwnew="1">+ สั่งการบ้าน</button>'
 +'<div class="stats"><div class="stat"><strong>'+active.length+'</strong><span>งานที่ยังเปิด</span></div><div class="stat"><strong>'+active.filter(x=>x.due===localDate()).length+'</strong><span>ส่งวันนี้</span></div><div class="stat"><strong>'+active.filter(x=>x.due<localDate()).length+'</strong><span>เลยกำหนด</span></div></div>'
 +'<div class="field"><label>เลือกห้องเรียน</label><select id="hwFilter"><option>ทั้งหมด</option>'+HOMEWORK_GROUPS.map(x=>'<option '+(x===homeworkFilter?'selected':'')+'>'+x+'</option>').join('')+'</select></div>'
 +(subset.length?subset.map(hwCard).join(''):'<div class="empty">ยังไม่มีการบ้านในห้องที่เลือก</div>');
}
function homeworkDecorate(){
 if(page==='more'){
 let m=document.querySelector('main.wrap .stack');if(m&&!m.querySelector('[data-nav="homework"]'))m.insertAdjacentHTML('afterbegin','<button class="card linktile" data-nav="homework"><span><strong>▣ &nbsp; การบ้านและกำหนดส่ง</strong><div class="muted">สั่งงาน ติดตามวันส่ง และประวัติ</div></span><span>›</span></button>');
 }
 if(page==='home'){
 let active=homeworkData.filter(x=>x.status!=='ปิดงาน').sort((a,b)=>a.due.localeCompare(b.due));
 let main=document.querySelector('main.wrap');
 if(main)main.insertAdjacentHTML('beforeend','<div class="section"><h2>การบ้านใกล้กำหนด</h2><button class="btn ghost" data-nav="homework">ดูทั้งหมด →</button></div>'+(active.length?active.slice(0,3).map(x=>'<div class="card rowcard"><div class="grow"><div class="strong">'+esc(x.room)+' · '+esc(x.title)+'</div><div class="muted">'+dateText(x.due)+' · '+esc(hwDueTag(x))+'</div></div><button class="btn secondary small" data-nav="homework">เปิด</button></div>').join(''):'<div class="empty">ยังไม่มีการบ้านที่รอส่ง</div>'));
 }
 if(['home','schedule','logForm'].includes(page)){
 let buttons=[...document.querySelectorAll('button[data-attopen]')];
 for(let b of buttons){
 if(b.parentElement.querySelector('button[data-hwslot]'))continue;
 let slot=slots.find(s=>s.id===b.dataset.attopen);if(!slot||!HOMEWORK_GROUPS.includes(slot.room))continue;
 b.insertAdjacentHTML('afterend','<button class="btn secondary small" data-hwslot="'+esc(slot.id)+'" data-hwdate="'+esc(b.dataset.attdate||localDate())+'">+ การบ้าน</button>');
 }
 if(page==='logForm'){
 let form=document.querySelector('#logForm');if(form&&!form.querySelector('[data-hwfromlog]'))form.insertAdjacentHTML('beforeend','<button type="button" class="btn secondary full" data-hwfromlog="1">+ สั่งการบ้านของคาบนี้</button>');
 }
 }
}
const baseHomeworkRender=render;
render=function(){
 baseHomeworkRender();
 if(page==='homework'||page==='homeworkForm'){let main=document.querySelector('main.wrap');if(main)main.innerHTML=page==='homework'?homeworkPage():homeworkFormView()}
 homeworkDecorate();
};
async function loadHomework(){if(!db)return;homeworkData=await all('assignments')}
const baseHomeworkRefresh=refresh;
refresh=async function(){await loadHomework();await baseHomeworkRefresh()};
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.hwslot){homeworkSlot=d.hwslot;homeworkRoom=slots.find(s=>s.id===d.hwslot)?.room||'';homeworkDate=d.hwdate||localDate();homeworkEdit='';page='homeworkForm';render()}
 if(d.hwfromlog){const form=document.querySelector('#logForm');homeworkSlot=form?.querySelector('[name="slotId"]')?.value||'';homeworkRoom=form?.querySelector('[name="room"]')?.value||'';homeworkDate=form?.querySelector('[name="date"]')?.value||localDate();homeworkEdit='';page='homeworkForm';render()}
 if(d.hwnew){homeworkSlot='';homeworkRoom='';homeworkDate=localDate();homeworkEdit='';page='homeworkForm';render()}
 if(d.hwedit){homeworkEdit=d.hwedit;homeworkSlot=homeworkData.find(a=>a.id===d.hwedit)?.slotId||'';page='homeworkForm';render()}
 if(d.hwtitle){document.querySelector('#homeworkForm [name="title"]').value=d.hwtitle}
 if(d.hwdays){let form=document.querySelector('#homeworkForm'),start=form?.elements.assigned.value||localDate();form.elements.due.value=hwTomorrow(start,Number(d.hwdays))}
 if(d.hwclose||d.hwreopen){let id=d.hwclose||d.hwreopen,a=homeworkData.find(x=>x.id===id);if(a){await put('assignments',{...a,status:d.hwclose?'ปิดงาน':'รอส่ง'});toast('อัปเดตสถานะแล้ว');await refresh()}}
 if(d.hwdelete){if(!confirm('ลบการบ้านนี้จริงหรือไม่?'))return;await del('assignments',d.hwdelete);await refresh()}
});
document.addEventListener('change',e=>{if(e.target.id==='hwFilter'){homeworkFilter=e.target.value;render()}});
document.addEventListener('submit',async e=>{
 if(e.target.id!=='homeworkForm')return;e.preventDefault();let x=Object.fromEntries(new FormData(e.target));
 if(!x.title.trim())return toast('กรุณาระบุชื่องาน');if(x.due<x.assigned)return toast('วันส่งต้องไม่ก่อนวันที่มอบหมาย');
 let previous=homeworkData.find(a=>a.id===homeworkEdit);
 await put('assignments',{...previous,...x,title:x.title.trim(),id:previous?.id||uid(),slotId:previous?.slotId||homeworkSlot,updated:new Date().toISOString()});
 homeworkEdit='';page='homework';toast('บันทึกการบ้านแล้ว');await refresh();
});
let homeworkNoticeKey='';
async function checkHomework(){
 if(!db||document.visibilityState!=='visible')return;
 const today=localDate();if(homeworkNoticeKey===today)return;
 await loadHomework();
 let soon=homeworkData.filter(a=>a.status!=='ปิดงาน'&&a.due<=hwTomorrow(today,1));
 if(!soon.length)return;
 homeworkNoticeKey=today;
 let msg='การบ้าน '+soon.length+' งานใกล้ถึงกำหนด/เลยกำหนด: '+soon.slice(0,2).map(a=>a.room).join(', ');
 toast(msg);
 if('Notification'in window&&Notification.permission==='granted')try{new Notification('เตือนกำหนดส่งการบ้าน',{body:msg,tag:'homework-'+today})}catch(e){}
}
setTimeout(()=>{if(db)checkHomework().catch(console.error)},2200);
setInterval(()=>checkHomework().catch(console.error),60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkHomework().catch(console.error)});
