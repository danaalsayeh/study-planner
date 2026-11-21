/**
 * ==============================================================================
 * Smart Study Planner - script.js
 * Vanilla JavaScript (No frameworks, 100% compatible with GitHub Pages)
 *
 * Handles:
 * 1. User login / authentication state (saved in localStorage)
 * 2. Assignment CRUD operations (Add, View, Mark Complete, Delete)
 * 3. Sorting, Searching, and Status Filtering
 * 4. Real-time Dashboard Statistics & Progress Bar calculation
 * 5. Smart Study Plan generator (n8n automation ready)
 * ==============================================================================
 */

// Storage Keys
const STORAGE_KEYS = {
  USER: 'study_planner_user',
  ASSIGNMENTS: 'study_planner_assignments'
};

// Seed sample data for first-time visitors
const INITIAL_SAMPLE_ASSIGNMENTS = [
  {
    id: 'task-1',
    title: 'Algorithms & Data Structures Problem Set',
    course: 'Computer Science',
    deadline: getFutureDate(2),
    deadlineTime: '23:59',
    estimatedHours: 4,
    priority: 'high',
    completed: false,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'task-2',
    title: 'Calculus II Chapter 6 Integration Review',
    course: 'Calculus II',
    deadline: getFutureDate(4),
    deadlineTime: '17:00',
    estimatedHours: 3,
    priority: 'medium',
    completed: false,
    createdAt: Date.now() - 43200000
  },
  {
    id: 'task-3',
    title: 'Physics Lab Report: Rotational Dynamics',
    course: 'Physics',
    deadline: getFutureDate(1),
    deadlineTime: '11:30',
    estimatedHours: 2.5,
    priority: 'high',
    completed: true,
    createdAt: Date.now() - 172800000
  },
  {
    id: 'task-4',
    title: 'Modern Literature Essay Draft',
    course: 'English Literature',
    deadline: getFutureDate(7),
    deadlineTime: '20:00',
    estimatedHours: 5,
    priority: 'low',
    completed: false,
    createdAt: Date.now() - 10000000
  }
];

// Helper: generate ISO date string (YYYY-MM-DD) offset by days
function getFutureDate(daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

// State Object
const state = {
  currentUser: null,
  assignments: [],
  currentFilter: 'all',
  currentSort: 'deadlineAsc',
  searchQuery: ''
};

// ==============================================================================
// DOM Element References
// ==============================================================================
const elements = {
  // Navigation & User Info
  userBadge: document.getElementById('userBadge'),
  navUserAvatar: document.getElementById('navUserAvatar'),
  navUserName: document.getElementById('navUserName'),
  navUserStatus: document.getElementById('navUserStatus'),
  authActionBtn: document.getElementById('authActionBtn'),
  authBtnIcon: document.getElementById('authBtnIcon'),
  authBtnLabel: document.getElementById('authBtnLabel'),
  welcomeGreeting: document.getElementById('welcomeGreeting'),

  // Stats & Progress Bar
  statTotal: document.getElementById('statTotal'),
  statPending: document.getElementById('statPending'),
  statCompleted: document.getElementById('statCompleted'),
  statHours: document.getElementById('statHours'),
  progressPercentage: document.getElementById('progressPercentage'),
  progressBarFill: document.getElementById('progressBarFill'),

  // Form Elements
  assignmentForm: document.getElementById('assignmentForm'),
  taskTitle: document.getElementById('taskTitle'),
  taskCourse: document.getElementById('taskCourse'),
  taskDeadline: document.getElementById('taskDeadline'),
  taskDeadlineTime: document.getElementById('taskDeadlineTime'),
  taskPriority: document.getElementById('taskPriority'),
  taskHours: document.getElementById('taskHours'),

  // Assignments List & Controls
  assignmentList: document.getElementById('assignmentList'),
  assignmentCountSub: document.getElementById('assignmentCountSub'),
  filterPills: document.getElementById('filterPills'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  emptyState: document.getElementById('emptyState'),
  emptyStateMessage: document.getElementById('emptyStateMessage'),

  // Auth Modal
  authModal: document.getElementById('authModal'),
  closeAuthModal: document.getElementById('closeAuthModal'),
  authForm: document.getElementById('authForm'),
  userNameInput: document.getElementById('userNameInput'),
  userEmailInput: document.getElementById('userEmailInput'),
  demoPills: document.querySelectorAll('.demo-pill'),
  signOutBtn: document.getElementById('signOutBtn'),
  loadSampleTasksBtn: document.getElementById('loadSampleTasksBtn'),

  // Smart Plan Modal
  generatePlanBtn: document.getElementById('generatePlanBtn'),
  generatePlanIcon: document.getElementById('generatePlanIcon'),
  generatePlanText: document.getElementById('generatePlanText'),
  dailyStudyHoursInput: document.getElementById('dailyStudyHoursInput'),
  smartPlanModal: document.getElementById('smartPlanModal'),
  closeSmartPlanModal: document.getElementById('closeSmartPlanModal'),
  smartPlanStatusBadge: document.getElementById('smartPlanStatusBadge'),
  smartPlanSubtitle: document.getElementById('smartPlanSubtitle'),
  smartPlanSummaryBanner: document.getElementById('smartPlanSummaryBanner'),
  smartPlanSummaryText: document.getElementById('smartPlanSummaryText'),
  smartPlanWarnings: document.getElementById('smartPlanWarnings'),
  smartPlanUnscheduled: document.getElementById('smartPlanUnscheduled'),
  smartScheduleContent: document.getElementById('smartScheduleContent'),
  confirmPlanBtn: document.getElementById('confirmPlanBtn'),
  printScheduleBtn: document.getElementById('printScheduleBtn'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer')
};

// ==============================================================================
// Initialization
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initUserSession();
  initAssignments();
  setupEventListeners();
  setDefaultDeadlineInput();
  renderApp();
});

/**
 * Set the default date picker to tomorrow's date
 */
function setDefaultDeadlineInput() {
  if (elements.taskDeadline) {
    elements.taskDeadline.value = getFutureDate(1);
    elements.taskDeadline.min = getFutureDate(0); // Prevent picking past days
  }
}

// ==============================================================================
// User Authentication & Profile Logic (Local Session)
// ==============================================================================
function initUserSession() {
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      // Clean up legacy default demo account if stored previously
      if (parsed && parsed.name === 'Alex Johnson' && parsed.email === 'alex@university.edu') {
        state.currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.USER);
      } else {
        state.currentUser = parsed;
      }
    } catch (e) {
      state.currentUser = null;
    }
  } else {
    // New visitors start in Guest mode with no automatic login
    state.currentUser = null;
  }
  updateUserUI();
}

