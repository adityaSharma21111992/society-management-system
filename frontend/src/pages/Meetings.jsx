import React, { useEffect, useState } from 'react'
import api from '../services/api'


export default function Meetings(){
const [meetings, setMeetings] = useState([])
const [form, setForm] = useState({ title:'', agenda:'', date:'', time:'' })


useEffect(()=> load(), [])
const load = ()=> api.get('/meetings').then(r=>setMeetings(r.data)).catch(()=>{})


const add = async ()=>{
const fd = new FormData();
fd.append('title', form.title); fd.append('agenda', form.agenda); fd.append('date', form.date); fd.append('time', form.time)
await api.post('/meetings', fd, { headers: {'Content-Type':'multipart/form-data'} })
setForm({ title:'', agenda:'', date:'', time:'' }); load()
}


return (
<div>
<div className="header"><h2>Meetings</h2></div>
<div className="card">
<h4>Schedule Meeting</h4>
<div className="form-row"><label>Title</label><input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} /></div>
<div className="form-row"><label>Agenda</label><textarea value={form.agenda} onChange={e=>setForm({...form, agenda:e.target.value})} /></div>
<div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
<div className="form-row"><label>Time</label><input type="time" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} /></div>
<div className="form-row"><label>MOM File (optional)</label><input type="file" onChange={e=>setForm({...form, mom_file:e.target.files && e.target.files[0]})} /></div>
<button className="btn" onClick={add}>Schedule</button>
</div>


<div className="card">
<h4>Upcoming / Past Meetings</h4>
<table className="table"><thead><tr><th>Title</th><th>Date</th><th>Agenda</th><th>MOM</th></tr></thead>
<tbody>
{meetings.map(m=> (
<tr key={m.meeting_id}><td>{m.title}</td><td>{m.date}</td><td>{m.agenda}</td><td>{m.mom_file_url ? <a href={`http://localhost:5000${m.mom_file_url}`} target="_blank" rel="noreferrer">View</a> : '-'}</td></tr>
))}
</tbody></table>
</div>
</div>
)
}