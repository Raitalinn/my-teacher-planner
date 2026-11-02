'use strict';
// Simple per-period attendance summary. Historical student records are retained.
let attendanceRoom='ม.4/5',attendanceDate=localDate(),attendanceSlot='',attRecords=[];
const attCategories=[['leave','ลากิจ'],['sick','ลาป่วย'],['absent','ขาด']];
function attInput(k,label,record){
 return '<div class="card panel" style="margin:8px 0"><div class="section"><strong>'+label+'</strong><span class="muted">จำนวนและชื่อ</span></div><div class="grid2"><div class="field"><label>จำนวน (คน)</label><input type="number" min="0" max="999" inputmode="numeric" name="'+k+'Count" value="'+(record?.[k+'Count']||0)+'"></div><div class="field"><label>เลขที่ / ชื่อ (ถ้ามี)</label><textarea name="'+k+'Names" rows="2" placeholder="เช่น เลขที่ 2, 7 หรือชื่อ-สกุล">'+esc(record?.[k+'Names']||'')+'</textarea></div></div></div>';
}
function attendancePage(){
 const lessons=slots.filter(s=>CLASSES.includes(s.room));
 let s=slots.find(x=>x.id===attendanceSlot),r=attRecords.find(x=>x.slotId===attendanceSlot&&x.date===attendanceDate);
 let choices=lessons.filter(x=>x.room===attendanceRoom);
 if(s&&!choices.some(x=>x.id===s.id))attendanceSlot='';
 return pageTitle('เช็กชื่อแบบรวดเร็ว','เลือกมาครบ หรือระบุจำนวนผู้ลากิจ ลาป่วย และขาด')
 +'<div class="card panel"><div class="grid2"><div class="field"><label>ห้องเรียน</label><select id="attRoom">'+CLASSES.map(x=>'<option '+(x===attendanceRoom?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div class="field"><label>วันที่</label><input id="attDate" type="date" value="'+attendanceDate+'"></div></div><div class="field"><label>คาบเรียน</label><select id="attSlot"><option value="">เลือกคาบ</option>'+choices.map(x=>'<option value="'+esc(x.id)+'" '+(attendanceSlot===x.id?'selected':'')+'>วัน'+DAY[x.day]+' คาบ '+x.period+' · '+x.start+'–'+x.end+'</option>').join('')+'</select></div>'
 +'<div class="field"><label>เลือกสถานะ</label><div class="pills"><button class="'+(r?.allPresent?'active':'')+'" id="allPresentBtn" type="button">✓ มาครบ</button><button class="'+(!r?.allPresent?'active':'')+'" id="hasMissingBtn" type="button">มีนักเรียนไม่มา</button></div></div><div id="attendanceMissing">'+attCategories.map(([key,label])=>attInput(key,label,r)).join('')+'</div><button id="saveAttendance" class="btn full" type="button">บันทึกการเข้าเรียน</button></div>'
 +'<div class="section"><h2>ประวัติย้อนหลัง</h2><span class="count">'+attRecords.length+' คาบ</span></div>'
 +'<div class="field"><label>กรองห้อง</label><select id="attHistoryRoom"><option value="ทั้งหมด">ทุกห้อง</option>'+CLASSES.map(x=>'<option '+(x===attendanceRoom?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div id="attendanceHistory"></div>';
}
let attendanceAllPresent=false;
async function attRender(){
 if(page!=='attendance')return;
 attRecords=await all('attendance_summary');
 let x=attRecords.find(r=>r.slotId===attendanceSlot&&r.date===attendanceDate);
 attendanceAllPresent=!!x?.allPresent;
 const main=document.querySelector('main.wrap');if(!main)return;
 main.innerHTML=attendancePage();
 let absent=document.querySelector('#attendanceMissing');if(absent)absent.hidden=attendanceAllPresent;
 const hist=document.querySelector('#attendanceHistory');
 if(hist){let rows=attRecords.filter(r=>r.room===attendanceRoom).sort((a,b)=>b.date.localeCompare(a.date));hist.innerHTML=rows.length?rows.map(r=>'<div class="card panel"><div class="section"><strong>'+dateText(r.date)+' · '+esc(r.room)+'</strong><span class="tag">'+(r.allPresent?'มาครบ':'ไม่มา '+(Number(r.leaveCount||0)+Number(r.sickCount||0)+Number(r.absentCount||0))+' คน')+'</span></div><div class="muted">คาบ '+esc(slots.find(s=>s.id===r.slotId)?.period||'อื่นๆ')+(r.allPresent?'': ' · ลากิจ '+(r.leaveCount||0)+' · ลาป่วย '+(r.sickCount||0)+' · ขาด '+(r.absentCount||0))+'</div>'+(r.allPresent?'':attCategories.map(([k,label])=>r[k+'Names']?'<div class="muted">'+label+': '+esc(r[k+'Names'])+'</div>':'').join(''))+'<button class="btn secondary small" data-attedit="'+esc(r.id)+'">เปิด / แก้ไข</button></div>').join(''):'<div class="empty">ยังไม่มีประวัติของห้องนี้</div>'}
}
const prevAttRender=render;
render=function(){prevAttRender();if(page==='attendance')attRender().catch(console.error)};
document.addEventListener('change',e=>{
 if(e.target.id==='attRoom'){attendanceRoom=e.target.value;attendanceSlot='';render()}
 if(e.target.id==='attDate'){attendanceDate=e.target.value;render()}
 if(e.target.id==='attSlot'){attendanceSlot=e.target.value;render()}
 if(e.target.id==='attHistoryRoom'){attendanceRoom=e.target.value==='ทั้งหมด'?attendanceRoom:e.target.value;render()}
});
document.addEventListener('click',async e=>{
 let b=e.target.closest('button');if(!b)return;
 if(b.dataset.attopen){attendanceRoom=b.dataset.attroom;attendanceSlot=b.dataset.attopen;attendanceDate=b.dataset.attdate||localDate();page='attendance';render()}
 if(b.dataset.attedit){let r=attRecords.find(x=>x.id===b.dataset.attedit);if(r){attendanceRoom=r.room;attendanceDate=r.date;attendanceSlot=r.slotId;page='attendance';render()}}
 if(b.id==='allPresentBtn'){attendanceAllPresent=true;document.querySelector('#attendanceMissing').hidden=true;b.classList.add('active');document.querySelector('#hasMissingBtn').classList.remove('active')}
 if(b.id==='hasMissingBtn'){attendanceAllPresent=false;document.querySelector('#attendanceMissing').hidden=false;b.classList.add('active');document.querySelector('#allPresentBtn').classList.remove('active')}
 if(b.id==='saveAttendance'){
  if(!attendanceSlot)return toast('กรุณาเลือกคาบเรียน');
  let old=attRecords.find(x=>x.slotId===attendanceSlot&&x.date===attendanceDate),v={id:old?.id||uid(),date:attendanceDate,slotId:attendanceSlot,room:attendanceRoom,allPresent:attendanceAllPresent,updated:new Date().toISOString()};
  for(const [k] of attCategories){v[k+'Count']=attendanceAllPresent?0:Number(document.querySelector('[name="'+k+'Count"]').value)||0;v[k+'Names']=attendanceAllPresent?'':document.querySelector('[name="'+k+'Names"]').value.trim()}
  if(!attendanceAllPresent&&!attCategories.some(([k])=>v[k+'Count']>0))return toast('กรอกจำนวนอย่างน้อย 1 คน หรือเลือกมาครบ');
  await put('attendance_summary',v);toast('บันทึกเรียบร้อย');render();
 }
});
