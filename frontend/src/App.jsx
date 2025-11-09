import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MyReviewsPage from './pages/MyReviewsPage'
import TeamReviewsPage from './pages/TeamReviewsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import UsersPage from './pages/admin/UsersPage'
import OrgChartPage from './pages/admin/OrgChartPage'
import ReviewCyclesPage from './pages/admin/ReviewCyclesPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/my-reviews" element={<PrivateRoute><MyReviewsPage /></PrivateRoute>} />
          <Route path="/team-reviews" element={<PrivateRoute><TeamReviewsPage /></PrivateRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/admin/org-chart" element={<AdminRoute><OrgChartPage /></AdminRoute>} />
          <Route path="/admin/review-cycles" element={<AdminRoute><ReviewCyclesPage /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
