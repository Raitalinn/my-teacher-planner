'use strict';
// Attendance extension for My Teacher Planner. Data remains on this device.
const attendanceRooms=['ม.1/4','ม.3/4','ม.3/5','ม.4/4','ม.4/5','ม.5/4','ม.5/5','ม.6/4','ม.6/5'];
let attendanceRoom='ม.4/5', attendanceDate=localDate(),attendanceSlot='',attendanceHistoryRoom='ทั้งหมด';
const aOptions=(items,selected)=>items.map(v=>'<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(v)+'</option>').join('');
function attendancePage(){
 const classSlots=slots.filter(s=>s.room===attendanceRoom);
 return pageTitle('ขาด · ลา · ป่วย','บันทึกนักเรียนที่ไม่เข้าเรียนรายคาบ และค้นประวัติย้อนหลัง')
 +'<div class="card panel"><div class="grid2"><div class="field"><label>ห้องเรียน</label><select id="attRoom">'+aOptions(attendanceRooms,attendanceRoom)+'</select></div><div class="field"><label>วันที่เรียน</label><input id="attDate" type="date" value="'+attendanceDate+'"></div></div>'
 +'<div class="field"><label>คาบเรียน</label><select id="attSlot"><option value="">เลือกคาบที่ต้องการบันทึก</option>'+classSlots.map(s=>'<option value="'+esc(s.id)+'" '+(s.id===attendanceSlot?'selected':'')+'>วัน'+DAY[s.day]+' คาบ '+s.period+' ('+esc(s.start)+'–'+esc(s.end)+') '+esc(s.type)+'</option>').join('')+'</select></div>'
 +'<div id="attDayWarning"></div><div id="attStudentPanel"></div></div>'
 +'<div class="section"><h2>รายชื่อนักเรียน</h2></div><div class="card panel"><p class="muted">เพิ่มรายชื่อทีละคน หรือวางรายชื่อหลายบรรทัด รูปแบบ เลขที่ ชื่อ-สกุล</p><form id="studentAddForm"><div class="grid2"><div class="field"><label>เลขที่</label><input name="number" inputmode="numeric" placeholder="เช่น 12"></div><div class="field"><label>ชื่อ-สกุล *</label><input name="name" required maxlength="160" placeholder="ชื่อ-นามสกุล"></div></div><button class="btn secondary full" type="submit">+ เพิ่มนักเรียนใน '+esc(attendanceRoom)+'</button></form><details style="margin-top:14px"><summary>นำเข้ารายชื่อหลายคน</summary><form id="studentBulkForm" class="field"><label>หนึ่งคนต่อหนึ่งบรรทัด เช่น 1 สมชาย ใจดี</label><textarea name="lines" rows="5" placeholder="1 ชื่อ นามสกุล&#10;2 ชื่อ นามสกุล" required></textarea><button class="btn secondary">เพิ่มรายชื่อ</button></form></details></div>'
 +'<div class="section"><h2>ค้นประวัติย้อนหลัง</h2></div><div class="card panel"><div class="field"><label>กรองห้องเรียน</label><select id="attHistoryRoom">'+aOptions(['ทั้งหมด',...attendanceRooms],attendanceHistoryRoom)+'</select></div><div id="attHistory"></div></div>';
}
async function attendanceRefresh(){
 if(page!=='attendance')return;
 const [students,records]=await Promise.all([all('students'),all('attendance')]);
 const members=students.filter(x=>x.room===attendanceRoom).sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999)||a.name.localeCompare(b.name,'th'));
 const slot=slots.find(s=>s.id===attendanceSlot);
 const note=document.querySelector('#attDayWarning');
 if(note)note.innerHTML=slot&&new Date(attendanceDate+'T12:00:00').getDay()!==slot.day?'<div class="notice warn">วันที่เลือกไม่ตรงกับวันประจำคาบนี้ หากเป็นการสอนชดเชยสามารถบันทึกได้</div>':'';
 const panel=document.querySelector('#attStudentPanel');
 if(panel)panel.innerHTML='<div class="muted" style="margin:10px 0">'+members.length+' คนในห้องนี้ · '+(slot?'เลือกคาบแล้ว':'เลือกคาบก่อนบันทึกสถานะ')+'</div>'
 +(members.length?members.map(x=>{
 const found=records.find(r=>r.studentId===x.id&&r.date===attendanceDate&&r.slotId===attendanceSlot);
 return '<div class="card panel" style="margin:8px 0"><div class="section" style="margin:0 0 8px"><div><strong>'+esc(x.number||'—')+' '+esc(x.name)+'</strong></div><button class="btn danger small" data-studentremove="'+esc(x.id)+'">ลบรายชื่อ</button></div><div class="field"><label>สถานะ (ไม่เลือก = ไม่มีรายการขาด/ลา/ป่วย)</label><select data-attstatus="'+esc(x.id)+'" '+(!slot?'disabled':'')+'>'+aOptions(['ปกติ','ขาด','ป่วย','ลา'],found?.status||'ปกติ')+'</select></div><div class="field"><label>หมายเหตุ</label><input data-attnote="'+esc(x.id)+'" '+(!slot?'disabled':'')+' value="'+esc(found?.note||'')+'" placeholder="เช่น แจ้งผู้ปกครอง / ลากิจ"></div></div>';
 }).join(''):'<div class="empty">ยังไม่มีรายชื่อนักเรียนของห้องนี้</div>');
 const history=records.filter(r=>attendanceHistoryRoom==='ทั้งหมด'||r.room===attendanceHistoryRoom).sort((a,b)=>b.date.localeCompare(a.date));
 const el=document.querySelector('#attHistory');
 if(el)el.innerHTML='<div class="muted" style="margin:12px 0">'+history.length+' รายการ (ขาด/ป่วย/ลา)</div>'+(history.length?history.slice(0,250).map(r=>{
 const student=students.find(s=>s.id===r.studentId);
 const foundSlot=slots.find(s=>s.id===r.slotId);
 return '<div class="card panel" style="margin:8px 0"><div class="strong">'+esc(student?.name||r.studentName||'ไม่พบชื่อ')+' · '+esc(r.status)+'</div><div class="muted">'+dateText(r.date)+' · '+esc(r.room)+' · '+(foundSlot?'คาบ '+foundSlot.period:'คาบที่ลบไปแล้ว')+'</div>'+(r.note?'<div class="muted">'+esc(r.note)+'</div>':'')+'<button class="btn danger small" style="margin-top:8px" data-attremove="'+esc(r.id)+'">ลบรายการ</button></div>';
 }).join(''):'<div class="empty">ไม่พบรายการย้อนหลัง</div>');
}
const originalRender=render;
render=function(){originalRender();if(page==='attendance')attendanceRefresh().catch(console.error)};
document.addEventListener('change',async e=>{
 const t=e.target;if(t.id==='attRoom'){attendanceRoom=t.value;attendanceSlot='';render();return}
 if(t.id==='attDate'){attendanceDate=t.value;attendanceRefresh();return}
 if(t.id==='attSlot'){attendanceSlot=t.value;attendanceRefresh();return}
 if(t.id==='attHistoryRoom'){attendanceHistoryRoom=t.value;attendanceRefresh();return}
 if(t.dataset.attstatus){if(!attendanceSlot)return;let st=t.dataset.attstatus;let records=await all('attendance');let existing=records.find(r=>r.studentId===st&&r.slotId===attendanceSlot&&r.date===attendanceDate);if(t.value==='ปกติ'){if(existing)await del('attendance',existing.id)}else{let student=(await all('students')).find(x=>x.id===st);await put('attendance',{id:existing?.id||uid(),studentId:st,studentName:student?.name||'',room:attendanceRoom,slotId:attendanceSlot,date:attendanceDate,status:t.value,note:existing?.note||'',updated:new Date().toISOString()})}toast('บันทึกสถานะเรียบร้อย');attendanceRefresh();return}
 if(t.dataset.attnote){if(!attendanceSlot)return;let records=await all('attendance');let existing=records.find(r=>r.studentId===t.dataset.attnote&&r.slotId===attendanceSlot&&r.date===attendanceDate);if(existing){await put('attendance',{...existing,note:t.value,updated:new Date().toISOString()});toast('บันทึกหมายเหตุแล้ว');attendanceRefresh()}else toast('กรุณาเลือกสถานะ ขาด ป่วย หรือ ลา ก่อน');return}
});
document.addEventListener('submit',async e=>{
 if(!['studentAddForm','studentBulkForm'].includes(e.target.id))return;e.preventDefault();
 let x=Object.fromEntries(new FormData(e.target));let existing=await all('students');
 let lines=e.target.id==='studentBulkForm'?x.lines.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):[(x.number?x.number+' ':'')+x.name];
 let count=0;
 for(let line of lines){let m=line.match(/^(\d+)\s+(.+)$/);let number=m?m[1]:'',name=(m?m[2]:line).trim();if(!name)continue;if(existing.some(s=>s.room===attendanceRoom&&s.name===name&&s.number===number))continue;await put('students',{id:uid(),room:attendanceRoom,number,name});count++}
 toast('เพิ่มรายชื่อ '+count+' คน');attendanceRefresh();
});
document.addEventListener('click',async e=>{
 let b=e.target.closest('button');if(!b)return;
 if(b.dataset.attremove){if(!confirm('ลบประวัติรายการนี้?'))return;await del('attendance',b.dataset.attremove);attendanceRefresh()}
 if(b.dataset.studentremove){if(!confirm('ลบรายชื่อนักเรียนนี้? ประวัติจะยังเก็บอยู่'))return;await del('students',b.dataset.studentremove);attendanceRefresh()}
 if(b.dataset.attopen){attendanceRoom=b.dataset.attroom;attendanceDate=b.dataset.attdate;attendanceSlot=b.dataset.attopen;page='attendance';render()}
});
