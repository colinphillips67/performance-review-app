import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const DashboardPage = () => {
  const { user } = useAuth()

  const features = [
    {
      title: 'My Reviews',
      description: 'View and complete your self-evaluation, 360 reviews, and see your manager\'s feedback',
      path: '/my-reviews',
      icon: '📝',
      status: 'available',
      color: 'blue'
    },
    {
      title: 'Team Reviews',
      description: 'View and manage reviews for your direct reports (managers only)',
      path: '/team-reviews',
      icon: '👥',
      status: 'coming-soon',
      color: 'gray'
    }
  ]

  // If user is admin, show admin features
  const adminFeatures = user?.isAdmin ? [
    {
      title: 'Admin Dashboard',
      description: 'Overview of all review cycles, participation rates, and system metrics',
      path: '/admin',
      icon: '📊',
      status: 'coming-soon',
      color: 'gray'
    },
    {
      title: 'User Management',
      description: 'Create, edit, and manage user accounts and permissions',
      path: '/admin/users',
      icon: '👤',
      status: 'available',
      color: 'purple'
    },
    {
      title: 'Review Cycles',
      description: 'Create and manage performance review cycles and assign participants',
      path: '/admin/review-cycles',
      icon: '🔄',
      status: 'available',
      color: 'purple'
    },
    {
      title: 'Organization Chart',
      description: 'Manage organizational hierarchy and reporting relationships',
      path: '/admin/org-chart',
      icon: '🏢',
      status: 'coming-soon',
      color: 'gray'
    }
  ] : []

  const allFeatures = [...features, ...adminFeatures]

  const getStatusBadge = (status) => {
    if (status === 'available') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Available
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Coming Soon
      </span>
    )
  }

  const getColorClasses = (color, status) => {
    if (status === 'coming-soon') {
      return 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
    }

    const colorMap = {
      blue: 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md',
      purple: 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md',
      gray: 'bg-gray-50 border-gray-200'
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Performance Review System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.firstName} {user?.lastName}
            </span>
            {user?.isAdmin && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                ADMIN
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-gray-600">
            Here are the features available to you in the Performance Review System
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allFeatures.map((feature) => {
            const FeatureCard = feature.status === 'available' ? Link : 'div'
            const cardProps = feature.status === 'available'
              ? { to: feature.path }
              : {}

            return (
              <FeatureCard
                key={feature.path}
                {...cardProps}
                className={`border-2 rounded-lg p-6 transition-all ${getColorClasses(feature.color, feature.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  {getStatusBadge(feature.status)}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>

                {feature.status === 'available' && (
                  <div className="text-sm font-medium text-blue-600 flex items-center">
                    Go to {feature.title}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}

                {feature.status === 'coming-soon' && (
                  <div className="text-sm text-gray-500 italic">
                    This feature is under development
                  </div>
                )}
              </FeatureCard>
            )
          })}
        </div>

        {/* Quick Stats or Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Getting Started
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Visit <strong>My Reviews</strong> to see your assigned reviews and complete your self-evaluation</span>
            </li>
            {user?.isAdmin && (
              <>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use <strong>Review Cycles</strong> to create a new performance review cycle and add participants</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Manage user accounts through <strong>User Management</strong></span>
                </li>
              </>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
