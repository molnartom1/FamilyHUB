import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./index.css"
import App from "./pages/App"
import Household from "./pages/Household"
import Join from "./pages/Join"

const router = createBrowserRouter([
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
    navigator.serviceWorker.register('/sw.js').catch(console.warn)
  })
}
