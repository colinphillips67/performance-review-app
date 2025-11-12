import { Link } from 'react-router-dom'

const AdminDashboardPage = () => {
  const adminTools = [
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
    },
    {
      title: 'Reports & Analytics',
      description: 'View completion rates, participation metrics, and system-wide analytics',
      path: '/admin/reports',
      icon: '📈',
      status: 'coming-soon',
      color: 'gray'
    },
    {
      title: 'Settings',
      description: 'Configure system settings, email templates, and review parameters',
      path: '/admin/settings',
      icon: '⚙️',
      status: 'coming-soon',
      color: 'gray'
    }
  ]

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

    return 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded">
              ADMIN
            </span>
          </div>
          <p className="text-gray-600">
            Administrative tools and system management
          </p>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminTools.map((tool) => {
            const ToolCard = tool.status === 'available' ? Link : 'div'
            const cardProps = tool.status === 'available'
              ? { to: tool.path }
              : {}

            return (
              <ToolCard
                key={tool.path}
                {...cardProps}
                className={`border-2 rounded-lg p-6 transition-all ${getColorClasses(tool.color, tool.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{tool.icon}</div>
                  {getStatusBadge(tool.status)}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {tool.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4">
                  {tool.description}
                </p>

                {tool.status === 'available' && (
                  <div className="text-sm font-medium text-purple-600 flex items-center">
                    Open {tool.title}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}

                {tool.status === 'coming-soon' && (
                  <div className="text-sm text-gray-500 italic">
                    This feature is under development
                  </div>
                )}
              </ToolCard>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            🎯 Admin Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Managing Review Cycles</h4>
              <ul className="space-y-1 text-purple-700 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Create a new review cycle in <strong>Review Cycles</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Add participants to the cycle</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Launch the cycle to start the review process</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">User Management</h4>
              <ul className="space-y-1 text-purple-700 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Create new user accounts from <strong>User Management</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Edit user details and assign admin privileges</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Deactivate accounts when needed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Main Dashboard */}
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
