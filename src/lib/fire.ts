import { db } from "@/firebase"
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, onSnapshot, serverTimestamp,
  query, where, orderBy, updateDoc, deleteDoc
} from "firebase/firestore"

export const col = (...path: string[]) => collection(db, path.join("/"))
export const ref = (...path: string[]) => doc(db, path.join("/"))

export const now = () => Date.now()

export const listen = (path: string[], q?: any, cb?: any) => {
  const c = collection(db, path.join("/"))
  const qq = q || query(c)
  return onSnapshot(qq, cb)
}

export { addDoc, setDoc, getDoc, getDocs, onSnapshot, serverTimestamp, query, where, orderBy, updateDoc, deleteDoc, collection, doc }
