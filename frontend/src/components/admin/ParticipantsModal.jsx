import { useState, useEffect } from 'react'
import reviewCycleService from '../../services/reviewCycleService'
import api from '../../services/api'

const ParticipantsModal = ({ cycle, onClose, onUpdate }) => {
  const [participants, setParticipants] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [cycle.cycleId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [participantsData, usersData] = await Promise.all([
        reviewCycleService.getParticipants(cycle.cycleId),
        api.get('/users')
      ])
      setParticipants(participantsData)
      setAllUsers(usersData.data.users)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user')
      return
    }

    try {
      setAdding(true)
      await reviewCycleService.addParticipants(cycle.cycleId, selectedUsers)
      await fetchData()
      setSelectedUsers([])
      if (onUpdate) onUpdate()
    } catch (err) {
      alert(err.message || 'Failed to add participants')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveParticipant = async (userId) => {
    if (!confirm('Are you sure you want to remove this participant from the review cycle?')) {
      return
    }

    try {
      setRemoving(userId)
      await reviewCycleService.removeParticipant(cycle.cycleId, userId)
      await fetchData()
      if (onUpdate) onUpdate()
    } catch (err) {
      alert(err.message || 'Failed to remove participant')
    } finally {
      setRemoving(null)
    }
  }

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const availableUsers = allUsers.filter(
    user => !participants.some(p => p.userId === user.userId)
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Manage Participants</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {cycle.name} - {participants.length} participant(s)
            </p>
          </div>

          {error && (
            <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-white px-6 pb-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Current Participants */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Current Participants</h4>
                  <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                    {participants.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No participants yet
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {participants.map(participant => (
                          <li key={participant.participantId} className="p-3 flex items-start justify-between group hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {participant.firstName} {participant.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{participant.email}</div>
                              <div className="text-xs text-gray-500">{participant.jobTitle}</div>
                            </div>
                            <button
                              onClick={() => handleRemoveParticipant(participant.userId)}
                              disabled={removing === participant.userId}
                              className="ml-3 p-1 text-gray-400 hover:text-red-600 focus:outline-none disabled:opacity-50"
                              title="Remove participant"
                            >
                              {removing === participant.userId ? (
                                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Add Participants */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Add Participants</h4>
                  <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        All users are already participants
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {availableUsers.map(user => (
                          <li key={user.userId} className="p-3">
                            <label className="flex items-start cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.userId)}
                                onChange={() => handleUserToggle(user.userId)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                                <div className="text-xs text-gray-500">{user.jobTitle}</div>
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={handleAddParticipants}
                      disabled={adding}
                      className="mt-3 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {adding ? 'Adding...' : `Add ${selectedUsers.length} Participant(s)`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParticipantsModal
