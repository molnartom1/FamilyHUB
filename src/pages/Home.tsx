import { useEffect, useMemo, useState } from "react"
import { get, set, uid, today } from "@/lib/storage"
import type { DB, Member, Task, Shopping, EventItem, Note } from "@/types"

const KEY = "famboard-base"

export default function Home(){
  const [db, setDb] = useState<DB>(() => get<DB>(KEY, { members:[], tasks:[], shopping:[], events:[], notes:[] }))

  useEffect(()=>{ set(KEY, db) }, [db])

  const members = db.members
  const tasksToday = useMemo(()=> db.tasks.filter(t=> t.date === today()), [db.tasks])

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">FamBoard Base (offline, helyi)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tasks tasks={tasksToday} onAdd={(title)=>setDb(s=>({...s, tasks:[...s.tasks, {id:uid(), title, done:false, date: today()}]}))}
               onToggle={(id)=>setDb(s=>({...s, tasks:s.tasks.map(t=> t.id===id? {...t, done:!t.done}:t)}))}
               onDelete={(id)=>setDb(s=>({...s, tasks:s.tasks.filter(t=>t.id!==id)}))}
        />
        <ShoppingList shopping={db.shopping}
            onAdd={(title)=>setDb(s=>({...s, shopping:[...s.shopping,{id:uid(), title, done:false}]}))}
            onToggle={(id)=>setDb(s=>({...s, shopping:s.shopping.map(i=> i.id===id? {...i, done:!i.done}:i)}))}
            onDelete={(id)=>setDb(s=>({...s, shopping:s.shopping.filter(i=>i.id!==id)}))}
        />
        <Events events={db.events}
            onAdd={(title,date)=>setDb(s=>({...s, events:[...s.events,{id:uid(), title, date}]}))}
            onDelete={(id)=>setDb(s=>({...s, events:s.events.filter(e=>e.id!==id)}))}
        />
        <Notes notes={db.notes}
            onAdd={(text)=>setDb(s=>({...s, notes:[{id:uid(), text, createdAt: Date.now()}, ...s.notes]}))}
            onDelete={(id)=>setDb(s=>({...s, notes:s.notes.filter(n=>n.id!==id)}))}
        />
      </div>
      <Members members={members}
        onAdd={(name,color,birthday)=>setDb(s=>({...s, members:[...s.members,{id:uid(), name, color, birthday}]}))}
        onDelete={(id)=>setDb(s=>({...s, members:s.members.filter(m=>m.id!==id)}))}
      />
    </div>
  )
}

function Card({children}:{children:any}){ return <div className="card h-full">{children}</div> }
function Title({t}:{t:string}){ return <h2 className="font-semibold text-slate-700 mb-2">{t}</h2> }

function Tasks({tasks,onAdd,onToggle,onDelete}:{tasks:Task[],onAdd:(title:string)=>void,onToggle:(id:string)=>void,onDelete:(id:string)=>void}){
  const [input,setInput]=useState("")
  return (
    <Card>
      <Title t="Mai teendők"/>
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder="Új feladat..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && (onAdd(input.trim()), setInput(''))}/>
        <button className="btn" onClick={()=>{ if(input.trim()){ onAdd(input.trim()); setInput('') }}}>Hozzáadás</button>
      </div>
      <ul className="space-y-2">
        {tasks.map(t=> (
          <li key={t.id} className="flex items-center gap-2">
            <input type="checkbox" checked={t.done} onChange={()=>onToggle(t.id)}/>
            <span className={"flex-1 " + (t.done?"line-through text-slate-400":"")}>{t.title}</span>
            <button className="iconbtn" onClick={()=>onDelete(t.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ShoppingList({shopping,onAdd,onToggle,onDelete}:{shopping:Shopping[],onAdd:(title:string)=>void,onToggle:(id:string)=>void,onDelete:(id:string)=>void}){
  const [input,setInput]=useState("")
  return (
    <Card>
      <Title t="Bevásárlólista"/>
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder="Új tétel..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && (onAdd(input.trim()), setInput(''))}/>
        <button className="btn" onClick={()=>{ if(input.trim()){ onAdd(input.trim()); setInput('') }}}>Hozzáadás</button>
      </div>
      <ul className="space-y-2">
        {shopping.map(i=> (
          <li key={i.id} className="flex items-center gap-2">
            <input type="checkbox" checked={i.done} onChange={()=>onToggle(i.id)}/>
            <span className={"flex-1 " + (i.done?"line-through text-slate-400":"")}>{i.title}</span>
            <button className="iconbtn" onClick={()=>onDelete(i.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Events({events,onAdd,onDelete}:{events:EventItem[],onAdd:(title:string,date:string)=>void,onDelete:(id:string)=>void}){
  const [title,setTitle]=useState("")
  const [date,setDate]=useState(()=> new Date().toISOString().slice(0,10))
  return (
    <Card>
      <Title t="Események / Szülinapok"/>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <input className="input col-span-2" placeholder="Új esemény..." value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <button className="btn mb-3" onClick={()=>{ if(title.trim()){ onAdd(title.trim(), date); setTitle('') }}}>Hozzáadás</button>
      <ul className="space-y-2 max-h-72 overflow-auto pr-2">
        {events.map(e=> (
          <li key={e.id} className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-slate-800 text-white text-sm">{e.date}</span>
            <span className="flex-1">{e.title}</span>
            <button className="iconbtn" onClick={()=>onDelete(e.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Notes({notes,onAdd,onDelete}:{notes:Note[],onAdd:(text:string)=>void,onDelete:(id:string)=>void}){
  const [text,setText]=useState("")
  return (
    <Card>
      <Title t="Jegyzetek"/>
      <textarea className="input mb-2" rows={3} placeholder="Új jegyzet..." value={text} onChange={e=>setText(e.target.value)} />
      <div className="flex justify-end mb-3"><button className="btn" onClick={()=>{ if(text.trim()){ onAdd(text.trim()); setText('') }}}>Mentés</button></div>
      <ul className="space-y-2 max-h-72 overflow-auto pr-2">
        {notes.map(n=> (
          <li key={n.id} className="flex items-start gap-2">
            <span className="text-slate-400 text-sm">{new Date(n.createdAt).toLocaleString()}</span>
            <p className="flex-1 whitespace-pre-wrap">{n.text}</p>
            <button className="iconbtn" onClick={()=>onDelete(n.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Members({members,onAdd,onDelete}:{members:Member[],onAdd:(name:string,color:string,bday?:string)=>void,onDelete:(id:string)=>void}){
  const [name,setName]=useState("")
  const [birthday,setBirthday]=useState("")
  const [color,setColor]=useState("#0ea5e9")
  return (
    <div className="card mt-4">
      <h3 className="font-semibold text-slate-700 mb-3">Családtagok</h3>
      <div className="grid sm:grid-cols-4 gap-2 mb-3">
        <input className="input" placeholder="Név" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" type="date" value={birthday} onChange={e=>setBirthday(e.target.value)} />
        <input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)} />
        <button className="btn" onClick={()=>{ onAdd(name||"Név", color, birthday||undefined); setName(''); setBirthday('') }}>Hozzáadás</button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {members.map(m=> (
          <li key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100">
            <span className="w-3 h-3 rounded-full" style={{background:m.color}}/>
            <span>{m.name}</span>
            {m.birthday && <span className="text-slate-500 text-sm">({m.birthday})</span>}
            <button className="iconbtn" onClick={()=>onDelete(m.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
