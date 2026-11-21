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

  // Smart Plan Modal
  generatePlanBtn: document.getElementById('generatePlanBtn'),
  smartPlanModal: document.getElementById('smartPlanModal'),
  closeSmartPlanModal: document.getElementById('closeSmartPlanModal'),
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
      state.currentUser = JSON.parse(savedUser);
    } catch (e) {
      state.currentUser = null;
    }
  }

  // If no user is logged in, default to a friendly guest profile
  if (!state.currentUser) {
    state.currentUser = {
      name: 'Alex Johnson',
      email: 'alex@university.edu',
      isGuest: false
    };
    saveUserSession();
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
  if (!state.currentUser) {
    elements.navUserName.textContent = 'Guest';
    elements.navUserAvatar.textContent = 'G';
    elements.navUserStatus.textContent = 'Not signed in';
    elements.authBtnLabel.textContent = 'Sign In';
    elements.authBtnIcon.textContent = '🔑';
    elements.welcomeGreeting.textContent = 'Welcome to Study Planner! 🌟';
  } else {
    elements.navUserName.textContent = state.currentUser.name;
    elements.navUserAvatar.textContent = (state.currentUser.name.charAt(0) || 'U').toUpperCase();
    elements.navUserStatus.textContent = state.currentUser.email ? state.currentUser.email : 'Student Account';
    elements.authBtnLabel.textContent = 'Switch / Out';
    elements.authBtnIcon.textContent = '🔄';
    elements.welcomeGreeting.textContent = `Welcome back, ${state.currentUser.name.split(' ')[0]}! 🌟`;
  }
}

function openAuthModal() {
  if (state.currentUser) {
    elements.userNameInput.value = state.currentUser.name;
    elements.userEmailInput.value = state.currentUser.email || '';
  } else {
    elements.userNameInput.value = '';
    elements.userEmailInput.value = '';
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
      state.assignments = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored assignments, falling back to initial data');
      state.assignments = [...INITIAL_SAMPLE_ASSIGNMENTS];
      saveAssignments();
    }
  } else {
    // Populate with friendly initial data on first launch
    state.assignments = [...INITIAL_SAMPLE_ASSIGNMENTS];
    saveAssignments();
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
// Smart Study Plan Generator (Ready for n8n Webhook Integration)
// ==============================================================================
function generateSmartStudyPlan() {
  const pendingItems = state.assignments.filter(a => !a.completed);

  if (pendingItems.length === 0) {
    alert("You don't have any pending assignments to schedule! Add some assignments first.");
    return;
  }

  // Generate an algorithmic distribution over the next 4 days
  // This simulates the schedule optimization engine that will be powered by the n8n webhook workflow
  const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4'];
  const scheduleSlots = [];

  // Group pending tasks by priority and deadline
  const sorted = [...pendingItems].sort((a, b) => a.deadline.localeCompare(b.deadline));

  let dayIndex = 0;
  sorted.forEach((task, idx) => {
    const dayName = days[dayIndex % days.length];
    const sessionHours = Math.min(task.estimatedHours, 2.5);

    scheduleSlots.push({
      day: dayName,
      time: dayIndex % 2 === 0 ? '04:00 PM - 06:00 PM' : '07:30 PM - 09:30 PM',
      course: task.course,
      taskTitle: task.title,
      hours: sessionHours,
      deadline: task.deadline
    });

    dayIndex++;
  });

  // Group by day for clean display in modal
  const groupedByDay = {};
  scheduleSlots.forEach(slot => {
    if (!groupedByDay[slot.day]) groupedByDay[slot.day] = [];
    groupedByDay[slot.day].push(slot);
  });

  let html = '';
  for (const [day, slots] of Object.entries(groupedByDay)) {
    html += `
      <div class="schedule-day-block">
        <div class="schedule-day-title">
          <span>📅 ${day} Study Sessions</span>
          <span>${slots.length} ${slots.length === 1 ? 'session' : 'sessions'}</span>
        </div>
    `;

    slots.forEach(slot => {
      html += `
        <div class="schedule-slot">
          <span class="slot-time">⏰ ${slot.time}</span>
          <div style="flex: 1;">
            <span class="slot-course">[${escapeHTML(slot.course)}]</span> 
            <strong>${escapeHTML(slot.taskTitle)}</strong>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">
            ${slot.hours} hrs focus
          </span>
        </div>
      `;
    });

    html += `</div>`;
  }

  elements.smartScheduleContent.innerHTML = html;
  elements.smartPlanModal.classList.add('active');
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