function saveUserSession() {
  if (state.currentUser) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.currentUser));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

function updateUserUI() {
  if (!state.currentUser || state.currentUser.isGuest) {
    elements.navUserName.textContent = 'Guest';
    elements.navUserAvatar.textContent = 'G';
    elements.navUserStatus.textContent = 'Guest Mode';
    elements.authBtnLabel.textContent = 'Sign In';
    elements.authBtnIcon.textContent = '🔑';
    elements.welcomeGreeting.textContent = 'Welcome to StudyFlow! 🌟';
  } else {
    elements.navUserName.textContent = state.currentUser.name;
    elements.navUserAvatar.textContent = (state.currentUser.name.charAt(0) || 'U').toUpperCase();
    elements.navUserStatus.textContent = state.currentUser.email ? state.currentUser.email : 'Student Account';
    elements.authBtnLabel.textContent = 'Switch Account';
    elements.authBtnIcon.textContent = '🔄';
    elements.welcomeGreeting.textContent = `Welcome back, ${state.currentUser.name.split(' ')[0]}! 🌟`;
  }
}

function openAuthModal() {
  if (state.currentUser && !state.currentUser.isGuest) {
    elements.userNameInput.value = state.currentUser.name;
    elements.userEmailInput.value = state.currentUser.email || '';
    if (elements.signOutBtn) elements.signOutBtn.style.display = 'flex';
  } else {
    elements.userNameInput.value = '';
    elements.userEmailInput.value = '';
    if (elements.signOutBtn) elements.signOutBtn.style.display = 'none';
  }
  elements.authModal.classList.add('active');
  elements.userNameInput.focus();
}

function closeAuthModal() {
  elements.authModal.classList.remove('active');
}

// ==============================================================================
// Assignments Data & LocalStorage Management
// ==============================================================================
function initAssignments() {
  const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      state.assignments = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse stored assignments:', e);
      state.assignments = [];
    }
  } else {
    // New visitors start with zero assignments
    state.assignments = [];
  }
}

function saveAssignments() {
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(state.assignments));
}

// ==============================================================================
// CRUD Operations
// ==============================================================================

/**
 * Handle form submission to create a new assignment
 */
