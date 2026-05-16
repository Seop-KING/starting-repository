// State Management
const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

let state = {
    items: [],
    theme: 'light',
    filter: 'all',
    selectedDate: getLocalDateString(),
    selectedType: 'Task',
    habitStartDate: null,
    habitEndDate: null,
};

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const typeBtns = document.querySelectorAll('.type-btn');
const habitOptions = document.getElementById('habit-options');
const habitTodoInput = document.getElementById('habit-todo-input');
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

    state.selectedDate = getLocalDateString();
    state.selectedType = 'Task';
    state.habitStartDate = null;
    state.habitEndDate = null;
    
    document.body.setAttribute('data-theme', state.theme);

    setupCalendar();
    render();
}

function setupCalendar() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }

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
        const dateStr = getLocalDateString(date);

        const dayItem = document.createElement('div');
        dayItem.className = 'day-item';

        dayItem.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-number">${i}</span>
        `;

        dayItem.addEventListener('click', () => {
            if (state.selectedType === 'Habit') {
                if (!state.habitStartDate || state.habitEndDate) {
                    state.habitStartDate = dateStr;
                    state.habitEndDate = null;
                } else {
                    const startDate = new Date(state.habitStartDate);
                    const clickedDate = new Date(dateStr);
                    if (clickedDate < startDate) {
                        state.habitStartDate = dateStr;
                    } else {
                        state.habitEndDate = dateStr;
                    }
                }
            } else {
                state.selectedDate = dateStr;
                state.habitStartDate = null;
                state.habitEndDate = null;
            }
            saveState();
            render();
        });

        daysContainer.appendChild(dayItem);
    }
    updateCalendarSelection();
    
    const selectedEl = daysContainer.querySelector(`.day-item[data-date="${state.selectedDate}"]`);
    if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function updateCalendarSelection() {
    document.querySelectorAll('.day-item').forEach(el => {
        el.classList.remove('active', 'in-range', 'range-start', 'range-end');
        const dateStr = el.dataset.date;

        if (state.selectedType === 'Habit' && state.habitStartDate) {
            const startDate = new Date(state.habitStartDate);
            const endDate = state.habitEndDate ? new Date(state.habitEndDate) : null;
            const currentDate = new Date(dateStr);

            if (endDate && currentDate >= startDate && currentDate <= endDate) {
                el.classList.add('in-range');
            }
            if (dateStr === state.habitStartDate) {
                el.classList.add('active', 'range-start');
            }
            if (dateStr === state.habitEndDate) {
                el.classList.add('active', 'range-end');
            }

        } else if (dateStr === state.selectedDate) {
            el.classList.add('active');
        }
    });
}

function saveState() {
    localStorage.setItem('minimal-tracker-state', JSON.stringify(state));
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (state.selectedType === 'Habit') {
        if (!state.habitStartDate || !state.habitEndDate) {
            alert('Please select a start and end date for the habit on the calendar.');
            return;
        }

        const startDate = new Date(state.habitStartDate);
        const endDate = new Date(state.habitEndDate);

        const itemsToAdd = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateStr = getLocalDateString(currentDate);
            itemsToAdd.push({
                id: Date.now() + Math.random(),
                text: todoInput.value,
                type: 'Habit',
                date: dateStr,
                category: 'General',
                completed: false,
                completedAt: []
            });
            if (habitTodoInput.value) {
              itemsToAdd.push({
                  id: Date.now() + Math.random(),
                  text: habitTodoInput.value,
                  type: 'Task',
                  date: dateStr,
                  category: 'General',
                  completed: false,
                  completedAt: []
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        state.items = [...itemsToAdd, ...state.items];
        state.habitStartDate = null;
        state.habitEndDate = null;

    } else {
        const newItem = {
            id: Date.now() + Math.random(),
            text: todoInput.value,
            type: 'Task',
            date: state.selectedDate,
            category: 'General',
            completed: false,
            completedAt: [] 
        };
        state.items.unshift(newItem);
    }

    todoInput.value = '';
    habitTodoInput.value = '';
    saveState();
    render();
});

typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedType = btn.dataset.type;

        state.habitStartDate = null;
        state.habitEndDate = null;
        
        if (state.selectedType === 'Habit') {
            habitOptions.classList.remove('hidden');
        } else {
            habitOptions.classList.add('hidden');
        }
        render();
    });
});

function toggleComplete(id) {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const wasCompleted = item.completed;
        item.completed = !item.completed;

        if (item.completed && !wasCompleted) {
            item.completedAt.push(Date.now());
        } else if (!item.completed && wasCompleted) {
            item.completedAt.pop();
        }

        saveState();
        render();
    }
}

function deleteItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    saveState();
    render();
}

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

    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    statPercentageEl.textContent = `${percentage}%`;

    progressCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
}

function render() {
    todoList.innerHTML = '';
    updateCalendarSelection();

    const filteredItems = state.items.filter(item => {
        if (item.date !== state.selectedDate) return false;

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

themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', state.theme);
    saveState();
});

init();
