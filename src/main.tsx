import React from "react"
import ReactDOM from "react-dom/client"
import { createHashRouter, RouterProvider } from "react-router-dom"
import "./index.css"
import App from "./pages/App"
import Household from "./pages/Household"
import Join from "./pages/Join"

const router = createHashRouter([
  { path: "/", element: <App/> },
  { path: "/h/:hid", element: <Household/> },
  { path: "/join/:code", element: <Join/> }
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

// Register service worker for offline PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(console.warn)
  })
}
