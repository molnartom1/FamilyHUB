import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"

// FILL THESE FROM YOUR FIREBASE PROJECT SETTINGS
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

enableIndexedDbPersistence(db).catch(() => {
  console.warn("Offline persistence already enabled or unsupported.")
})

export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
}

export const onAuth = (cb: (user: any)=>void) => onAuthStateChanged(auth, cb)