function handleAddAssignment(e) {
  e.preventDefault();

  const title = elements.taskTitle.value.trim();
  const course = elements.taskCourse.value.trim();
  const deadline = elements.taskDeadline.value;
  const deadlineTime = elements.taskDeadlineTime.value || '23:59';
  const priority = elements.taskPriority.value;
  const estimatedHours = parseFloat(elements.taskHours.value) || 1;

  if (!title || !course || !deadline) {
    showToast('Please fill in all required fields.', 'info');
    return;
  }

  const newAssignment = {
    id: 'task-' + Date.now(),
    title,
    course,
    deadline,
    deadlineTime,
    priority,
    estimatedHours,
    completed: false,
    createdAt: Date.now()
  };

  // Add to beginning of array
  state.assignments.unshift(newAssignment);
  saveAssignments();
  renderApp();

  // Reset form and maintain default date
  elements.assignmentForm.reset();
  setDefaultDeadlineInput();
  if (elements.taskHours) elements.taskHours.value = 2;

  showToast(`Added "${title}" to your planner!`, 'success');
}

/**
 * Toggle completion status of an assignment
 */
function toggleAssignmentCompletion(id) {
  const item = state.assignments.find(a => a.id === id);
  if (item) {
    item.completed = !item.completed;
    saveAssignments();
    renderApp();

    if (item.completed) {
      showToast(`Completed "${item.title}"! Great job! 🎉`, 'success');
    } else {
      showToast(`Reopened "${item.title}".`, 'info');
    }
  }
}

/**
 * Delete an assignment
 */
function deleteAssignment(id) {
  const item = state.assignments.find(a => a.id === id);
  const title = item ? item.title : 'assignment';

  if (confirm(`Are you sure you want to delete "${title}"?`)) {
    state.assignments = state.assignments.filter(a => a.id !== id);
    saveAssignments();
    renderApp();
    showToast(`Deleted "${title}".`, 'info');
  }
}

// ==============================================================================
// Filtering, Sorting, & Search Logic
// ==============================================================================

function getFilteredAssignments() {
  const now = new Date();
  const todayStr = getFutureDate(0);
  const soonStr = getFutureDate(3);

  let list = [...state.assignments];

  // 1. Text Search Filter (Course or Title)
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.course.toLowerCase().includes(q)
    );
  }

  // 2. Status / Due Filter
  if (state.currentFilter === 'pending') {
    list = list.filter(item => !item.completed);
  } else if (state.currentFilter === 'completed') {
    list = list.filter(item => item.completed);
  } else if (state.currentFilter === 'dueSoon') {
    list = list.filter(item => {
      if (item.completed) return false;
      return item.deadline <= soonStr;
    });
  }

  // 3. Sorting
  list.sort((a, b) => {
    switch (state.currentSort) {
      case 'deadlineAsc':
        return a.deadline.localeCompare(b.deadline) || a.deadlineTime.localeCompare(b.deadlineTime);
      case 'deadlineDesc':
        return b.deadline.localeCompare(a.deadline) || b.deadlineTime.localeCompare(a.deadlineTime);
      case 'priority': {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
      }
      case 'hours':
        return (b.estimatedHours || 0) - (a.estimatedHours || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return list;
}

// ==============================================================================
// Dashboard Statistics & Progress Calculation
// ==============================================================================
function updateStatsAndProgress() {
  const total = state.assignments.length;
  const completed = state.assignments.filter(a => a.completed).length;
  const pending = total - completed;

  // Calculate remaining estimated hours for pending assignments
  const remainingHours = state.assignments
    .filter(a => !a.completed)
    .reduce((acc, curr) => acc + (parseFloat(curr.estimatedHours) || 0), 0);

  // Completion Percentage
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update DOM elements
  elements.statTotal.textContent = total;
  elements.statPending.textContent = pending;
  elements.statCompleted.textContent = completed;
  elements.statHours.textContent = remainingHours % 1 === 0 ? `${remainingHours}h` : `${remainingHours.toFixed(1)}h`;

  elements.progressPercentage.textContent = `${percentage}%`;
  elements.progressBarFill.style.width = `${percentage}%`;

  // Update list subtitle
  elements.assignmentCountSub.textContent = `${total} ${total === 1 ? 'task' : 'tasks'} total`;
}

// ==============================================================================
// Rendering Assignment List
// ==============================================================================
function renderAssignments() {
  const filtered = getFilteredAssignments();
  elements.assignmentList.innerHTML = '';

  if (filtered.length === 0) {
    elements.emptyState.style.display = 'block';
    if (state.searchQuery) {
      elements.emptyStateMessage.textContent = `No assignments found matching "${state.searchQuery}". Try a different keyword or reset filters.`;
    } else if (state.currentFilter === 'pending') {
      elements.emptyStateMessage.textContent = "Awesome! You have zero pending tasks right now. Relax or plan ahead!";
    } else if (state.currentFilter === 'completed') {
      elements.emptyStateMessage.textContent = "No completed assignments yet. Check off items as you finish them!";
    } else if (state.currentFilter === 'dueSoon') {
      elements.emptyStateMessage.textContent = "No assignments due in the next 3 days. Your schedule is clear for now!";
    } else {
      elements.emptyStateMessage.textContent = "You have no assignments listed. Add your first course task using the form on the left!";
    }
    return;
  }

  elements.emptyState.style.display = 'none';

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = `assignment-item priority-${item.priority} ${item.completed ? 'completed' : ''}`;
    card.dataset.id = item.id;

    // Format relative deadline display
    const deadlineInfo = formatDeadline(item.deadline, item.deadlineTime);

    card.innerHTML = `
      <div class="checkbox-container" title="${item.completed ? 'Mark as pending' : 'Mark as completed'}">
        <div class="checkbox-custom">
          ${item.completed ? '✓' : ''}
        </div>
      </div>

      <div class="item-main">
        <div class="item-header">
          <span class="course-badge">${escapeHTML(item.course)}</span>
          <span class="priority-badge ${item.priority}">
            ${item.priority === 'high' ? '🔥 High' : item.priority === 'medium' ? '⚡ Medium' : '🌱 Low'}
          </span>
        </div>
        <div class="item-title">${escapeHTML(item.title)}</div>
        <div class="item-details">
          <span class="item-detail-span deadline-tag ${deadlineInfo.statusClass}">
            📅 ${deadlineInfo.text}
          </span>
          <span class="item-detail-span">
            ⏱️ ${item.estimatedHours}h study est.
          </span>
        </div>
      </div>

      <div class="item-actions">
        <button type="button" class="action-btn delete-btn" title="Delete assignment" data-action="delete">
          🗑️
        </button>
      </div>
    `;

    // Event listeners for individual items
    card.querySelector('.checkbox-container').addEventListener('click', () => {
      toggleAssignmentCompletion(item.id);
    });

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAssignment(item.id);
    });

    elements.assignmentList.appendChild(card);
  });
}

