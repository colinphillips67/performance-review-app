import { useAuth } from '../contexts/AuthContext'

const DashboardPage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Performance Review System</h1>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-4">Welcome, {user?.email}</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Dashboard page - Coming soon</p>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
