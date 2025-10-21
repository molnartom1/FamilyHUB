import { useEffect, useState } from "react"
import { auth, googleSignIn } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { col, addDoc, query, where, getDocs } from "@/lib/fire"

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(()=>{
    return onAuthStateChanged(auth, async (u)=>{
      setUser(u)
      setLoading(false)
      if (u) {
        // find or create household for user
        const q = query(col("households"), where("ownerUid","==", u.uid))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const hid = snap.docs[0].id
          nav(`/h/${hid}`)
        }
      }
    })
  },[])

  const createHousehold = async () => {
    if (!user) return
    const res = await addDoc(col("households"), {
      name: "Család",
      createdAt: Date.now(),
      ownerUid: user.uid
    })
    nav(`/h/${res.id}`)
  }

  if (loading) return <div className="p-6">Betöltés...</div>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">FamBoard</h1>
      <p className="text-slate-600 mb-6 text-center">Közös családi napi teendők, bevásárlólista, események és jegyzetek — valós idejű szinkron és offline PWA.</p>

      {!user ? (
        <button className="btn" onClick={googleSignIn}>Belépés Google-fiókkal</button>
      ) : (
        <div className="flex gap-3">
          <button className="btn" onClick={createHousehold}>Új családi tábla létrehozása</button>
        </div>
      )}
    </div>
  )
}
