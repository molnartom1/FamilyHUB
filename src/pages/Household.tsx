import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { auth } from "@/firebase"
import { col, ref, onSnapshot, addDoc, updateDoc, deleteDoc, query, where, orderBy } from "@/lib/fire"
import type { Member, Task, ShoppingItem, EventItem, Note, Invite } from "@/types"
import { todayStr, withinNextDays } from "@/lib/date"
import { requestNotifyPermission, notify } from "@/lib/notifications"
import { v4 as uuid } from "uuid"

export default function Household() {
  const { hid } = useParams()
  const [user, setUser] = useState<any>(auth.currentUser)
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [shopping, setShopping] = useState<ShoppingItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [invCode, setInvCode] = useState<string>("")

  useEffect(()=>{
    const unsub = auth.onAuthStateChanged(u => setUser(u))
    return () => unsub()
  },[])

  useEffect(()=>{
    if (!hid) return
    const unsubs = [
      onSnapshot(col("households", hid, "members"), (s)=>{
        setMembers(s.docs.map(d=>({uid:d.id, ...d.data()})) as Member[])
      }),
      onSnapshot(query(col("households", hid, "tasks"), where("date", "==", todayStr()), orderBy("createdAt","asc")), (s)=>{
        setTasks(s.docs.map(d=>({id:d.id, ...d.data()})) as Task[])
      }),
      onSnapshot(query(col("households", hid, "shopping"), orderBy("createdAt","asc")), (s)=>{
        setShopping(s.docs.map(d=>({id:d.id, ...d.data()})) as ShoppingItem[])
      }),
      onSnapshot(query(col("households", hid, "events"), orderBy("date","asc")), (s)=>{
        setEvents(s.docs.map(d=>({id:d.id, ...d.data()})) as EventItem[])
      }),
      onSnapshot(query(col("households", hid, "notes"), orderBy("createdAt","desc")), (s)=>{
        setNotes(s.docs.map(d=>({id:d.id, ...d.data()})) as Note[])
      }),
    ]
    return () => unsubs.forEach(u=>u())
  },[hid])

  useEffect(()=>{
    (async ()=>{
      const granted = await requestNotifyPermission()
      if (granted) {
        const upcoming = events.filter(e=> withinNextDays(e.date, 7))
        if (upcoming.length) {
          notify("Közelgő események", { body: upcoming.slice(0,3).map(e=>`${e.date} — ${e.title}`).join("\n") })
        }
      }
    })()
  },[events])

  const me: Member|undefined = useMemo(()=>members.find(m=>m.uid===user?.uid),[members,user])

  const addMeIfMissing = async () => {
    if (!hid || !user) return
    const mref = ref("households", hid, "members", user.uid)
    await updateDoc(mref, {}, { merge: true }).catch(async ()=>{
      const color = randomColor()
      await updateDoc(mref, { uid: user.uid, name: user.displayName || "Ismeretlen", color, avatarUrl: user.photoURL || "" }, { merge: true })
    })
  }

  useEffect(()=>{ addMeIfMissing() },[user, hid])

  const createInvite = async () => {
    if (!hid || !user) return
    const code = uuid().split("-")[0]
    await addDoc(col("households", hid, "invites"), { code, createdAt: Date.now(), createdBy: user.uid } as Invite)
    setInvCode(code)
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="link">&larr; Vissza</Link>
          <h1 className="text-2xl font-bold">FamBoard</h1>
        </div>
        <div className="flex items-center gap-2">
          {me && <span className="badge" style={{background: me.color, color: "#fff"}}>{me.name}</span>}
          <button className="btn" onClick={createInvite}>Meghívó link</button>
        </div>
      </header>

      {invCode && (
        <div className="card mb-4">
          <div className="flex items-center justify-between gap-4">
            <p>Megosztható meghívó: <code className="bg-slate-100 px-2 py-1 rounded">{location.origin}/join/{invCode}</code></p>
            <button className="btn" onClick={()=>navigator.clipboard.writeText(`${location.origin}/join/${invCode}`)}>Másolás</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tasks hid={hid!} me={me}/>
        <Shopping hid={hid!} me={me}/>
        <Events hid={hid!} members={members}/>
        <Notes hid={hid!} />
      </div>

      <Members hid={hid!} members={members}/>
    </div>
  )
}

function randomColor(){
  const hues = [200, 330, 20, 120, 260, 45, 0, 180]
  const h = hues[Math.floor(Math.random()*hues.length)]
  return `hsl(${h} 85% 45%)`
}

function Card(props: any){
  return <div className="card h-full">{props.children}</div>
}

function SectionTitle({title}:{title:string}){
  return <h2 className="font-semibold text-slate-700 mb-2">{title}</h2>
}

// Tasks
function Tasks({hid, me}:{hid:string, me?:any}){
  const [input, setInput] = useState("")
  const [items, setItems] = useState<Task[]>([])

  useEffect(()=>{
    return onSnapshot(query(col("households", hid, "tasks"), where("date","==", todayStr()), orderBy("createdAt","asc")), (s)=>{
      setItems(s.docs.map(d=>({id:d.id, ...d.data()})) as any)
    })
  },[hid])

  const addItem = async () => {
    if (!input.trim()) return
    await addDoc(col("households", hid, "tasks"), {
      title: input.trim(), done: false, date: todayStr(),
      createdAt: Date.now(), assignedTo: me?.uid
    } as Task)
    setInput("")
  }

  const toggle = async (it: Task) => {
    await updateDoc(ref("households", hid, "tasks", it.id), { done: !it.done })
  }
  const remove = async (it: Task) => {
    await deleteDoc(ref("households", hid, "tasks", it.id))
  }

  return (
    <Card>
      <SectionTitle title="Mai teendők"/>
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder="Új feladat..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()}/>
        <button className="btn" onClick={addItem}>Hozzáadás</button>
      </div>
      <ul className="space-y-2">
        {items.map(it=> (
          <li key={it.id} className="flex items-center gap-2">
            <input type="checkbox" checked={it.done} onChange={()=>toggle(it)} />
            <span className={"flex-1 " + (it.done?"line-through text-slate-400":"")}>{it.title}</span>
            <button className="iconbtn" onClick={()=>remove(it)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// Shopping
function Shopping({hid, me}:{hid:string, me?:any}){
  const [input, setInput] = useState("")
  const [items, setItems] = useState<ShoppingItem[]>([])
  useEffect(()=>{
    return onSnapshot(query(col("households", hid, "shopping"), orderBy("createdAt","asc")), (s)=>{
      setItems(s.docs.map(d=>({id:d.id, ...d.data()})) as any)
    })
  },[hid])

  const addItem = async () => {
    if (!input.trim()) return
    await addDoc(col("households", hid, "shopping"), {
      title: input.trim(), qty: "", done: false, createdAt: Date.now(), addedBy: me?.uid
    } as ShoppingItem)
    setInput("")
  }

  const toggle = async (it: ShoppingItem) => {
    await updateDoc(ref("households", hid, "shopping", it.id), { done: !it.done })
  }
  const remove = async (it: ShoppingItem) => {
    await deleteDoc(ref("households", hid, "shopping", it.id))
  }

  return (
    <Card>
      <SectionTitle title="Bevásárlólista"/>
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder="Új tétel..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()}/>
        <button className="btn" onClick={addItem}>Hozzáadás</button>
      </div>
      <ul className="space-y-2">
        {items.map(it=> (
          <li key={it.id} className="flex items-center gap-2">
            <input type="checkbox" checked={it.done} onChange={()=>toggle(it)} />
            <span className={"flex-1 " + (it.done?"line-through text-slate-400":"")}>{it.title}</span>
            <button className="iconbtn" onClick={()=>remove(it)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// Events
function Events({hid, members}:{hid:string, members:Member[]}){
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10))
  const [items, setItems] = useState<EventItem[]>([])

  useEffect(()=>{
    return onSnapshot(query(col("households", hid, "events"), orderBy("date","asc")), (s)=>{
      setItems(s.docs.map(d=>({id:d.id, ...d.data()})) as any)
    })
  },[hid])

  const addItem = async () => {
    if (!title.trim()) return
    await addDoc(col("households", hid, "events"), {
      title: title.trim(), date, createdAt: Date.now(), type: "event"
    } as EventItem)
    setTitle("")
  }

  const remove = async (it: EventItem) => {
    await deleteDoc(ref("households", hid, "events", it.id))
  }

  return (
    <Card>
      <SectionTitle title="Események / Szülinapok"/>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <input className="input col-span-2" placeholder="Új esemény..." value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <button className="btn mb-3" onClick={addItem}>Hozzáadás</button>
      <ul className="space-y-2 max-h-72 overflow-auto pr-2">
        {items.map(it=> (
          <li key={it.id} className="flex items-center gap-2">
            <span className="badge bg-slate-800 text-white">{it.date}</span>
            <span className="flex-1">{it.title}</span>
            <button className="iconbtn" onClick={()=>remove(it)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// Notes
function Notes({hid}:{hid:string}){
  const [input, setInput] = useState("")
  const [items, setItems] = useState<Note[]>([])

  useEffect(()=>{
    return onSnapshot(query(col("households", hid, "notes"), orderBy("createdAt","desc")), (s)=>{
      setItems(s.docs.map(d=>({id:d.id, ...d.data()})) as any)
    })
  },[hid])

  const addItem = async () => {
    if (!input.trim()) return
    await addDoc(col("households", hid, "notes"), {
      text: input.trim(), createdAt: Date.now()
    } as Note)
    setInput("")
  }

  const remove = async (it: Note) => {
    await deleteDoc(ref("households", hid, "notes", it.id))
  }

  return (
    <Card>
      <SectionTitle title="Jegyzetek"/>
      <textarea className="input mb-2" rows={3} placeholder="Új jegyzet..." value={input} onChange={e=>setInput(e.target.value)} />
      <div className="flex justify-end mb-3"><button className="btn" onClick={addItem}>Mentés</button></div>
      <ul className="space-y-2 max-h-72 overflow-auto pr-2">
        {items.map(it=> (
          <li key={it.id} className="flex items-start gap-2">
            <span className="text-slate-400 text-sm">{new Date(it.createdAt).toLocaleString()}</span>
            <p className="flex-1 whitespace-pre-wrap">{it.text}</p>
            <button className="iconbtn" onClick={()=>remove(it)}>🗑️</button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// Members admin
function Members({hid, members}:{hid:string, members:Member[]}){
  const [name, setName] = useState("")
  const [birthday, setBirthday] = useState("")
  const [color, setColor] = useState("#0ea5e9")

  const addMember = async () => {
    const uid = crypto.randomUUID()
    await updateDoc(ref("households", hid, "members", uid), { uid, name: name||"Név", color, birthday }, { merge: true } as any)
    setName("")
    setBirthday("")
  }

  const remove = async (m: Member) => {
    await deleteDoc(ref("households", hid, "members", m.uid))
  }

  return (
    <div className="card mt-4">
      <h3 className="font-semibold text-slate-700 mb-3">Családtagok</h3>
      <div className="grid sm:grid-cols-4 gap-2 mb-3">
        <input className="input" placeholder="Név" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" type="date" value={birthday} onChange={e=>setBirthday(e.target.value)} />
        <input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)} />
        <button className="btn" onClick={addMember}>Hozzáadás</button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {members.map(m=> (
          <li key={m.uid} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100">
            <span className="w-3 h-3 rounded-full" style={{background:m.color}}/>
            <span>{m.name}</span>
            {m.birthday && <span className="text-slate-500 text-sm">({m.birthday})</span>}
            <button className="iconbtn" onClick={()=>remove(m)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
