import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { auth } from "@/firebase"
import { col, ref, query, where, getDocs, updateDoc } from "@/lib/fire"

export default function Join(){
  const { code } = useParams()
  const [houseId, setHouseId] = useState<string>("")
  const nav = useNavigate()

  useEffect(()=>{
    (async ()=>{
      const qs = await getDocs(query(col("households")))
      for (const d of qs.docs){
        const invs = await getDocs(query(col("households", d.id, "invites"), where("code","==", code)))
        if (!invs.empty) {
          setHouseId(d.id)
          break
        }
      }
    })()
  },[code])

  const accept = async () => {
    const user = auth.currentUser
    if (!user || !houseId) return
    // add self as member
    await updateDoc(ref("households", houseId, "members", user.uid), { uid: user.uid, name: user.displayName || "Ismeretlen", color: "#0ea5e9", avatarUrl: user.photoURL||"" }, { merge: true } as any)
    nav(`/h/${houseId}`)
  }

  if (!houseId) return <div className="p-6">Meghívó ellenőrzése...</div>
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full">
        <h1 className="text-xl font-semibold mb-3">Csatlakozás</h1>
        <p className="mb-4">Szeretnél csatlakozni ehhez a családi táblához?</p>
        <button className="btn" onClick={accept}>Csatlakozom</button>
      </div>
    </div>
  )
}
