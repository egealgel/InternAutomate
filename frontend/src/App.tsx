import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import { Briefcase, Search } from "lucide-react"
import Dashboard from "./pages/Dashboard"
import JobDetail from "./pages/JobDetail"
import ScrapeForm from "./pages/ScrapeForm"

function Layout() {
  return (
    <div className="min-h-screen" style={{ background: "#0d1117" }}>
      <nav className="sticky top-0 z-10 border-b" style={{ background: "#161b22", borderColor: "#30363d" }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
          <span className="flex items-center gap-2 font-bold text-white">
            <Briefcase className="h-5 w-5 text-blue-400" />
            InternAutomate
          </span>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200"}`
            }
          >
            İlanlar
          </NavLink>
          <NavLink
            to="/scrape"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors flex items-center gap-1 ${isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200"}`
            }
          >
            <Search className="h-3.5 w-3.5" /> İlan Tara
          </NavLink>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/scrape" element={<ScrapeForm />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