function renderApp() {
  updateStatsAndProgress();
  renderAssignments();
}

// ==============================================================================
// Deadline Relative Formatter
// ==============================================================================
function formatDeadline(dateStr, timeStr) {
  if (!dateStr) return { text: 'No date', statusClass: '' };

  const today = getFutureDate(0);
  const tomorrow = getFutureDate(1);

  let label = '';
  let statusClass = '';

  if (dateStr < today) {
    label = `Overdue (${dateStr})`;
    statusClass = 'overdue';
  } else if (dateStr === today) {
    label = `Due Today at ${timeStr || '23:59'}`;
    statusClass = 'due-today';
  } else if (dateStr === tomorrow) {
    label = `Due Tomorrow at ${timeStr || '23:59'}`;
    statusClass = 'due-today';
  } else {
    // Format friendly date like 'Nov 25'
    const parts = dateStr.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const day = dateObj.getDate();
    label = `Due ${month} ${day} at ${timeStr || '23:59'}`;
  }

  return { text: label, statusClass };
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ==============================================================================
// Smart Study Plan Generator (Connected to n8n Webhook)
// ==============================================================================
const N8N_WEBHOOK_URL = 'https://dana962.app.n8n.cloud/webhook/generate-study-plan';

/**
 * Returns today's date in user's local timezone formatted as 'YYYY-MM-DD'
 */
function getLocalTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a schedule date (YYYY-MM-DD) into a friendly string
 */
function formatScheduleDate(dateStr) {
  if (!dateStr) return 'Scheduled Sessions';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = getLocalTodayDate();
    const isToday = (dateStr === today);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    return `${isToday ? 'Today (' + dayName + ')' : dayName}, ${month} ${dayNum}`;
  }
  return dateStr;
}

/**
 * Toggles the loading state of the Generate Plan button & modal
 */
