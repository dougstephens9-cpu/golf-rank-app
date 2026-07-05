import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Search from './pages/Search'
import CourseDetail from './pages/CourseDetail'
import RateCourse from './pages/RateCourse'
import Top10 from './pages/Top10'
import Friends from './pages/Friends'
import FriendTop10 from './pages/FriendTop10'
import Profile from './pages/Profile'

function ProtectedShell({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-emerald-700">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNav />
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedShell>
            <Search />
          </ProtectedShell>
        }
      />
      <Route
        path="/course/:courseId"
        element={
          <ProtectedShell>
            <CourseDetail />
          </ProtectedShell>
        }
      />
      <Route
        path="/course/:courseId/rate"
        element={
          <ProtectedShell>
            <RateCourse />
          </ProtectedShell>
        }
      />
      <Route
        path="/top10"
        element={
          <ProtectedShell>
            <Top10 />
          </ProtectedShell>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedShell>
            <Friends />
          </ProtectedShell>
        }
      />
      <Route
        path="/friends/:friendId"
        element={
          <ProtectedShell>
            <FriendTop10 />
          </ProtectedShell>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedShell>
            <Profile />
          </ProtectedShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
