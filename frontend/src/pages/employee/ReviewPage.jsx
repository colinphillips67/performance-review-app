import { useParams, useLocation, useNavigate } from 'react-router-dom'
import ReviewForm from '../../components/reviews/ReviewForm'

const ReviewPage = () => {
  const { reviewId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const {
    reviewCycleId,
    revieweeId,
    revieweeName,
    revieweeJobTitle,
    reviewType,
    existingReview
  } = location.state || {}

  const handleSubmitSuccess = () => {
    // Navigate back to My Reviews page after successful submission
    navigate('/my-reviews', {
      state: { message: 'Review submitted successfully!' }
    })
  }

  const handleCancel = () => {
    navigate('/my-reviews')
  }

  // If no state data, redirect to my reviews
  if (!reviewCycleId || !revieweeId || !reviewType) {
    navigate('/my-reviews')
    return null
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ReviewForm
        reviewCycleId={reviewCycleId}
        revieweeId={revieweeId}
        revieweeName={revieweeName}
        revieweeJobTitle={revieweeJobTitle}
        reviewType={reviewType}
        existingReview={existingReview}
        onSubmitSuccess={handleSubmitSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default ReviewPage
