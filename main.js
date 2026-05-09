// State Management
let state = {
    items: [],
    theme: 'light',
    filter: 'all'
};

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoCategory = document.getElementById('todo-category');
const todoDate = document.getElementById('todo-date');
const todoType = document.getElementById('todo-type');
const todoList = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const statsToggleBtn = document.getElementById('stats-toggle-btn');
const closeStatsBtn = document.getElementById('close-stats');
const statsDashboard = document.getElementById('stats-dashboard');

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
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    todoDate.value = today;

    render();
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
        category: todoCategory.value,
        date: todoDate.value || new Date().toISOString().split('T')[0],
        type: todoType.value,
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
        item.completed = !item.completed;
        if (item.completed) {
            item.completedAt.push(Date.now());
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
        if (state.filter === 'all') return true;
        return item.type === state.filter;
    });

    filteredItems.forEach(item => {
        const li = document.createElement('li');
        li.className = `todo-item ${item.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${item.completed ? 'checked' : ''}>
            <div class="todo-content">
                <span class="todo-text">${item.text}</span>
                <div class="todo-meta">
                    <span class="todo-badge">${item.type}</span>
                    <span class="todo-badge">${item.category}</span>
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

// UI Interactions
statsToggleBtn.addEventListener('click', () => {
    statsDashboard.classList.toggle('hidden');
});

closeStatsBtn.addEventListener('click', () => {
    statsDashboard.classList.add('hidden');
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
