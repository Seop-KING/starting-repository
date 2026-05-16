// State Management
let state = {
    items: [],
    theme: 'light',
    filter: 'all',
    selectedDate: new Date().toISOString().split('T')[0]
};

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoType = document.getElementById('todo-type');
const todoList = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const statsToggleBtn = document.getElementById('stats-toggle-btn');
const closeStatsBtn = document.getElementById('close-stats');
const statsDashboard = document.getElementById('stats-dashboard');

const yearSelect = document.getElementById('year-select');
const monthSelect = document.getElementById('month-select');
const daysContainer = document.getElementById('days-container');

const weeklyCountEl = document.getElementById('weekly-count');
const monthlyCountEl = document.getElementById('monthly-count');
const statPercentageEl = document.getElementById('stat-percentage');
const progressCircle = document.getElementById('progress-circle');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize
function init() {
    const savedState = localStorage.getItem('minimal-tracker-state');
    if (savedState) {
        state = JSON.parse(savedState);
    }

    // Set initial theme
    document.body.setAttribute('data-theme', state.theme);

    setupCalendar();
    render();
}

function setupCalendar() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Populate Years (Current +/- 5 years)
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }

    // Populate Months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthNames.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        if (index === currentMonth) option.selected = true;
        monthSelect.appendChild(option);
    });

    yearSelect.addEventListener('change', updateDays);
    monthSelect.addEventListener('change', updateDays);

    updateDays();
}

function updateDays() {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    daysContainer.innerHTML = '';
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dayName = dayNames[date.getDay()];
        const dateStr = date.toISOString().split('T')[0];

        const dayItem = document.createElement('div');
        dayItem.className = 'day-item';
        if (dateStr === state.selectedDate) dayItem.classList.add('active');

        dayItem.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-number">${i}</span>
        `;

        dayItem.addEventListener('click', () => {
            document.querySelectorAll('.day-item').forEach(el => el.classList.remove('active'));
            dayItem.classList.add('active');
            state.selectedDate = dateStr;
            saveState();
            render();
        });

        daysContainer.appendChild(dayItem);

        // Scroll to active day on initial load
        if (dateStr === state.selectedDate) {
            dayItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
}

// Save to LocalStorage
function saveState() {
    localStorage.setItem('minimal-tracker-state', JSON.stringify(state));
}

// Add Item
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newItem = {
        id: Date.now(),
        text: todoInput.value,
        type: todoType.value,
        date: state.selectedDate,
        category: 'General',
        completed: false,
        completedAt: [] 
    };

    state.items.unshift(newItem);
    todoInput.value = '';
    saveState();
    render();
});
// Toggle Completion
function toggleComplete(id) {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const wasCompleted = item.completed;
        item.completed = !item.completed;

        if (item.completed && !wasCompleted) {
            // Only add timestamp if transitioning from incomplete to completed
            item.completedAt.push(Date.now());
        } else if (!item.completed && wasCompleted) {
            // Optional: remove the last completion record if unchecked
            item.completedAt.pop();
        }

        saveState();
        render();
    }
}

// Delete Item
function deleteItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    saveState();
    render();
}

// Stats Calculation & Chart Rendering
function updateStats() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weeklyCount = 0;
    let monthlyCount = 0;
    let totalItems = state.items.length;
    let completedItems = state.items.filter(i => i.completed).length;

    state.items.forEach(item => {
        item.completedAt.forEach(timestamp => {
            const date = new Date(timestamp);
            if (date >= oneWeekAgo) weeklyCount++;
            if (date >= firstDayOfMonth) monthlyCount++;
        });
    });

    weeklyCountEl.textContent = weeklyCount;
    monthlyCountEl.textContent = monthlyCount;

    // Calculate Percentage
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    statPercentageEl.textContent = `${percentage}%`;

    // Update Circle Chart
    progressCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
}

// Render List
function render() {
    todoList.innerHTML = '';

    const filteredItems = state.items.filter(item => {
        // Filter by date first
        if (item.date !== state.selectedDate) return false;

        // Then by type
        if (state.filter === 'all') return true;
        return item.type === state.filter;
    });

    if (filteredItems.length === 0) {
        todoList.innerHTML = '<li class="todo-item" style="justify-content: center; color: var(--text-muted);">No tasks for this day</li>';
    }

    filteredItems.forEach(item => {

        const li = document.createElement('li');
        li.className = `todo-item ${item.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${item.completed ? 'checked' : ''}>
            <div class="todo-content">
                <span class="todo-text">${item.text}</span>
                <div class="todo-meta">
                    <span class="todo-badge">${item.type}</span>
                    <span>${item.date}</span>
                </div>
            </div>
            <button class="delete-btn" aria-label="Delete">&times;</button>
        `;

        li.querySelector('.todo-checkbox').addEventListener('change', () => toggleComplete(item.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));

        todoList.appendChild(li);
    });

    updateStats();
}

const mainContentWrapper = document.getElementById('main-content-wrapper');
const siteTitle = document.getElementById('site-title');

// UI Interactions
statsToggleBtn.addEventListener('click', () => {
    statsDashboard.classList.toggle('hidden');
    if (!statsDashboard.classList.contains('hidden')) {
        mainContentWrapper.style.display = 'none';
    } else {
        mainContentWrapper.style.display = 'block';
    }
});

closeStatsBtn.addEventListener('click', () => {
    statsDashboard.classList.add('hidden');
    mainContentWrapper.style.display = 'block';
});

siteTitle.addEventListener('click', () => {
    statsDashboard.classList.add('hidden');
    mainContentWrapper.style.display = 'block';
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        render();
    });
});


filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        render();
    });
});

themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', state.theme);
    saveState();
});

// Run Init
init();