function setPlanLoadingState(isLoading) {
  if (isLoading) {
    if (elements.generatePlanBtn) {
      elements.generatePlanBtn.disabled = true;
      elements.generatePlanIcon.textContent = '⏳';
      elements.generatePlanText.textContent = 'Generating Schedule...';
    }
    elements.smartPlanStatusBadge.textContent = 'Connecting...';
    elements.smartPlanStatusBadge.style.background = 'var(--primary)';
    elements.smartPlanSubtitle.textContent = 'Contacting your n8n AI scheduler...';
    elements.smartPlanSummaryBanner.style.display = 'block';
    elements.smartPlanSummaryText.textContent = 'Calculating balanced study blocks for upcoming deadlines...';
    elements.smartPlanWarnings.style.display = 'none';
    elements.smartPlanUnscheduled.style.display = 'none';
    elements.smartScheduleContent.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 1rem; color: var(--text-main); font-weight: 600; font-size: 0.95rem;">
          Connecting to n8n Webhook...
        </p>
        <p style="color: var(--text-muted); font-size: 0.8rem; max-width: 380px; margin: 0.35rem auto 0;">
          Analyzing your real unfinished assignments and balancing study hours across upcoming days.
        </p>
      </div>
    `;
    elements.smartPlanModal.classList.add('active');
  } else {
    if (elements.generatePlanBtn) {
      elements.generatePlanBtn.disabled = false;
      elements.generatePlanIcon.textContent = '✨';
      elements.generatePlanText.textContent = 'Generate Smart Study Plan';
    }
  }
}

/**
 * Displays friendly modal when user has 0 unfinished assignments
 */
function displayEmptyStudyPlanModal() {
  elements.smartPlanStatusBadge.textContent = 'No Tasks';
  elements.smartPlanStatusBadge.style.background = 'var(--secondary)';
  elements.smartPlanSubtitle.textContent = 'Your schedule is built from your active, unfinished assignments.';
  elements.smartPlanSummaryBanner.style.display = 'none';
  elements.smartPlanWarnings.style.display = 'none';
  elements.smartPlanUnscheduled.style.display = 'none';
  elements.smartScheduleContent.innerHTML = `
    <div style="text-align: center; padding: 2rem 1rem;">
      <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📋</div>
      <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;">No Unfinished Assignments Found</h4>
      <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 420px; margin: 0 auto 1.25rem; line-height: 1.5;">
        You currently have zero pending assignments. Add your real course tasks using the form on the left to generate an automated timetable.
      </p>
      <button type="button" class="btn-primary" style="display: inline-flex; margin: 0 auto;" onclick="document.getElementById('closeSmartPlanModal').click(); document.getElementById('taskTitle').focus();">
        ✍️ Add Your First Assignment
      </button>
    </div>
  `;
  elements.smartPlanModal.classList.add('active');
}

/**
 * Displays error modal if any assignment has missing data
 */
function displayIncompleteAssignmentsError(invalidList) {
  elements.smartPlanStatusBadge.textContent = 'Validation Alert';
  elements.smartPlanStatusBadge.style.background = 'var(--priority-high)';
  elements.smartPlanSummaryBanner.style.display = 'none';
  elements.smartPlanWarnings.style.display = 'none';
  elements.smartPlanUnscheduled.style.display = 'none';
  elements.smartScheduleContent.innerHTML = `
    <div class="smart-alert smart-alert-warning">
      <div style="font-weight: 700; margin-bottom: 0.4rem; font-size: 0.95rem;">⚠️ Missing Assignment Details</div>
      <p>The scheduler requires complete information to calculate realistic study dates. The following assignments are missing a deadline date or valid study hours:</p>
      <ul style="margin: 0.5rem 0 0.5rem 1.25rem;">
        ${invalidList.map(item => `<li><strong>${escapeHTML(item)}</strong></li>`).join('')}
      </ul>
      <p style="font-size: 0.78rem;">Please update these tasks with real deadline dates and hours before generating your plan.</p>
    </div>
  `;
  elements.smartPlanModal.classList.add('active');
}

/**
 * Main action: generates study plan via n8n webhook
 */
async function generateSmartStudyPlan() {
  // 1. Read real, unfinished assignments from localStorage/state
  const pendingAssignments = state.assignments.filter(a => !a.completed);

  if (pendingAssignments.length === 0) {
    showToast('No unfinished assignments found. Add tasks to your planner first!', 'info');
    displayEmptyStudyPlanModal();
    return;
  }

  // 2. Read dailyStudyHours from input (default 3)
  let dailyStudyHours = 3;
  if (elements.dailyStudyHoursInput) {
    const val = parseFloat(elements.dailyStudyHoursInput.value);
    if (!isNaN(val) && val > 0) {
      dailyStudyHours = val;
    }
  }

  // 3. Transform assignment fields into the format expected by n8n:
  // { today: 'YYYY-MM-DD', dailyStudyHours: 3, assignments: [{task, course, deadline, estimatedHours}] }
  const invalidAssignments = [];
  const transformedAssignments = [];

  for (const item of pendingAssignments) {
    const taskName = (item.title || '').trim();
    const courseName = (item.course || '').trim();
    const deadline = (item.deadline || '').trim();
    const estimatedHours = parseFloat(item.estimatedHours);

    if (!taskName || !deadline || isNaN(estimatedHours) || estimatedHours <= 0) {
      invalidAssignments.push(taskName || 'Untitled assignment');
    } else {
      transformedAssignments.push({
        task: taskName,
        course: courseName || 'General',
        deadline: deadline,
        estimatedHours: estimatedHours
      });
    }
  }

  if (invalidAssignments.length > 0) {
    displayIncompleteAssignmentsError(invalidAssignments);
    return;
  }

  const payload = {
    today: getLocalTodayDate(),
    dailyStudyHours: dailyStudyHours,
    assignments: transformedAssignments
  };

  // 4. Show loading state
  setPlanLoadingState(true);

  try {
    // Direct fetch to published n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errDetails = '';
      try {
        const errJson = await response.json();
        errDetails = errJson.message || JSON.stringify(errJson);
      } catch (e) {
        errDetails = await response.text();
      }
      throw new Error(`n8n HTTP ${response.status}: ${errDetails || response.statusText}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Received an invalid or empty response from n8n scheduler.');
    }

    renderScheduleResult(data, dailyStudyHours);
  } catch (error) {
    handleScheduleFetchError(error, payload, dailyStudyHours);
  } finally {
    setPlanLoadingState(false);
  }
}

