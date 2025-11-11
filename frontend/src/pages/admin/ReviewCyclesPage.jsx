import { useState, useEffect } from 'react'
import reviewCycleService from '../../services/reviewCycleService'
import CreateCycleModal from '../../components/admin/CreateCycleModal'
import EditCycleModal from '../../components/admin/EditCycleModal'
import ParticipantsModal from '../../components/admin/ParticipantsModal'

const ReviewCyclesPage = () => {
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all') // all, planning, active, completed, cancelled
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState(null)

  useEffect(() => {
    fetchCycles()
  }, [])

  const fetchCycles = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reviewCycleService.getAllCycles()
      setCycles(data)
    } catch (err) {
      setError(err.message || 'Failed to load review cycles')
      console.error('Error fetching review cycles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCycle = async (cycleData) => {
    try {
      await reviewCycleService.createCycle(cycleData)
      await fetchCycles()
      setShowCreateModal(false)
    } catch (err) {
      throw new Error(err.message || 'Failed to create review cycle')
    }
  }

  const handleEditCycle = async (cycleId, cycleData) => {
    try {
      await reviewCycleService.updateCycle(cycleId, cycleData)
      await fetchCycles()
      setShowEditModal(false)
      setSelectedCycle(null)
    } catch (err) {
      throw new Error(err.message || 'Failed to update review cycle')
    }
  }

  const handleLaunchCycle = async (cycleId) => {
    try {
      if (confirm('Are you sure you want to launch this review cycle? This will make it active.')) {
        await reviewCycleService.launchCycle(cycleId)
        await fetchCycles()
      }
    } catch (err) {
      alert(err.message || 'Failed to launch review cycle')
    }
  }

  const handleCancelCycle = async (cycleId) => {
    try {
      if (confirm('Are you sure you want to cancel this review cycle? This action cannot be undone.')) {
        await reviewCycleService.cancelCycle(cycleId)
        await fetchCycles()
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel review cycle')
    }
  }

  const openEditModal = (cycle) => {
    setSelectedCycle(cycle)
    setShowEditModal(true)
  }

  const openParticipantsModal = (cycle) => {
    setSelectedCycle(cycle)
    setShowParticipantsModal(true)
  }

  const handleParticipantsUpdate = (cycleId, newParticipantCount) => {
    // Update only the specific cycle's participant count without re-fetching all data
    setCycles(prevCycles =>
      prevCycles.map(cycle =>
        cycle.cycleId === cycleId
          ? { ...cycle, participantCount: newParticipantCount }
          : cycle
      )
    )
  }

  // Filter cycles by status
  const filteredCycles = cycles.filter((cycle) => {
    if (filterStatus === 'all') return true
    return cycle.status === filterStatus
  })

  // Get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading review cycles...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Cycles</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage performance review cycles and participants
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Review Cycle
        </button>
      </div>

      {/* Cycles Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participants
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCycles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  {filterStatus === 'all'
                    ? 'No review cycles found. Create one to get started.'
                    : `No ${filterStatus} review cycles found.`}
                </td>
              </tr>
            ) : (
              filteredCycles.map((cycle) => (
                <tr key={cycle.cycleId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{cycle.name}</div>
                    {cycle.description && (
                      <div className="text-sm text-gray-500">{cycle.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                        cycle.status
                      )}`}
                    >
                      {cycle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{formatDate(cycle.startDate)} -</div>
                    <div>{formatDate(cycle.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cycle.participantCount || 0} participants
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openParticipantsModal(cycle)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Participants
                      </button>
                      <button
                        onClick={() => openEditModal(cycle)}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={cycle.status === 'completed' || cycle.status === 'cancelled'}
                      >
                        Edit
                      </button>
                      {cycle.status === 'planning' && (
                        <button
                          onClick={() => handleLaunchCycle(cycle.cycleId)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Launch
                        </button>
                      )}
                      {(cycle.status === 'planning' || cycle.status === 'active') && (
                        <button
                          onClick={() => handleCancelCycle(cycle.cycleId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCycleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCycle}
        />
      )}

      {showEditModal && selectedCycle && (
        <EditCycleModal
          cycle={selectedCycle}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCycle(null)
          }}
          onUpdate={handleEditCycle}
        />
      )}

      {showParticipantsModal && selectedCycle && (
        <ParticipantsModal
          cycle={selectedCycle}
          onClose={() => {
            setShowParticipantsModal(false)
            setSelectedCycle(null)
          }}
          onUpdate={handleParticipantsUpdate}
        />
      )}
    </div>
  )
}

export default ReviewCyclesPage
