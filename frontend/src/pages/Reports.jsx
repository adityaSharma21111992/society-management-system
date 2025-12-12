import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'


export default function Reports(){
const [data, setData] = useState([])


useEffect(()=>{
// fetch last 6 months summary
const today = new Date();
const year = today.getFullYear();
const months = []
for(let i=5;i>=0;i--){
const d = new Date(); d.setMonth(d.getMonth()-i)
months.push({ year: d.getFullYear(), month: d.getMonth()+1 })
}
Promise.all(months.map(m => api.get(`/reports/summary/${m.year}/${m.month}`).then(r=>({ ...r.data, label: `${m.month}-${m.year}` })).catch(()=>({ total_income:0, total_expense:0, net:0, label:`${m.month}-${m.year}`})) )).then(setData)
},[])


return (
<div>
<div className="header"><h2>Reports</h2></div>
<div className="card" style={{height:320}}>
<h4>Income vs Expense (last 6 months)</h4>
<ResponsiveContainer width="100%" height={240}>
<BarChart data={data}>
<XAxis dataKey="label" />
<YAxis />
<Tooltip />
<Bar dataKey="total_income" name="Income" />
<Bar dataKey="total_expense" name="Expense" />
</BarChart>
</ResponsiveContainer>
</div>
</div>
)
}