/**
 * Renders the returned schedule, warnings, and unscheduled hours
 */
function renderScheduleResult(data, dailyStudyHours) {
  elements.smartPlanStatusBadge.textContent = 'Generated';
  elements.smartPlanStatusBadge.style.background = 'var(--success)';
  elements.smartPlanSubtitle.textContent = 'Here is your balanced study schedule generated by n8n.';

  // Summary message banner
  elements.smartPlanSummaryBanner.style.display = 'block';
  elements.smartPlanSummaryText.textContent = data.message || 'Your study plan has been generated!';

  // Render Warnings
  if (Array.isArray(data.warnings) && data.warnings.length > 0) {
    elements.smartPlanWarnings.style.display = 'block';
    elements.smartPlanWarnings.innerHTML = `
      <div class="smart-alert smart-alert-warning">
        <strong>⚠️ Schedule Warning${data.warnings.length > 1 ? 's' : ''}:</strong>
        <ul>
          ${data.warnings.map(w => `<li>${escapeHTML(typeof w === 'string' ? w : JSON.stringify(w))}</li>`).join('')}
        </ul>
      </div>
    `;
  } else {
    elements.smartPlanWarnings.style.display = 'none';
    elements.smartPlanWarnings.innerHTML = '';
  }

  // Render Unscheduled Tasks
  if (Array.isArray(data.unscheduled) && data.unscheduled.length > 0) {
    elements.smartPlanUnscheduled.style.display = 'block';
    elements.smartPlanUnscheduled.innerHTML = `
      <div class="smart-alert smart-alert-unscheduled">
        <strong>⏳ Unscheduled Study Hours (${data.unscheduled.length} item${data.unscheduled.length > 1 ? 's' : ''}):</strong>
        <p style="margin-top: 0.25rem;">The following tasks could not be fully fitted before their deadlines within ${dailyStudyHours}h/day:</p>
        <ul>
          ${data.unscheduled.map(u => {
            const taskName = u.task || u.title || 'Task';
            const remaining = u.remainingHours !== undefined ? u.remainingHours : (u.hours || '?');
            return `<li><strong>${escapeHTML(taskName)}</strong>: ${remaining} hour(s) left unscheduled</li>`;
          }).join('')}
        </ul>
      </div>
    `;
  } else {
    elements.smartPlanUnscheduled.style.display = 'none';
    elements.smartPlanUnscheduled.innerHTML = '';
  }

  // Render Schedule grouped by date
  const schedule = Array.isArray(data.schedule) ? data.schedule : [];

  if (schedule.length === 0) {
    elements.smartScheduleContent.innerHTML = `
      <div class="smart-alert smart-alert-info">
        <strong>ℹ️ Notice:</strong> No study sessions were scheduled. Check your deadlines or increase your daily available study hours.
      </div>
    `;
    elements.smartPlanModal.classList.add('active');
    return;
  }

  // Group by date
  const groupedByDate = {};
  schedule.forEach(slot => {
    const dateKey = slot.date || 'Upcoming';
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(slot);
  });

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedByDate).sort();

  let html = '';
  sortedDates.forEach(dateKey => {
    const slots = groupedByDate[dateKey];
    const dayTotalHours = slots.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
    const dayTitle = formatScheduleDate(dateKey);

    html += `
      <div class="schedule-day-block">
        <div class="schedule-day-title">
          <span>📅 ${escapeHTML(dayTitle)}</span>
          <span style="font-size: 0.78rem; opacity: 0.85;">${dayTotalHours} total hours &bull; ${slots.length} ${slots.length === 1 ? 'session' : 'sessions'}</span>
        </div>
    `;

    slots.forEach(slot => {
      html += `
        <div class="schedule-slot">
          <span class="slot-time">⏱️ ${slot.hours} hr${slot.hours === 1 ? '' : 's'}</span>
          <div style="flex: 1; min-width: 0;">
            <span class="slot-course">[${escapeHTML(slot.course || 'Study')}]</span> 
            <strong>${escapeHTML(slot.task)}</strong>
            ${slot.deadline ? `<span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 0.5rem;">Due: ${escapeHTML(slot.deadline)}</span>` : ''}
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  elements.smartScheduleContent.innerHTML = html;
  elements.smartPlanModal.classList.add('active');
  showToast('Study schedule generated successfully!', 'success');
}

/**
 * Handles errors and explains browser CORS preflight restrictions
 */
function handleScheduleFetchError(err, payload, dailyStudyHours) {
  console.error('Failed to generate study plan from n8n webhook:', err);

  const isCorsOrNetwork = err instanceof TypeError || (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError')));
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  elements.smartPlanStatusBadge.textContent = 'Connection Notice';
  elements.smartPlanStatusBadge.style.background = '#f59e0b';
  elements.smartPlanSummaryBanner.style.display = 'none';
  elements.smartPlanWarnings.style.display = 'none';
  elements.smartPlanUnscheduled.style.display = 'none';

  if (isCorsOrNetwork && isLocalhost) {
    elements.smartScheduleContent.innerHTML = `
      <div class="smart-alert smart-alert-warning">
        <div style="font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
          <span>⚠️</span> Browser CORS Restriction (Localhost)
        </div>
        <p style="margin-bottom: 0.5rem;">
          Your browser blocked reading the response from <code>${escapeHTML(N8N_WEBHOOK_URL)}</code> due to browser CORS security.
        </p>
        <div style="background: rgba(255, 255, 255, 0.7); border: 1px solid #fde68a; border-radius: 6px; padding: 0.65rem 0.85rem; font-family: monospace; font-size: 0.76rem; margin: 0.5rem 0; line-height: 1.5;">
          <strong>Requesting Origin:</strong> ${escapeHTML(window.location.origin)}<br>
          <strong>n8n Access-Control-Allow-Origin:</strong> https://danaalsayeh.github.io
        </div>
        <p style="margin-bottom: 0.5rem;">
          <strong>Why this happens:</strong> In your n8n workflow, the allowed CORS origin header is set to your production GitHub Pages domain (<code>https://danaalsayeh.github.io</code>). When running locally on <code>${escapeHTML(window.location.origin)}</code>, the browser preflight OPTIONS check blocks the direct call.
        </p>
        <p style="margin-bottom: 0.5rem;">
          <strong>Verification & Next Steps:</strong>
        </p>
        <ul style="margin-left: 1.25rem; font-size: 0.8rem; line-height: 1.5;">
          <li><strong>On GitHub Pages:</strong> Once pushed to your GitHub repository, calls will originate from <code>https://danaalsayeh.github.io</code> and succeed directly without CORS block!</li>
          <li><strong>For Localhost Testing:</strong> In your n8n webhook node, add <code>http://localhost:8000</code> to the Allowed Origins list.</li>
          <li><strong>Test UI Now:</strong> Click the button below to test through your local server proxy:</li>
        </ul>
        <div style="margin-top: 1rem; text-align: center;">
          <button type="button" class="btn-auth" id="retryProxyBtn" style="margin: 0 auto; display: inline-flex; font-size: 0.82rem; padding: 0.5rem 1rem;">
            ⚡ Test Schedule via Local Proxy
          </button>
        </div>
      </div>
    `;

    const retryProxyBtn = document.getElementById('retryProxyBtn');
    if (retryProxyBtn) {
      retryProxyBtn.addEventListener('click', () => {
        callViaLocalProxy(payload, dailyStudyHours);
      });
    }
  } else {
    elements.smartScheduleContent.innerHTML = `
      <div class="smart-alert smart-alert-error">
        <div style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.4rem;">
          ❌ Could Not Connect to n8n Webhook
        </div>
        <p>${escapeHTML(err.message || 'An unexpected network error occurred while connecting to n8n.')}</p>
        <p style="margin-top: 0.5rem; font-size: 0.78rem; opacity: 0.85;">
          Please verify that your published n8n workflow is active at <code>${escapeHTML(N8N_WEBHOOK_URL)}</code>.
        </p>
      </div>
    `;
  }

  elements.smartPlanModal.classList.add('active');
}

/**
 * Proxy helper for testing schedule UI on localhost
 */
async function callViaLocalProxy(payload, dailyStudyHours) {
  setPlanLoadingState(true);
  try {
    const res = await fetch('/api/generate-study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Proxy error HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    renderScheduleResult(data, dailyStudyHours);
  } catch (err) {
    elements.smartScheduleContent.innerHTML = `
      <div class="smart-alert smart-alert-error">
        <strong>Proxy Failed:</strong> ${escapeHTML(err.message)}
      </div>
    `;
  } finally {
    setPlanLoadingState(false);
  }
}

// ==============================================================================
// Toast Notifications
// ==============================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> <span>${escapeHTML(message)}</span>`;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ==============================================================================
// Event Listeners Setup
// ==============================================================================
function setupEventListeners() {
  // Form submission
  elements.assignmentForm.addEventListener('submit', handleAddAssignment);

  // Filter Pills
  elements.filterPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    elements.filterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    state.currentFilter = pill.dataset.filter;
    renderAssignments();
  });

  // Search Input with real-time filtering
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    renderAssignments();
  });

  // Sort Selector
  elements.sortSelect.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    renderAssignments();
  });

  // User Auth Modal Triggers
  elements.userBadge.addEventListener('click', openAuthModal);
  elements.authActionBtn.addEventListener('click', openAuthModal);
  elements.closeAuthModal.addEventListener('click', closeAuthModal);

  // Close modals clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === elements.authModal) closeAuthModal();
    if (e.target === elements.smartPlanModal) elements.smartPlanModal.classList.remove('active');
  });

  // Handle Login form
  elements.authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = elements.userNameInput.value.trim();
    const email = elements.userEmailInput.value.trim();

    if (name) {
      state.currentUser = { name, email, isGuest: false };
      saveUserSession();
      updateUserUI();
      closeAuthModal();
      showToast(`Logged in as ${name}!`, 'success');
    }
  });

  // Demo user buttons
  elements.demoPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const name = pill.dataset.name;
      const major = pill.dataset.major;
      state.currentUser = { name, email: major, isGuest: false };
      saveUserSession();
      updateUserUI();
      closeAuthModal();
      showToast(`Switched account to ${name}!`, 'success');
    });
  });

  // Switch to Guest Mode / Sign Out
  if (elements.signOutBtn) {
    elements.signOutBtn.addEventListener('click', () => {
      state.currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.USER);
      updateUserUI();
      closeAuthModal();
      showToast('Switched to Guest mode.', 'info');
    });
  }

  // Optional Load Example Assignments
  if (elements.loadSampleTasksBtn) {
    elements.loadSampleTasksBtn.addEventListener('click', () => {
      state.assignments = [...INITIAL_SAMPLE_ASSIGNMENTS];
      saveAssignments();
      renderApp();
      closeAuthModal();
      showToast('Loaded example assignments!', 'success');
    });
  }

  // Smart Plan Modal triggers
  elements.generatePlanBtn.addEventListener('click', generateSmartStudyPlan);
  elements.closeSmartPlanModal.addEventListener('click', () => {
    elements.smartPlanModal.classList.remove('active');
  });
  elements.confirmPlanBtn.addEventListener('click', () => {
    elements.smartPlanModal.classList.remove('active');
    showToast('Smart Study Schedule verified!', 'success');
  });
  elements.printScheduleBtn.addEventListener('click', () => {
    window.print();
  });
}
