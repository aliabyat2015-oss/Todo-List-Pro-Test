class TodoList {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('addTodoBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.render(e.target.value);
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        
        if (!text) {
            this.showNotification('لطفا متن تسک را وارد کنید!', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            category: document.getElementById('categorySelect').value,
            priority: document.getElementById('prioritySelect').value,
            dueDate: document.getElementById('dueDate').value,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        input.value = '';
        this.saveToStorage();
        this.render();
        this.showNotification('تسک با موفقیت اضافه شد!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    deleteTodo(id) {
        if (confirm('آیا از حذف این تسک مطمئن هستید؟')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveToStorage();
            this.render();
            this.showNotification('تسک حذف شد!', 'warning');
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.saveToStorage();
            this.render();
            this.showNotification('تسک ویرایش شد!', 'success');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos(searchTerm = '') {
        let filtered = this.todos;

        // اعمال فیلتر وضعیت
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(todo => !todo.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        }

        // اعمال جستجو
        if (searchTerm) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }

    render(searchTerm = '') {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos(searchTerm);

        if (filteredTodos.length === 0) {
            todoList.innerHTML = this.getEmptyState();
        } else {
            todoList.innerHTML = filteredTodos.map(todo => this.createTodoHTML(todo)).join('');
        }

        this.updateStats();
        this.attachTodoEventListeners();
    }

    createTodoHTML(todo) {
        const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('fa-IR') : 'ندارد';
        
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-action="toggle">
                    ${todo.completed ? '✓' : ''}
                </div>
                <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                <div class="todo-meta-info">
                    <span class="category-badge">${this.getCategoryText(todo.category)}</span>
                    <span class="priority-badge priority-${todo.priority}">
                        ${this.getPriorityText(todo.priority)}
                    </span>
                    <span class="due-date">📅 ${dueDate}</span>
                </div>
                <div class="todo-actions">
                    <button class="btn-icon edit-btn" data-action="edit" title="ویرایش">
                        ✏️
                    </button>
                    <button class="btn-icon delete-btn" data-action="delete" title="حذف">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <h3>📝 هیچ تسکی یافت نشد</h3>
                <p>اولین تسک خود را اضافه کنید!</p>
            </div>
        `;
    }

    attachTodoEventListeners() {
        document.querySelectorAll('.todo-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            
            // تگل کردن تسک
            item.querySelector('[data-action="toggle"]').addEventListener('click', () => {
                this.toggleTodo(id);
            });

            // حذف تسک
            item.querySelector('[data-action="delete"]').addEventListener('click', () => {
                this.deleteTodo(id);
            });

            // ویرایش تسک
            item.querySelector('[data-action="edit"]').addEventListener('click', () => {
                this.promptEditTodo(id);
            });
        });
    }

    promptEditTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const newText = prompt('ویرایش تسک:', todo.text);
        if (newText !== null) {
            this.editTodo(id, newText);
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = `کل: ${total}`;
        document.getElementById('completedTasks').textContent = `انجام شده: ${completed}`;
        document.getElementById('pendingTasks').textContent = `در انتظار: ${pending}`;
    }

    getCategoryText(category) {
        const categories = {
            'general': 'عمومی',
            'work': 'کار',
            'personal': 'شخصی',
            'shopping': 'خرید'
        };
        return categories[category] || category;
    }

    getPriorityText(priority) {
        const priorities = {
            'low': 'کم',
            'medium': 'متوسط',
            'high': 'مهم'
        };
        return priorities[priority] || priority;
    }

    showNotification(message, type = 'info') {
        // ایجاد یک سیستم نوتیفیکیشن ساده
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 600;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    saveToStorage() {
        localStorage.setItem('todoListPro', JSON.stringify(this.todos));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('todoListPro');
        if (stored) {
            this.todos = JSON.parse(stored);
        }
    }
}