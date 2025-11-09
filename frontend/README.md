# Performance Review Frontend

React frontend application for the Performance Review Management System.

## Technology Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: Zustand (lightweight) + React Context
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns
- **Testing**: Vitest + React Testing Library

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── contexts/        # React contexts
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update:
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Lint code with ESLint
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI

## Features

### Authentication
- Login/logout functionality
- JWT token-based authentication
- Protected routes (require login)
- Admin-only routes
- Session persistence

### Pages

#### Public Pages
- `/login` - Login page

#### Employee Pages (Protected)
- `/` - Dashboard
- `/my-reviews` - View and complete own reviews
- `/team-reviews` - View team members' reviews (managers)

#### Admin Pages (Protected, Admin Only)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/org-chart` - Organization chart editor
- `/admin/review-cycles` - Review cycle management

### Components

- `PrivateRoute` - Protects routes requiring authentication
- `AdminRoute` - Protects routes requiring admin privileges

### Services

- `api.js` - Axios instance with interceptors
  - Automatically adds JWT token to requests
  - Handles 401 errors (redirects to login)
  - Formats error messages
- `authService.js` - Authentication API calls

### Context

- `AuthContext` - Manages authentication state
  - Current user
  - Login/logout functions
  - Loading state
  - isAuthenticated flag
  - isAdmin flag

## Development Guidelines

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Use `<PrivateRoute>` or `<AdminRoute>` if authentication is required

Example:
```jsx
<Route
  path="/new-page"
  element={<PrivateRoute><NewPage /></PrivateRoute>}
/>
```

### Making API Calls

Use the api service from `src/services/api.js`:

```javascript
import api from '../services/api'

const fetchData = async () => {
  try {
    const response = await api.get('/endpoint')
    return response.data
  } catch (error) {
    console.error(error.message)
    throw error
  }
}
```

### Styling

This project uses Tailwind CSS for styling. Use utility classes:

```jsx
<div className="bg-white rounded-lg shadow p-6">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <p className="text-gray-600 mt-2">Description</p>
</div>
```

### Date/Time Handling

Use date-fns for date manipulation and formatting:

```javascript
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

// Format date in user's timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const formatted = formatInTimeZone(
  utcDate,
  userTimezone,
  'MMM dd, yyyy at h:mm a (zzz)'
)
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## Testing

Tests are written using Vitest and React Testing Library.

```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
```

Test files should be placed next to the components they test with `.test.jsx` extension.

Example:
```
src/
  components/
    Button.jsx
    Button.test.jsx
```

## Environment Variables

Environment variables must be prefixed with `VITE_` to be exposed to the client:

- `VITE_API_URL` - Backend API base URL

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

## License

MIT
