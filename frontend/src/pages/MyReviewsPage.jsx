import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import reviewService from '../services/reviewService'
import reviewCycleService from '../services/reviewCycleService'

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get active cycle and reviews in parallel
      const [cycleResponse, reviewsResponse] = await Promise.all([
        reviewCycleService.getActiveCycle(),
        reviewService.getMyReviews()
      ])

      setActiveCycle(cycleResponse.cycle)
      setReviews(reviewsResponse.reviews || [])
    } catch (err) {
      setError(err.message || 'Failed to load reviews')
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const getReviewTypeLabel = (type) => {
    switch (type) {
      case 'self':
        return 'Self-Evaluation'
      case 'peer_360':
        return '360 Review'
      case 'manager':
        return 'Manager Review'
      default:
        return 'Review'
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'submitted') {
      return (
        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
          Submitted
        </span>
      )
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
        Draft
      </span>
    )
  }

  const handleReviewClick = (review) => {
    navigate(`/reviews/${review.reviewId}`, {
      state: {
        reviewCycleId: review.reviewCycleId,
        revieweeId: review.revieweeId,
        revieweeName: review.revieweeName,
        revieweeJobTitle: review.revieweeJobTitle,
        reviewType: review.reviewType,
        existingReview: review
      }
    })
  }

  const pendingReviews = reviews.filter(r => r.status === 'draft')
  const submittedReviews = reviews.filter(r => r.status === 'submitted')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading reviews...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete your pending reviews and view submitted reviews
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {activeCycle && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900">Active Review Cycle</h2>
            <p className="text-sm text-blue-800 mt-1">{activeCycle.name}</p>
            <div className="mt-2 text-xs text-blue-700">
              <p>Period: {new Date(activeCycle.startDate).toLocaleDateString()} - {new Date(activeCycle.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pending Reviews ({pendingReviews.length})
            </h2>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {pendingReviews.map((review) => (
                  <li
                    key={review.reviewId}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleReviewClick(review)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-medium text-gray-900">
                            {getReviewTypeLabel(review.reviewType)}
                          </h3>
                          {getStatusBadge(review.status)}
                        </div>
                        {review.reviewType !== 'self' && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-700">{review.revieweeName}</p>
                            <p className="text-xs text-gray-500">{review.revieweeJobTitle}</p>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Last updated: {new Date(review.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Submitted Reviews */}
        {submittedReviews.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Submitted Reviews ({submittedReviews.length})
            </h2>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {submittedReviews.map((review) => (
                  <li
                    key={review.reviewId}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleReviewClick(review)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-medium text-gray-900">
                            {getReviewTypeLabel(review.reviewType)}
                          </h3>
                          {getStatusBadge(review.status)}
                        </div>
                        {review.reviewType !== 'self' && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-700">{review.revieweeName}</p>
                            <p className="text-xs text-gray-500">{review.revieweeJobTitle}</p>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Submitted: {new Date(review.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* No Reviews */}
        {reviews.length === 0 && (
          <div className="bg-white shadow-md rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any pending reviews at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyReviewsPage
