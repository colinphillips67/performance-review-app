# Performance Review Management System - V1 Requirements Document

## 1. PROJECT OVERVIEW

### 1.1 Purpose
A web-based application to manage performance review processes including self-evaluations, 360-degree feedback, and manager evaluations. This V1 focuses on core functionality with simplified workflows.

### 1.2 Target Users
- **Employees**: Submit self-evaluations, complete 360 reviews for peers, view their own review history
- **Managers**: Review direct reports, access reviews of subordinates based on org chart position
- **Administrators**: Configure review cycles, manage users, set up org charts, monitor completion status

### 1.3 Core Functionality
1. Configure and launch review cycles with simple workflows
2. Collect free-form self-evaluations, 360 feedback, and manager evaluations
3. Manage organizational hierarchies (simple tree structure) and user permissions
4. Track review completion and send automated reminders
5. Provide controlled access to review content based on roles and permissions

### 1.4 V1 Simplifications
- **Org chart**: Simple tree structure (each employee has ONE manager only)
- **360 reviews**: Always non-anonymous (managers always see reviewer identities)
- **Review format**: Free-form text only (no structured questions)
- **Data import/export**: Manual entry only (no CSV import, PDF export only)
- **Review cycles**: One active cycle at a time

---

## 2. USER ROLES AND PERMISSIONS

### 2.1 Role Types

**Administrator**
- Configure review cycles and workflows
- Set up and manage organizational chart
- Add/remove users manually
- Configure system settings (2FA requirements, reminder schedules)
- Track completion status across all reviews
- Cannot view review content unless they also have employee role with appropriate permissions
- Can revert submitted reviews back to draft status
- Can substitute managers in the org chart

**Employee**
- Submit self-evaluations
- Complete assigned 360 reviews
- View own self-evaluations (current and historical)
- View manager reviews that have been released to them
- View status of their current review
- Act as manager for direct reports (if positioned in org chart)
- View reviews of direct reports and all subordinates based on org chart position

### 2.2 Permission Logic
- Employees can be reviewed, review others (360), and manage others based on org chart
- Manager permissions are derived from org chart position:
  - Can view all reviews (self, 360, manager) of direct reports
  - Can view all reviews of entire reporting chain below them
- Review visibility is backward-looking (historical access to completed reviews)

---

## 3. ORGANIZATIONAL STRUCTURE

### 3.1 Org Chart Characteristics (V1 Simplified)
- **Structure**: Simple tree with single root node
- **Each employee has exactly ONE manager** (except the root/CEO)
- Depth is unlimited (hierarchy levels)
- Org chart is frozen for the duration of each review cycle
- Changes to org chart do not affect in-progress review cycles

### 3.2 Org Chart Management
- Admins create and modify org chart structure manually
- Visual tree representation showing reporting relationships
- Ability to substitute managers if manager leaves during review cycle (rest of org chart remains static)
- Org chart defines manager-employee relationships for review access permissions
- Validation ensures no cycles and exactly one root node

---

## 4. USER MANAGEMENT

### 4.1 User Attributes
Required fields:
- First Name
- Last Name
- Email Address (serves as username, must be unique)
- Job Title

### 4.2 User Onboarding
- Individual user creation by admin (manual entry only in V1)
- Email invitation sent upon user creation
- Users set their own password on first login

### 4.3 Authentication & Security
- Email address / password authentication
- Password reset functionality via email
- Two-Factor Authentication (2FA):
  - Admin can enforce 2FA at organization level
  - Users can opt out if not enforced
  - 2FA methods: authenticator app (TOTP) only
- No SSO integration required
- Account lockout after 5 failed login attempts (15 minute cooldown)
- Session timeout after 2 hours of inactivity

---

## 5. REVIEW CYCLE CONFIGURATION

### 5.1 Review Cycle Constraints
- Only one review cycle active at a time
- Each cycle is configured independently
- Org chart snapshot is taken and frozen for cycle duration

### 5.2 Configurable Parameters

**Timing & Deadlines**
- Review cycle name
- Review cycle start date
- Review cycle end date
- Deadlines for each phase (self-eval, 360s, manager review)
- All dates/times stored in UTC, displayed in user's browser timezone

**Workflow (V1 Simplified)**
Fixed workflow: Self-Evaluation → 360 Reviews → Manager Review
- Phases are sequential
- Next phase begins after deadline of previous phase

**Review Structure (V1 Simplified)**
- All reviews are free-form text entry
- Single text area for each review type
- Character limit: 10,000 characters per review

**360 Review Configuration**
- Number of 360 reviewers required (min/max range: 0-10)
- Selection method:
  - Manager selects reviewers
  - Employee selects reviewers
- Reviewers are always non-anonymous (managers see reviewer identities)

**Participant Selection**
- Select which employees are included in review cycle
- Manual selection (checkboxes)
- Select all / deselect all option

---

## 6. REVIEW WORKFLOW

### 6.1 Review Process Phases

**Phase 1: Self-Evaluation**
- Employee receives email notification with deadline
- Completes self-evaluation in free-form text area (max 10,000 characters)
- Can save as draft and return later
- Submits when complete
- Cannot edit after submission (admin can revert to draft if needed)

**Phase 2: 360 Feedback**
- 360 reviewers receive email notification with:
  - Name of employee being reviewed
  - Review deadline
  - Link to review form
- Complete 360 evaluation in free-form text (max 10,000 characters)
- Can save as draft and return later
- Submit when complete
- If not submitted by deadline, marked as "not submitted"
- Cannot decline assigned 360 reviews
- Manager can see reviewer identities (non-anonymous)

**Phase 3: Manager Evaluation**
- Manager receives notification when prior phases complete (or by deadline)
- Manager views:
  - Employee's self-evaluation
  - All completed 360 reviews with reviewer names
- Completes manager evaluation in free-form text (max 10,000 characters)
- Can save as draft and return later
- Submits when complete

**Phase 4: Review Completion**
- When manager submits final review:
  - Employee notified that review is complete
  - Manager and manager's manager (one level up) notified
  - Employee has no automatic access to review content
- Manager can choose to release their evaluation to employee
- 360 reviews are never visible to reviewed employee

### 6.2 Review States
- Not Started
- In Progress (Draft)
- Submitted
- Complete (all phases done)
- Overdue
- Not Submitted (deadline passed)

---

## 7. NOTIFICATIONS & REMINDERS

### 7.1 Email Notifications

**Trigger Events**
- Review cycle launch (to all participants)
- Review assignment (self, 360, manager)
- Review submission confirmation
- Review completion (to employee, manager, manager's manager)
- Manager review released to employee

**Notification Content**
- Clear subject line indicating action required
- Employee name (for 360 reviews: who is being reviewed)
- Type of review to complete
- Deadline date and time (displayed in UTC in emails, but shown in user's local timezone when viewing in web app)
- Direct link to review form
- Instructions

### 7.2 Automated Reminders
- Exponential schedule: more frequent as deadline approaches
- For 2-week deadline:
  - Day 7: First reminder
  - Day 11: Second reminder
  - Day 13: Third reminder
  - Day 14 (morning): Final reminder
- Only sent for incomplete reviews
- Reminders stop after deadline passes

---

## 8. VISIBILITY & ACCESS CONTROL

### 8.1 Review Content Visibility

**Self-Evaluations**
- Employee: Can view their own (current and historical)
- Manager: Can view for all direct reports and subordinates
- Admin: No access unless also an employee with permissions

**360 Reviews**
- Reviewed Employee: Never visible
- Manager: Visible for direct reports with reviewer names shown
- 360 Reviewer: Can view only their own submitted reviews
- Admin: No access unless also an employee with permissions

**Manager Reviews**
- Reviewed Employee: Visible only if manager releases it
- Manager: Can view for all direct reports and subordinates
- Manager's Manager: Can view for all subordinates
- Admin: No access unless also an employee with permissions

### 8.2 Status Visibility

**Employees Can See**
- Status of their current review (which phases are complete)
- Their own self-evaluation content
- Manager review content (if released)
- Historical reviews (self and released manager reviews)
- List of who is providing 360 feedback for them (names visible)

**Managers Can See**
- All review content for direct reports
- All review content for entire reporting chain
- Completion status of subordinates' reviews
- 360 reviewer names

**Admins Can See**
- Completion status dashboard for all reviews
- Overdue and approaching deadline reports
- No review content (unless also employee with permissions)

---

## 9. ADMINISTRATIVE FEATURES

### 9.1 Dashboard & Monitoring
- Overview of current review cycle progress
- Completion rates by phase
- List of incomplete reviews
- List of overdue reviews
- Reviews approaching deadline (within 3 days)
- Filter and search capabilities

### 9.2 Review Management Actions
- Revert submitted review to draft status
- Send manual reminder to specific users
- Extend deadline for specific individuals
- Substitute manager in org chart
- Cancel review cycle (with confirmation)

### 9.3 Configuration Management
- Create/edit review cycles
- Configure reminder schedules
- Set 2FA requirements
- Configure system-wide settings

### 9.4 User Management
- Add individual users manually
- Deactivate users
- Reset user passwords
- View user login history

### 9.5 Org Chart Management
- Visual org chart editor (tree view)
- Add/remove reporting relationships
- Validate org chart structure (single root, no cycles, tree structure)
- Set root employee (CEO/top of organization)

---

## 10. DATA EXPORT & REPORTING

### 10.1 PDF Export
- Individual review export (includes all phases)
- Formatted for printing/archiving
- Includes:
  - Employee information
  - Review cycle dates
  - Self-evaluation
  - 360 reviews with reviewer names (if manager has access)
  - Manager evaluation
  - Timestamp and completion status

### 10.2 Reports (V1 Simplified)
- Completion status report (view only, no export in V1)
- Admin dashboard with real-time statistics

---

## 11. TECHNICAL SPECIFICATIONS

### 11.1 Platform
- Web application
- Responsive design for desktop, tablet, mobile browsers
- No native mobile app required
- Modern browser support (Chrome, Firefox, Safari, Edge - latest 2 versions)

### 11.2 Hosting & Infrastructure
- AWS hosting
- Database: PostgreSQL
- File storage: S3 (for PDF exports, backups)
- Email service: AWS SES
- Scalable architecture for growing organizations

### 11.3 Data Storage
- All review data stored indefinitely
- **All timestamps stored in UTC in database**
- **Timezone conversion handled in frontend (browser timezone)**
- Regular automated backups (daily)
- 30-day backup retention

### 11.4 Security
- HTTPS/TLS encryption (minimum TLS 1.2)
- Password hashing (bcrypt with cost factor 12)
- Password requirements:
  - Minimum 12 characters
  - At least one uppercase, one lowercase, one number, one special character
- 2FA support (TOTP)
- Session management with 2-hour timeout
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (Content Security Policy)
- CSRF protection (tokens)
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)

### 11.5 Performance
- Page load time < 2 seconds
- Support for 1000+ concurrent users
- Database connection pooling
- Efficient queries with proper indexing
- No caching in V1 (add in V2 if needed)

### 11.6 Data Limits
- Maximum employees: 5,000
- Maximum review text: 10,000 characters
- Maximum 360 reviewers per employee: 10
- Email subject line: 200 characters
- User name fields: 100 characters each
- Job title: 200 characters

---

## 12. USER INTERFACE REQUIREMENTS

### 12.1 Navigation Structure

**Admin Interface**
- Dashboard (default landing)
- Review Cycles (create, configure, monitor)
- Users (add, manage)
- Org Chart (view, edit)
- Settings (2FA, reminders)

**Employee Interface**
- My Reviews (current and historical)
- Pending Actions (reviews to complete)
- Team Reviews (if manager - view subordinate reviews)

### 12.2 Key Screens

**Login Page**
- Email and password fields
- Remember me option
- Forgot password link
- 2FA prompt (if enabled for user)

**Admin Dashboard**
- Current review cycle status widget
- Completion percentage (overall and by phase)
- Overdue reviews list (top 10)
- Upcoming deadlines list (within 3 days)
- Quick actions (send reminders, view all reviews)

**Review Cycle Configuration Page**
- Simple form (not wizard in V1)
- Review cycle name
- Start/end dates with date pickers
- Phase deadlines
- Participant selection (checkboxes)
- 360 configuration (min/max reviewers, selection method)
- Review and launch button

**Org Chart Editor**
- Visual tree representation
- Display: employee name, job title
- Add employee to org chart (dropdown selection)
- Set manager (dropdown selection)
- Remove from org chart button
- Tree navigation (expand/collapse nodes)
- Set root employee

**Review Form Pages**
- Clear instructions at top
- Employee being reviewed (name, title)
- Free-form text area (10,000 character limit with counter)
- Save draft button
- Submit button (with confirmation modal)
- Auto-save every 60 seconds

**Review View Pages**
- Tabbed interface (Self-Evaluation, 360 Reviews, Manager Review)
- Print/export to PDF button
- Release to employee button (manager review only, if not already released)
- Reviewer names shown on 360 reviews
- Timestamps for all submissions

**My Reviews Page (Employee)**
- Current review section:
  - Status of current review cycle
  - Pending reviews to complete (call-to-action buttons)
  - Current review status (phases completed)
- Historical reviews section:
  - List of past review cycles
  - Expandable/collapsible by cycle
  - View details button

**Team Reviews Page (Manager)**
- Tree view of direct reports
- Click to expand subordinates
- Review status indicators (color-coded: complete, in-progress, not-started, overdue)
- Click employee to view all their reviews
- Filter: show only direct reports / show all subordinates

### 12.3 Design Guidelines
- Clean, professional interface
- Consistent color scheme (define in V1: primary, secondary, success, warning, error)
- Clear typography (minimum 14px for body text)
- Responsive layout (mobile-first design)
- Accessible (WCAG 2.1 AA compliance)
- Loading indicators for async operations
- Error messages clear and actionable
- Success confirmations for important actions (toasts/modals)
- Confirmation modals for destructive actions

---

## 13. USER WORKFLOWS

### 13.1 Admin: Launch Review Cycle
1. Login as admin
2. Navigate to Review Cycles
3. Click "Create New Review Cycle"
4. Enter cycle name
5. Set start date, end date, and phase deadlines
6. Select participants (checkboxes)
7. Configure 360 settings (min/max reviewers, selection method)
8. Review configuration summary
9. Click "Launch Review Cycle"
10. System sends initial notifications to all participants

### 13.2 Employee: Complete Self-Evaluation
1. Receive email notification
2. Click link to login
3. Navigate to "My Reviews" or "Pending Actions"
4. Click "Complete Self-Evaluation" button
5. Read instructions
6. Type review in text area (auto-saves every 60 seconds)
7. Click "Save Draft" to save and return later (optional)
8. Review content
9. Click "Submit"
10. Confirm submission in modal
11. Receive confirmation email

### 13.3 Employee/Manager: Select 360 Reviewers
**If employee selects:**
1. Navigate to current review
2. See "Select 360 Reviewers" section
3. See list of all employees (excluding self)
4. Check boxes to select reviewers
5. Must select between min and max (configured by admin)
6. Click "Confirm Reviewers"
7. Selected reviewers are notified

**If manager selects:**
1. Navigate to team reviews
2. Click on direct report
3. See "Select 360 Reviewers" section
4. Select reviewers from employee list
5. Click "Confirm Reviewers"
6. Reviewers are notified

### 13.4 Employee: Complete 360 Review
1. Receive email notification (includes reviewee name)
2. Click link to login
3. Navigate to "Pending Actions"
4. Click on 360 review
5. See who they are reviewing (name, job title)
6. Complete evaluation in text area
7. Save draft (optional)
8. Submit review
9. Receive confirmation

### 13.5 Manager: Complete Manager Review
1. Receive notification that prior phases are complete
2. Login and navigate to review
3. View tabs: Self-Evaluation, 360 Reviews, Manager Review
4. Read employee's self-evaluation
5. Read all 360 reviews (with reviewer names shown)
6. Navigate to "Manager Review" tab
7. Complete manager evaluation in text area
8. Submit review
9. Modal: "Would you like to release this review to the employee?" (Yes/No)
10. Employee, manager, and manager's manager notified of completion

### 13.6 Admin: Monitor Progress
1. Login as admin
2. View dashboard
3. See completion statistics (overall percentage, by phase)
4. View overdue reviews list
5. View approaching deadlines list
6. Click on specific review for details
7. Send manual reminder if needed
8. Extend deadline for individual if needed

### 13.7 Employee: View Historical Review
1. Login as employee
2. Navigate to "My Reviews"
3. Scroll to "Historical Reviews" section
4. Click on review cycle to expand
5. View self-evaluation
6. View manager review (if released)
7. Click "Export to PDF" (optional)

### 13.8 Manager: View Team Reviews
1. Login as manager
2. Navigate to "Team Reviews"
3. See tree view of direct reports
4. Expand to see subordinates
5. Click on employee name
6. View all reviews (self, 360, manager) in tabbed interface
7. Export to PDF (optional)

---

## 14. EDGE CASES & ERROR HANDLING

### 14.1 Employee Leaves Mid-Review
- Review process continues as configured
- Incomplete reviews remain incomplete
- Deadlines pass normally
- Reviews marked as "not submitted" after deadline
- Historical data retained
- Can deactivate user account (admin action)

### 14.2 Manager Leaves Mid-Review
- Admin substitutes new manager in org chart for that review cycle
- New manager gains access to all reviews in progress for those direct reports
- Previous manager loses access (if account deactivated)
- Notifications redirected to new manager
- Pending manager reviews reassigned to new manager

### 14.3 360 Reviewer Doesn't Know Reviewee
- Reviewer completes review as assigned
- Can note lack of working relationship in review content
- Review counted as submitted
- No mechanism to decline in V1

### 14.4 Missed Deadlines
- Reviews marked as "not submitted"
- Included in overdue reports
- Admin can extend deadline for individual or proceed without
- Reminder emails stop after deadline passes
- Phase proceeds to next phase on deadline regardless of completion

### 14.5 User Cannot Access System
- Password reset via email (forgot password link)
- Admin can manually reset password
- Check 2FA issues (admin can disable 2FA for user)
- Account lockout after 5 failed attempts (auto-unlock after 15 minutes)

### 14.6 Duplicate Email Addresses
- System prevents duplicate email registration
- Error message on user creation
- Must use unique email address

### 14.7 Invalid Org Chart
- Validation prevents:
  - Multiple root nodes
  - Cycles (impossible in tree structure, but validate anyway)
  - Employee being their own manager
- Error message if validation fails
- Must resolve before saving org chart

### 14.8 Review Accidentally Submitted
- Admin can revert to draft
- User notified of revert via email
- User can edit and resubmit
- Action logged in audit log

### 14.9 Review Cycle End Date Passes
- No automatic cycle closure
- Admins can still view all data
- Employees can still access historical reviews
- Admin can manually close cycle (updates status to "Completed")

### 14.10 User Has No Manager in Org Chart
- User can participate as employee (complete self-eval, 360s)
- No one can complete manager review for them
- Manager review phase shows "N/A - No Manager Assigned"
- Review cycle can still complete for that user

---

## 15. DATA MODEL OVERVIEW

### 15.1 Core Entities

**User**
- user_id (PK, UUID)
- email (unique, indexed)
- first_name
- last_name
- job_title
- password_hash
- is_admin (boolean, default false)
- is_active (boolean, default true)
- 2fa_enabled (boolean, default false)
- 2fa_secret (encrypted, nullable)
- created_at (timestamp, UTC)
- updated_at (timestamp, UTC)
- last_login (timestamp, UTC, nullable)

**OrgChart**
- org_chart_id (PK, UUID)
- version (integer, for historical tracking)
- root_employee_id (FK to User)
- created_at (timestamp, UTC)
- is_active (boolean)

**OrgChartRelationship**
- relationship_id (PK, UUID)
- org_chart_id (FK to OrgChart)
- employee_id (FK to User)
- manager_id (FK to User)
- Unique constraint: (org_chart_id, employee_id) - each employee appears once per org chart
- Index on: org_chart_id, employee_id, manager_id

**ReviewCycle**
- review_cycle_id (PK, UUID)
- name (varchar 200)
- org_chart_id (FK to OrgChart - frozen snapshot)
- start_date (timestamp, UTC)
- end_date (timestamp, UTC)
- self_eval_deadline (timestamp, UTC)
- peer_360_deadline (timestamp, UTC)
- manager_eval_deadline (timestamp, UTC)
- min_360_reviewers (integer, 0-10)
- max_360_reviewers (integer, 0-10)
- reviewer_selection_method (enum: 'manager_selects', 'employee_selects')
- status (enum: 'planning', 'active', 'completed')
- created_by (FK to User)
- created_at (timestamp, UTC)
- updated_at (timestamp, UTC)

**ReviewCycleParticipant**
- participant_id (PK, UUID)
- review_cycle_id (FK to ReviewCycle)
- employee_id (FK to User)
- manager_id (FK to User, nullable - if no manager in org chart)
- self_eval_status (enum: 'not_started', 'draft', 'submitted', 'overdue')
- peer_360_status (enum: 'not_started', 'in_progress', 'complete', 'overdue')
- manager_eval_status (enum: 'not_started', 'draft', 'submitted', 'overdue', 'n/a')
- created_at (timestamp, UTC)
- updated_at (timestamp, UTC)
- Unique constraint: (review_cycle_id, employee_id)
- Index on: review_cycle_id, employee_id, manager_id

**Review**
- review_id (PK, UUID)
- review_cycle_id (FK to ReviewCycle)
- reviewer_id (FK to User - person writing the review)
- reviewee_id (FK to User - person being reviewed)
- review_type (enum: 'self', 'peer_360', 'manager')
- content (text, max 10,000 characters)
- status (enum: 'draft', 'submitted')
- submitted_at (timestamp, UTC, nullable)
- is_released_to_employee (boolean, default false - for manager reviews only)
- released_at (timestamp, UTC, nullable)
- created_at (timestamp, UTC)
- updated_at (timestamp, UTC)
- Index on: review_cycle_id, reviewee_id, reviewer_id, review_type

**Peer360Assignment**
- assignment_id (PK, UUID)
- review_cycle_id (FK to ReviewCycle)
- reviewee_id (FK to User - person being reviewed)
- reviewer_id (FK to User - person doing the reviewing)
- assigned_by (FK to User - manager or employee who selected reviewer)
- review_id (FK to Review, nullable - populated when review is created)
- status (enum: 'assigned', 'in_progress', 'submitted', 'not_submitted')
- created_at (timestamp, UTC)
- Unique constraint: (review_cycle_id, reviewee_id, reviewer_id)
- Index on: review_cycle_id, reviewer_id, reviewee_id

**Notification**
- notification_id (PK, UUID)
- user_id (FK to User)
- notification_type (enum: 'review_assigned', 'review_submitted', 'review_complete', 'reminder', 'review_released')
- subject (varchar 200)
- body (text)
- sent_at (timestamp, UTC)
- review_cycle_id (FK to ReviewCycle, nullable)
- review_id (FK to Review, nullable)
- Index on: user_id, sent_at

**AuditLog**
- log_id (PK, UUID)
- user_id (FK to User, nullable - for system actions)
- action (varchar 100, e.g., 'review_submitted', 'review_reverted', 'user_created')
- entity_type (varchar 50, e.g., 'Review', 'User', 'ReviewCycle')
- entity_id (UUID)
- details (JSONB - flexible additional data)
- ip_address (varchar 45 - IPv6 support)
- timestamp (timestamp, UTC)
- Index on: user_id, entity_type, entity_id, timestamp

**Session**
- session_id (PK, UUID)
- user_id (FK to User)
- token (varchar 255, hashed, indexed)
- created_at (timestamp, UTC)
- expires_at (timestamp, UTC)
- last_activity (timestamp, UTC)
- ip_address (varchar 45)
- user_agent (text)
- Index on: token, user_id, expires_at

### 15.2 Key Relationships
- User → OrgChartRelationship (one employee to one manager per org chart)
- OrgChart → OrgChartRelationship (one-to-many)
- ReviewCycle → OrgChart (frozen snapshot, many-to-one)
- ReviewCycle → ReviewCycleParticipant (one-to-many)
- ReviewCycleParticipant → Review (one-to-many)
- Review.reviewee_id → User (many-to-one)
- Review.reviewer_id → User (many-to-one)
- Peer360Assignment → Review (one-to-one, nullable)

### 15.3 Database Indexes
- All foreign keys indexed
- User.email (unique index)
- Review compound index: (review_cycle_id, reviewee_id, review_type)
- Session.token (unique index)
- Session.expires_at (for cleanup queries)
- AuditLog.timestamp (for historical queries)

---

## 16. API ENDPOINTS

### 16.1 Authentication
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/verify-2fa
- POST /api/auth/setup-2fa
- POST /api/auth/disable-2fa
- GET /api/auth/session (check if session is valid)

### 16.2 User Management (Admin only)
- GET /api/users (list all users, paginated)
- POST /api/users (create new user)
- GET /api/users/:id
- PUT /api/users/:id (update user)
- DELETE /api/users/:id (soft delete - set is_active = false)
- POST /api/users/:id/reset-password (admin reset)
- GET /api/users/:id/login-history

### 16.3 Org Chart (Admin only for write, employees can read their chain)
- GET /api/org-chart (get active org chart)
- GET /api/org-chart/:id (get specific version)
- POST /api/org-chart (create new version)
- PUT /api/org-chart/:id (update relationships)
- POST /api/org-chart/relationships (add employee-manager relationship)
- DELETE /api/org-chart/relationships/:id (remove relationship)
- GET /api/org-chart/validate (validate structure)
- GET /api/org-chart/tree (get tree structure for visualization)
- GET /api/org-chart/my-chain (get current user's reporting chain)

### 16.4 Review Cycles (Admin only)
- GET /api/review-cycles (list all cycles)
- POST /api/review-cycles (create new cycle)
- GET /api/review-cycles/:id
- PUT /api/review-cycles/:id (update cycle - only if status is 'planning')
- POST /api/review-cycles/:id/launch (change status to 'active', send notifications)
- POST /api/review-cycles/:id/cancel (cancel cycle with confirmation)
- GET /api/review-cycles/:id/status (completion statistics)
- GET /api/review-cycles/:id/participants (list all participants with status)
- POST /api/review-cycles/:id/participants (add participants)
- GET /api/review-cycles/active (get current active cycle)

### 16.5 Reviews (Employees and Managers)
- GET /api/reviews/my-reviews (current user's reviews)
- GET /api/reviews/pending (reviews assigned to current user)
- GET /api/reviews/:id
- POST /api/reviews (create new review)
- PUT /api/reviews/:id (update draft review)
- POST /api/reviews/:id/submit (submit review, change status to 'submitted')
- POST /api/reviews/:id/revert (admin only - revert to draft)
- POST /api/reviews/:id/release (manager only - release manager review to employee)
- GET /api/reviews/:id/export-pdf (generate PDF export)

### 16.6 360 Reviewer Selection
- GET /api/review-cycles/:id/360-reviewers/:employee_id (get assigned reviewers for employee)
- POST /api/review-cycles/:id/360-reviewers/:employee_id (assign reviewers)
- GET /api/review-cycles/:id/eligible-360-reviewers/:employee_id (list of all users except employee)

### 16.7 Team Reviews (Managers only)
- GET /api/team-reviews (all subordinates)
- GET /api/team-reviews/direct-reports (direct reports only)
- GET /api/team-reviews/:employee_id (all reviews for specific employee)
- GET /api/team-reviews/:employee_id/cycle/:cycle_id (specific review cycle for employee)

### 16.8 Admin Dashboard
- GET /api/admin/dashboard (overview statistics)
- GET /api/admin/overdue-reviews (list of overdue reviews)
- GET /api/admin/upcoming-deadlines (reviews with deadlines within 3 days)
- POST /api/admin/send-reminder (send manual reminder)
- POST /api/admin/extend-deadline (extend deadline for specific user/review)

### 16.9 Notifications
- GET /api/notifications/my-notifications (current user's notification history)
- POST /api/notifications/send (system internal, not exposed to users)

### 16.10 System
- GET /api/system/health (health check)
- GET /api/system/settings (get system settings)
- PUT /api/system/settings (admin only - update system settings)

---

## 17. OUT OF SCOPE FOR V1

The following features are explicitly excluded from V1 and reserved for future versions:

### 17.1 Excluded Features
- CSV import/export for users or org charts
- Structured questions/questionnaires (free-form text only)
- Question library
- Review templates (only one workflow in V1)
- Anonymous 360 reviews (always non-anonymous)
- Multiple managers per employee (simple tree only)
- Concurrent review cycles
- Goal setting and tracking
- Performance ratings/scores
- Development plans
- Advanced analytics and reporting
- Integration with external systems (HR, calendar, Slack)
- Document attachments
- Competency frameworks
- Multi-language support
- Bulk operations (beyond select all)
- Custom email templates (use hardcoded templates)
- Advanced notification preferences
- Comments or discussion threads on reviews
- Review comparison across cycles
- Data export beyond PDF

### 17.2 Future Enhancements (Post-V1)
- Phase 2: Structured questions, question library, CSV import/export
- Phase 3: Review templates, multiple concurrent cycles, advanced analytics
- Phase 4: Integrations, competency frameworks, goal tracking

---

## 18. SUCCESS CRITERIA

### 18.1 Functional Success
- Admin can configure and launch review cycle in < 20 minutes
- Employees can complete a review without training or support
- 90%+ review completion rate (submitted by deadline)
- Zero data loss or corruption
- All user roles have appropriate access permissions (verified by permission testing)

### 18.2 Usability Success
- Users can complete a review without instructions (intuitive UI)
- < 10% of users require support assistance
- Average review completion time < 30 minutes

### 18.3 Technical Success
- 99% uptime during review periods
- Page load times < 2 seconds
- No critical security vulnerabilities
- Successful automated backups daily
- Zero SQL injection, XSS, or CSRF vulnerabilities

### 18.4 Business Success
- Reduces time spent administering reviews by 50% compared to manual process
- Provides complete audit trail of all review activity
- Managers can access all subordinate reviews in < 5 clicks

---

## 19. ASSUMPTIONS & CONSTRAINTS

### 19.1 Assumptions
- Users have reliable internet access
- Users have valid email addresses
- Organizations have < 5,000 employees
- Review cycles are annual or semi-annual (not more frequent than quarterly)
- English language only
- All users are in a single organizational hierarchy (one tree)

### 19.2 Constraints
- No native mobile app
- No SSO integration
- No offline access
- Single review cycle active at a time
- No real-time collaboration features
- Manual user entry only (no CSV import)
- Free-form text only (no structured questions)
- Simple tree org structure (single manager per employee)

### 19.3 Dependencies
- AWS account with permissions for EC2, RDS, S3, SES
- Domain name
- SSL certificate (can use AWS Certificate Manager)
- SMTP credentials for AWS SES
- PostgreSQL 14+
- Node.js (backend) - recommended version 18+
- React (frontend) - recommended version 18+

---

## 20. IMPLEMENTATION PLAN

### 20.1 Technology Stack (Recommended)

**Backend:**
- Node.js with Express
- PostgreSQL 14+
- Prisma ORM (or similar)
- JWT for session management
- bcrypt for password hashing
- speakeasy for TOTP (2FA)
- nodemailer with AWS SES for email
- PDFKit for PDF generation

**Frontend:**
- React 18+
- React Router for navigation
- Axios for API calls
- TailwindCSS or Material-UI for styling
- React Hook Form for form management
- date-fns for date/time handling (timezone conversion)
- Chart.js or Recharts for admin dashboard

**Infrastructure:**
- AWS EC2 or ECS for hosting
- AWS RDS for PostgreSQL
- AWS S3 for file storage
- AWS SES for email
- CloudFront for CDN (optional)
- Route 53 for DNS

### 20.2 Development Phases

**Phase 1: Foundation (Weeks 1-3)**
- Database schema setup
- Authentication system (login, logout, password reset)
- User management (admin CRUD operations)
- Basic admin dashboard
- Session management

**Phase 2: Org Chart (Weeks 4-5)**
- Org chart data model
- Org chart creation and editing
- Tree visualization component
- Org chart validation
- Manager substitution

**Phase 3: Review Cycles (Weeks 6-8)**
- Review cycle configuration
- Participant selection
- 360 reviewer selection (manager and employee flows)
- Review cycle status tracking
- Launch review cycle functionality

**Phase 4: Review Workflow (Weeks 9-12)**
- Self-evaluation form
- 360 review form
- Manager review form
- Draft/submit functionality
- Auto-save
- Review state management
- Phase progression logic

**Phase 5: Notifications (Weeks 13-14)**
- Email notification system
- Notification templates
- Automated reminders
- Manual reminder functionality

**Phase 6: Viewing & Access Control (Weeks 15-16)**
- Review viewing (employees, managers)
- Permission enforcement
- Historical review access
- Team reviews page (manager)
- PDF export

**Phase 7: Admin Features (Week 17)**
- Completion tracking
- Overdue reports
- Extend deadlines
- Revert reviews
- Cancel cycle

**Phase 8: Testing & Polish (Weeks 18-20)**
- Security audit
- Performance testing
- User acceptance testing
- Bug fixes
- UI polish
- Documentation

**Phase 9: Deployment (Week 21)**
- AWS infrastructure setup
- Database migration
- Environment configuration
- SSL setup
- SES configuration
- Production deployment
- Smoke testing

### 20.3 Estimated Timeline
- Total development: 21 weeks (approximately 5 months)
- Team size: 2-3 full-stack developers
- Assumes dedicated resources

---

## 21. SECURITY CONSIDERATIONS

### 21.1 Authentication & Authorization
- All passwords hashed with bcrypt (cost factor 12)
- Session tokens stored securely (httpOnly, secure, sameSite cookies)
- CSRF tokens for all state-changing operations
- Rate limiting on authentication endpoints (5 attempts per 15 minutes per IP)
- Account lockout after 5 failed login attempts (15-minute cooldown)
- 2FA support via TOTP

### 21.2 Data Protection
- All data in transit encrypted (TLS 1.2+)
- All sensitive data at rest encrypted (AWS RDS encryption)
- Database credentials stored in environment variables (never in code)
- S3 buckets private with signed URLs for PDF downloads
- 2FA secrets encrypted in database

### 21.3 Input Validation
- Server-side validation on all inputs
- Maximum length enforcement (10,000 characters for reviews)
- Email validation (format and uniqueness)
- SQL injection prevention (parameterized queries via ORM)
- XSS prevention (Content Security Policy, input sanitization, output encoding)

### 21.4 Access Control
- Role-based access control (admin vs employee)
- Row-level security for reviews (users can only access reviews they have permission to see)
- Manager access validated against org chart snapshot
- API endpoints check permissions before returning data
- Admin actions logged in audit log

### 21.5 Audit & Logging
- All authentication events logged
- All admin actions logged (user creation, review revert, etc.)
- All review submissions logged
- IP address and timestamp captured
- Logs retained for 1 year

### 21.6 Privacy & Compliance
- Data retention policy defined (indefinite in V1, configurable later)
- User email addresses not shared externally
- Review content only accessible to authorized users
- No analytics or tracking scripts (privacy-first)
- GDPR considerations (right to access, right to deletion - admin manual process in V1)

---

## 22. TIMEZONE HANDLING

### 22.1 Storage
- **All timestamps stored in UTC in the database**
- No timezone information stored in database (UTC only)
- Database column type: `timestamp without time zone` (assumes UTC)

### 22.2 Display
- **All dates/times displayed to users are in their local timezone**
- Frontend automatically detects user's browser timezone
- All timestamps converted from UTC to user's local timezone before display
- Display format: "MMM DD, YYYY at HH:mm AM/PM (Timezone)"
  - Example: "Mar 15, 2024 at 5:00 PM (PST)"
  - Example: "Mar 15, 2024 at 8:00 PM (EST)" (same moment, different timezone)
- Use date-fns `formatInTimeZone()` or similar library for conversion
- Never show UTC times to end users (except in admin logs if needed)

### 22.3 Input
- Date pickers store selected date/time in UTC
- When user selects "March 15, 2024 at 5:00 PM" in their local timezone:
  - Frontend converts to UTC before sending to backend
  - Backend stores UTC value
- API accepts ISO 8601 format with timezone: `2024-03-15T17:00:00-08:00`
- Backend converts to UTC: `2024-03-16T01:00:00Z`

### 22.4 Deadlines & Reminders
- Deadline times stored in UTC
- Reminder jobs run on UTC schedule
- Email notifications: Since we cannot detect recipient timezone in email, display deadline in multiple major timezones OR in UTC with clear labeling
  - **V1 Decision**: Display in UTC with clear labeling "All times shown in UTC"
  - **Future enhancement**: Store user timezone preference and personalize emails
- When user clicks email link and views in web app, times are shown in their local timezone

### 22.5 Implementation Notes
- Backend: Use `new Date()` and store as UTC
- Frontend: Use `toLocaleString()` or date-fns `formatInTimeZone()`
- Never use local time on server
- All cron jobs and scheduled tasks use UTC

---

## 23. ERROR MESSAGES & USER FEEDBACK

### 23.1 Form Validation Errors
- Display inline with form field
- Red text with error icon
- Specific messages:
  - "Email address is required"
  - "Email address is already in use"
  - "Password must be at least 12 characters"
  - "Review text cannot exceed 10,000 characters (currently: 10,523)"

### 23.2 API Errors
- HTTP status codes:
  - 400: Bad request (validation error)
  - 401: Unauthorized (not logged in)
  - 403: Forbidden (insufficient permissions)
  - 404: Not found
  - 409: Conflict (e.g., duplicate email)
  - 500: Internal server error
- Error response format (JSON):
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email address is already in use",
    "field": "email"
  }
}
```

### 23.3 Success Messages
- Toast notifications (top-right corner, auto-dismiss after 5 seconds)
- Green background with checkmark icon
- Examples:
  - "Review saved as draft"
  - "Review submitted successfully"
  - "User created successfully"
  - "Review cycle launched"

### 23.4 Confirmation Modals
- For destructive or important actions:
  - Submit review
  - Delete user
  - Cancel review cycle
  - Revert review to draft
- Modal content:
  - Clear title: "Confirm Submission"
  - Description: "Are you sure you want to submit this review? You will not be able to edit it after submission."
  - Buttons: "Cancel" (secondary) and "Confirm" (primary, color-coded)

### 23.5 Loading States
- Button loading state: Spinner replaces button text, button disabled
- Page loading: Full-page spinner with message "Loading..."
- Skeleton screens for dashboard cards and lists
- Auto-save indicator: "Saving..." → "Saved at HH:mm AM/PM"

---

## 24. ACCESSIBILITY REQUIREMENTS

### 24.1 WCAG 2.1 AA Compliance
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- All interactive elements keyboard accessible (tab navigation)
- Focus indicators visible on all interactive elements
- Skip to main content link
- Semantic HTML elements (nav, main, section, article)

### 24.2 Screen Reader Support
- All images have alt text
- Form inputs have associated labels
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content (toasts, auto-save status)
- Proper heading hierarchy (h1 → h2 → h3, no skipping)

### 24.3 Keyboard Navigation
- Tab order follows visual order
- Escape key closes modals
- Enter key submits forms
- Arrow keys navigate tree (org chart)
- Focus trap in modals

### 24.4 Responsive Design
- Mobile-first approach
- Breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop)
- Touch targets minimum 44x44px
- Text readable without zooming (minimum 14px)

---

## 25. TESTING REQUIREMENTS

### 25.1 Unit Testing
- Backend: Jest for API endpoint testing
- Frontend: Jest + React Testing Library for component testing
- Target coverage: 80%+

### 25.2 Integration Testing
- API integration tests (Supertest or similar)
- Database integration tests
- Email sending tests (use test email service)

### 25.3 End-to-End Testing
- Playwright or Cypress for E2E tests
- Critical user flows:
  - Admin launches review cycle
  - Employee completes self-evaluation
  - Manager completes manager review
  - User login and 2FA
  - Password reset

### 25.4 Security Testing
- SQL injection testing (manual and automated)
- XSS testing
- CSRF testing
- Authentication bypass testing
- Authorization testing (ensure users can't access unauthorized data)

### 25.5 Performance Testing
- Load testing with 1000 concurrent users (Apache JMeter or k6)
- Database query performance (ensure < 100ms for most queries)
- Page load time testing (Lighthouse)

### 25.6 User Acceptance Testing
- Conduct UAT with 5-10 representative users
- Test all user workflows
- Gather feedback on UI/UX
- Identify bugs and usability issues

---

## APPENDIX A: SAMPLE EMAIL TEMPLATES

### A.1 Review Cycle Launch
**Subject:** Performance Review Cycle Started: [Cycle Name]

Hi [First Name],

A new performance review cycle has been launched: **[Cycle Name]**

**Key Dates:**
- Self-Evaluation Deadline: [Date in UTC]
- 360 Reviews Deadline: [Date in UTC]
- Manager Review Deadline: [Date in UTC]
- Review Cycle End: [Date in UTC]

You will receive email notifications when you have reviews to complete. You can also check your pending reviews at any time by logging in.

[Login to Review System]

All times are in UTC.

Thank you,
[Company Name] Performance Review System

---

### A.2 Self-Evaluation Assignment
**Subject:** Action Required: Complete Your Self-Evaluation by [Deadline]

Hi [First Name],

Please complete your self-evaluation for the **[Cycle Name]** review cycle.

**Deadline:** [Date and Time in UTC]

[Complete Self-Evaluation]

You can save your progress and return to complete it later. The review will auto-save every 60 seconds.

If you have any questions, please contact your manager.

All times are in UTC.

Thank you,
[Company Name] Performance Review System

---

### A.3 360 Review Assignment
**Subject:** Action Required: Complete 360 Review for [Reviewee Name] by [Deadline]

Hi [First Name],

You have been selected to provide 360 feedback for **[Reviewee Name]** ([Job Title]) as part of the **[Cycle Name]** review cycle.

**Deadline:** [Date and Time in UTC]

[Complete 360 Review]

Your feedback is valuable and will help [Reviewee First Name] grow professionally. You can save your progress and return to complete it later.

All times are in UTC.

Thank you,
[Company Name] Performance Review System

---

### A.4 Reminder (3 Days Before Deadline)
**Subject:** Reminder: [Review Type] Due in 3 Days

Hi [First Name],

This is a reminder that your [review type] [for [Reviewee Name]] is due in 3 days.

**Deadline:** [Date and Time in UTC]

[Complete Review]

Please complete this review as soon as possible.

All times are in UTC.

Thank you,
[Company Name] Performance Review System

---

### A.5 Review Complete (to Employee)
**Subject:** Your Performance Review is Complete

Hi [First Name],

Your performance review for **[Cycle Name]** has been completed by your manager.

[Your manager has shared their review with you. View your review here: [Link]]

OR

[Your manager will share their feedback with you directly during your 1-on-1 meeting.]

You can view your self-evaluation and review history at any time.

[View My Reviews]

Thank you,
[Company Name] Performance Review System

---

### A.6 Review Complete (to Manager)
**Subject:** Performance Review Completed: [Employee Name]

Hi [Manager Name],

The performance review for **[Employee Name]** in **[Cycle Name]** has been completed and submitted.

[View Review]

[If you are manager's manager: This is a notification that a review has been completed for one of your team members.]

Thank you,
[Company Name] Performance Review System

---

### A.7 Welcome Email (New User)
**Subject:** Welcome to [Company Name] Performance Review System

Hi [First Name],

Your account has been created in the [Company Name] Performance Review System.

**Email:** [Email Address]

Please set your password to activate your account:

[Set Password]

This link will expire in 24 hours.

Once you've set your password, you can log in and complete any pending reviews.

If you have any questions, please contact your administrator.

Thank you,
[Company Name] Performance Review System

---

### A.8 Password Reset
**Subject:** Password Reset Request

Hi [First Name],

We received a request to reset your password for the [Company Name] Performance Review System.

[Reset Password]

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email. Your password will not be changed.

Thank you,
[Company Name] Performance Review System

---

## APPENDIX B: UI WIREFRAMES (Text Description)

### B.1 Admin Dashboard
```
+-----------------------------------------------------------+
| [Logo] Performance Review System          [Admin] [Logout]|
+-----------------------------------------------------------+
| Dashboard | Review Cycles | Users | Org Chart | Settings |
+-----------------------------------------------------------+
|                                                           |
| Current Review Cycle: Q4 2024 Annual Review              |
| +-------------------------------------------------------+ |
| | Overall Progress: 67% ▓▓▓▓▓▓▓░░░                     | |
| |                                                       | |
| | Self-Evaluations:    85% (34/40) ▓▓▓▓▓▓▓▓░░          | |
| | 360 Reviews:         72% (115/160) ▓▓▓▓▓▓▓░░░        | |
| | Manager Reviews:     45% (18/40) ▓▓▓▓░░░░░░          | |
| +-------------------------------------------------------+ |
|                                                           |
| Overdue Reviews (12)                    [View All]       |
| +-------------------------------------------------------+ |
| | Jane Smith - Self-Evaluation - Due: Oct 15 [Remind]  | |
| | John Doe - 360 for Alice - Due: Oct 15    [Remind]  | |
| | ... (showing 5 of 12)                                 | |
| +-------------------------------------------------------+ |
|                                                           |
| Upcoming Deadlines (8)                  [View All]       |
| +-------------------------------------------------------+ |
| | Bob Johnson - Manager Review - Due: Oct 20 (2 days)  | |
| | ... (showing 5 of 8)                                  | |
| +-------------------------------------------------------+ |
|                                                           |
+-----------------------------------------------------------+
```

### B.2 Review Form
```
+-----------------------------------------------------------+
| [Logo] Performance Review System            [User] [Logout]|
+-----------------------------------------------------------+
| My Reviews | Pending Actions | Team Reviews               |
+-----------------------------------------------------------+
|                                                           |
| Self-Evaluation - Q4 2024 Annual Review                  |
| Deadline: October 18, 2024 at 11:59 PM (PST)             |
| (Deadline displayed in your local timezone)              |
|                                                           |
| +-------------------------------------------------------+ |
| | Instructions:                                         | |
| | Please reflect on your accomplishments, strengths,    | |
| | and areas for growth over the review period.          | |
| +-------------------------------------------------------+ |
|                                                           |
| Your Self-Evaluation:                                    |
| +-------------------------------------------------------+ |
| |                                                       | |
| |  [Large text area - 10,000 character limit]          | |
| |                                                       | |
| |                                                       | |
| |                                                       | |
| |                                                       | |
| |                                                       | |
| |                                                       | |
| +-------------------------------------------------------+ |
| 2,543 / 10,000 characters              Saved at 2:43 PM  |
|                                                           |
| [Save Draft]                         [Submit Review]     |
|                                                           |
+-----------------------------------------------------------+
```

### B.3 Org Chart Editor
```
+-----------------------------------------------------------+
| [Logo] Performance Review System          [Admin] [Logout]|
+-----------------------------------------------------------+
| Dashboard | Review Cycles | Users | Org Chart | Settings |
+-----------------------------------------------------------+
|                                                           |
| Organization Chart                                        |
|                                                           |
| +-------------------------------------------------------+ |
| |                    [Jane Doe]                         | |
| |                   CEO                                 | |
| |                      |                                | |
| |        +-------------+-------------+                  | |
| |        |                           |                  | |
| |   [John Smith]              [Alice Johnson]          | |
| |   VP Engineering            VP Product               | |
| |        |                           |                  | |
| |   +----+----+                 +----+----+            | |
| |   |         |                 |         |            | |
| | [Bob Lee] [Sara Chen]   [Tom Wilson] [Lisa Park]    | |
| | Engineer  Engineer       PM          Designer        | |
| |                                                       | |
| +-------------------------------------------------------+ |
|                                                           |
| Add Employee to Org Chart:                               |
| [Select Employee ▼]  [Select Manager ▼]  [Add]          |
|                                                           |
| [Validate Org Chart]  [Save Changes]                    |
|                                                           |
+-----------------------------------------------------------+
```

---

## APPENDIX C: DATABASE SCHEMA (SQL)

```sql
-- User table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  job_title VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255), -- encrypted
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- OrgChart table
CREATE TABLE org_charts (
  org_chart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL,
  root_employee_id UUID REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_org_charts_is_active ON org_charts(is_active);

-- OrgChartRelationship table
CREATE TABLE org_chart_relationships (
  relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_chart_id UUID NOT NULL REFERENCES org_charts(org_chart_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(user_id),
  manager_id UUID NOT NULL REFERENCES users(user_id),
  UNIQUE(org_chart_id, employee_id)
);

CREATE INDEX idx_org_chart_rel_org_chart ON org_chart_relationships(org_chart_id);
CREATE INDEX idx_org_chart_rel_employee ON org_chart_relationships(employee_id);
CREATE INDEX idx_org_chart_rel_manager ON org_chart_relationships(manager_id);

-- ReviewCycle table
CREATE TYPE review_cycle_status AS ENUM ('planning', 'active', 'completed');
CREATE TYPE reviewer_selection_method AS ENUM ('manager_selects', 'employee_selects');

CREATE TABLE review_cycles (
  review_cycle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  org_chart_id UUID NOT NULL REFERENCES org_charts(org_chart_id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  self_eval_deadline TIMESTAMP NOT NULL,
  peer_360_deadline TIMESTAMP NOT NULL,
  manager_eval_deadline TIMESTAMP NOT NULL,
  min_360_reviewers INTEGER NOT NULL CHECK (min_360_reviewers >= 0 AND min_360_reviewers <= 10),
  max_360_reviewers INTEGER NOT NULL CHECK (max_360_reviewers >= 0 AND max_360_reviewers <= 10),
  reviewer_selection_method reviewer_selection_method NOT NULL,
  status review_cycle_status DEFAULT 'planning',
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  CHECK (max_360_reviewers >= min_360_reviewers)
);

CREATE INDEX idx_review_cycles_status ON review_cycles(status);
CREATE INDEX idx_review_cycles_org_chart ON review_cycles(org_chart_id);

-- ReviewCycleParticipant table
CREATE TYPE participant_status AS ENUM ('not_started', 'draft', 'submitted', 'overdue', 'in_progress', 'complete', 'n/a');

CREATE TABLE review_cycle_participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id UUID NOT NULL REFERENCES review_cycles(review_cycle_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(user_id),
  manager_id UUID REFERENCES users(user_id),
  self_eval_status participant_status DEFAULT 'not_started',
  peer_360_status participant_status DEFAULT 'not_started',
  manager_eval_status participant_status DEFAULT 'not_started',
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  UNIQUE(review_cycle_id, employee_id)
);

CREATE INDEX idx_participants_review_cycle ON review_cycle_participants(review_cycle_id);
CREATE INDEX idx_participants_employee ON review_cycle_participants(employee_id);
CREATE INDEX idx_participants_manager ON review_cycle_participants(manager_id);

-- Review table
CREATE TYPE review_type AS ENUM ('self', 'peer_360', 'manager');
CREATE TYPE review_status AS ENUM ('draft', 'submitted');

CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id UUID NOT NULL REFERENCES review_cycles(review_cycle_id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(user_id),
  reviewee_id UUID NOT NULL REFERENCES users(user_id),
  review_type review_type NOT NULL,
  content TEXT CHECK (LENGTH(content) <= 10000),
  status review_status DEFAULT 'draft',
  submitted_at TIMESTAMP,
  is_released_to_employee BOOLEAN DEFAULT FALSE,
  released_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX idx_reviews_review_cycle ON reviews(review_cycle_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_composite ON reviews(review_cycle_id, reviewee_id, review_type);

-- Peer360Assignment table
CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'submitted', 'not_submitted');

CREATE TABLE peer_360_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_cycle_id UUID NOT NULL REFERENCES review_cycles(review_cycle_id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(user_id),
  reviewer_id UUID NOT NULL REFERENCES users(user_id),
  assigned_by UUID NOT NULL REFERENCES users(user_id),
  review_id UUID REFERENCES reviews(review_id),
  status assignment_status DEFAULT 'assigned',
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  UNIQUE(review_cycle_id, reviewee_id, reviewer_id)
);

CREATE INDEX idx_360_assignments_review_cycle ON peer_360_assignments(review_cycle_id);
CREATE INDEX idx_360_assignments_reviewer ON peer_360_assignments(reviewer_id);
CREATE INDEX idx_360_assignments_reviewee ON peer_360_assignments(reviewee_id);

-- Notification table
CREATE TYPE notification_type AS ENUM ('review_assigned', 'review_submitted', 'review_complete', 'reminder', 'review_released');

CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  notification_type notification_type NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  review_cycle_id UUID REFERENCES review_cycles(review_cycle_id),
  review_id UUID REFERENCES reviews(review_id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);

-- AuditLog table
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Session table
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'UTC';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_cycles_updated_at BEFORE UPDATE ON review_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON review_cycle_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Claude | Initial V1 simplified requirements document |

---

**END OF V1 REQUIREMENTS DOCUMENT**
