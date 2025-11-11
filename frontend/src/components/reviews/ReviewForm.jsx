import { useState, useEffect, useRef } from 'react'
import reviewService from '../../services/reviewService'

const ReviewForm = ({
  reviewCycleId,
  revieweeId,
  revieweeName,
  revieweeJobTitle,
  reviewType,
  existingReview = null,
  onSubmitSuccess,
  onCancel
}) => {
  const [content, setContent] = useState(existingReview?.content || '')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState(existingReview?.updatedAt || null)
  const [error, setError] = useState(null)
  const [reviewId, setReviewId] = useState(existingReview?.reviewId || null)
  const [status, setStatus] = useState(existingReview?.status || 'draft')

  const autoSaveTimerRef = useRef(null)
  const contentRef = useRef(content)

  // Keep content ref in sync
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Auto-save every 60 seconds
  useEffect(() => {
    if (status === 'submitted') return // Don't auto-save submitted reviews

    const startAutoSave = () => {
      autoSaveTimerRef.current = setInterval(async () => {
        if (contentRef.current.trim()) {
          await handleSave(true) // Silent save
        }
      }, 60000) // 60 seconds
    }

    startAutoSave()

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [status])

  const handleSave = async (silent = false) => {
    if (status === 'submitted') {
      setError('Cannot edit a submitted review')
      return
    }

    try {
      if (!silent) setSaving(true)
      setError(null)

      const response = await reviewService.saveReview({
        reviewCycleId,
        revieweeId,
        reviewType,
        content: content.trim()
      })

      setReviewId(response.review.reviewId)
      setLastSaved(response.review.updatedAt)

      if (!silent) {
        // Show brief success message
        const successMsg = document.getElementById('save-success')
        if (successMsg) {
          successMsg.classList.remove('hidden')
          setTimeout(() => successMsg.classList.add('hidden'), 2000)
        }
      }
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to save review')
      }
    } finally {
      if (!silent) setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter review content before submitting')
      return
    }

    if (!reviewId) {
      setError('Please save the review first')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await reviewService.submitReview(reviewId)
      setStatus('submitted')

      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const getReviewTypeLabel = () => {
    switch (reviewType) {
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

  const getInstructions = () => {
    switch (reviewType) {
      case 'self':
        return 'Reflect on your accomplishments, challenges, and growth during this review period. Consider your strengths and areas for development.'
      case 'peer_360':
        return `Provide constructive feedback on ${revieweeName}'s performance, collaboration, and impact. Focus on specific examples and actionable insights.`
      case 'manager':
        return `Provide a comprehensive evaluation of ${revieweeName}'s performance, including achievements, areas for improvement, and development recommendations.`
      default:
        return 'Please provide your feedback below.'
    }
  }

  const charCount = content.length
  const charLimit = 10000
  const charRemaining = charLimit - charCount

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{getReviewTypeLabel()}</h2>
        {reviewType !== 'self' && (
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{revieweeName}</p>
            <p>{revieweeJobTitle}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div id="save-success" className="hidden mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
        Draft saved successfully
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">{getInstructions()}</p>
      </div>

      {status === 'submitted' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Review Submitted</span>
          </div>
          <p className="mt-1 text-sm">This review has been submitted and can no longer be edited.</p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={status === 'submitted'}
          className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter your review here..."
          maxLength={charLimit}
        />
        <div className="mt-2 flex justify-between items-center text-sm">
          <span className={`${charRemaining < 500 ? 'text-orange-600' : 'text-gray-500'}`}>
            {charRemaining.toLocaleString()} characters remaining
          </span>
          {lastSaved && (
            <span className="text-gray-500">
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {status !== 'submitted' && (
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !content.trim()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !reviewId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewForm
