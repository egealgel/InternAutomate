import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import { Briefcase, Search } from "lucide-react"
import Dashboard from "./pages/Dashboard"
import JobDetail from "./pages/JobDetail"
import ScrapeForm from "./pages/ScrapeForm"

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
          <span className="flex items-center gap-2 font-bold text-gray-900">
            <Briefcase className="h-5 w-5 text-blue-600" />
            InternAutomate
          </span>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`
            }
          >
            İlanlar
          </NavLink>
          <NavLink
            to="/scrape"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors flex items-center gap-1 ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`
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
