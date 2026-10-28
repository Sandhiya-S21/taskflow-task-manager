
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");

const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");

const formHeading = document.getElementById("formHeading");
const submitButton = document.getElementById("submitButton");
const cancelEdit = document.getElementById("cancelEdit");

const currentFilterButtons = document.querySelectorAll(".filter-btn");

const themeToggle = document.getElementById("themeToggle");
const progressBar = document.getElementById("progressBar");
const progressPercentage = document.getElementById("progressPercentage");
const progressTrack = document.getElementById("progressTrack");
const progressMessage = document.getElementById("progressMessage");
const visibleTaskCount = document.getElementById("visibleTaskCount");

let tasks = [];

try {
    const savedTasks = localStorage.getItem("taskManagerTasks");

    if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);

        if (Array.isArray(parsedTasks)) {
            tasks = parsedTasks.filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.completed === "boolean"
            );
        }
    }
} catch (error) {
    console.error("Unable to load tasks:", error);
}

let currentFilter = "all";
let editingTaskId = null;

// ========================================
// DARK MODE
// ========================================

function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);

    themeToggle.innerHTML = isDark
        ? "☀️ <span>Light Mode</span>"
        : "🌙 <span>Dark Mode</span>";

    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );
}

let isDarkMode = false;

try {
    isDarkMode = localStorage.getItem("taskManagerTheme") === "dark";
} catch (error) {
    console.warn("Theme preference could not be loaded.");
}

applyTheme(isDarkMode);

themeToggle.addEventListener("click", function () {
    isDarkMode = !document.body.classList.contains("dark-mode");

    applyTheme(isDarkMode);

    try {
        localStorage.setItem(
            "taskManagerTheme",
            isDarkMode ? "dark" : "light"
        );
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }
});

// ========================================
// SAVE TASKS
// ========================================

function saveTasks() {
    try {
        localStorage.setItem("taskManagerTasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
        alert("Unable to save tasks. Browser storage may be unavailable.");
    }
}

// ========================================
// TASK ID
// ========================================

function createTaskId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return Date.now().toString() +
        Math.random().toString(36).slice(2);
}

// ========================================
// ADD OR UPDATE TASK
// ========================================

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const priority = taskPriority.value;
    const dueDate = taskDate.value;

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    if (editingTaskId !== null) {
        const task = tasks.find(task => task.id === editingTaskId);

        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.dueDate = dueDate;
        }
    } else {
        tasks.unshift({
            id: createTaskId(),
            title,
            description,
            priority,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }

    saveTasks();
    resetForm();
    renderTasks();
});

// ========================================
// CREATE ELEMENT HELPER
// ========================================

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// ========================================
// RENDER TASKS
// ========================================

function renderTasks() {
    taskList.replaceChildren();

    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        return matchesSearch && matchesFilter;
    });

    filteredTasks.forEach(task => {
        const card = createElement("article", "task-card");

        if (task.completed) {
            card.classList.add("completed");
        }

        // Title
        const top = createElement("div", "task-top");
        const title = createElement("h3", "task-title", task.title);

        top.appendChild(title);
        card.appendChild(top);

        // Description
        if (task.description) {
            card.appendChild(
                createElement("p", "task-description", task.description)
            );
        }

        // Metadata
        const meta = createElement("div", "task-meta");

        const priority = ["Low", "Medium", "High"].includes(task.priority)
            ? task.priority
            : "Medium";

        meta.appendChild(
            createElement(
                "span",
                `priority ${priority}`,
                `${priority} Priority`
            )
        );

        if (task.dueDate) {
            const dueDate = createElement(
                "span",
                "due-date",
                `Due: ${formatDate(task.dueDate)}`
            );

            const due = new Date(`${task.dueDate}T00:00:00`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!task.completed && !Number.isNaN(due.getTime()) && due < today) {
                dueDate.classList.add("overdue");
                dueDate.textContent += " (Overdue)";
            }

            meta.appendChild(dueDate);
        }

        if (task.completed) {
            meta.appendChild(
                createElement("span", "status-label", "Completed")
            );
        }

        card.appendChild(meta);

        // Buttons
        const actions = createElement("div", "task-actions");

        const completeButton = createElement(
            "button",
            "complete-btn",
            task.completed ? "Mark Pending" : "Complete"
        );

        completeButton.type = "button";
        completeButton.addEventListener("click", () => toggleTask(task.id));

        const editButton = createElement("button", "edit-btn", "Edit");

        editButton.type = "button";
        editButton.addEventListener("click", () => editTask(task.id));

        const deleteButton = createElement("button", "delete-btn", "Delete");

        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => deleteTask(task.id));

        actions.append(completeButton, editButton, deleteButton);
        card.appendChild(actions);

        taskList.appendChild(card);
    });

    emptyMessage.hidden = filteredTasks.length !== 0;

    visibleTaskCount.textContent =
        `${filteredTasks.length} ${filteredTasks.length === 1 ? "task" : "tasks"}`;

    updateDashboard();
}

// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateString) {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ========================================
// DASHBOARD AND PROGRESS BAR
// ========================================

function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    totalTasks.textContent = total;
    pendingTasks.textContent = pending;
    completedTasks.textContent = completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;

    progressTrack.setAttribute("aria-valuenow", percentage);

    if (total === 0) {
        progressMessage.textContent =
            "Add a task to start tracking your progress.";
    } else if (percentage === 100) {
        progressMessage.textContent =
            "Amazing! All your tasks are completed. 🎉";
    } else {
        progressMessage.textContent =
            `${completed} of ${total} tasks completed. Keep going!`;
    }
}

// ========================================
// COMPLETE OR REOPEN TASK
// ========================================

function toggleTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    saveTasks();
    renderTasks();
}

// ========================================
// EDIT TASK
// ========================================

function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    editingTaskId = id;

    taskTitle.value = task.title;
    taskDescription.value = task.description || "";
    taskPriority.value = ["Low", "Medium", "High"].includes(task.priority)
        ? task.priority
        : "Medium";
    taskDate.value = task.dueDate || "";

    formHeading.textContent = "Edit Task";
    submitButton.textContent = "Update Task";
    cancelEdit.hidden = false;

    document.getElementById("task-form-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    taskTitle.focus();
}

// ========================================
// DELETE TASK
// ========================================

function deleteTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
        return;
    }

    tasks = tasks.filter(task => task.id !== id);

    if (editingTaskId === id) {
        resetForm();
    }

    saveTasks();
    renderTasks();
}

// ========================================
// RESET FORM
// ========================================

function resetForm() {
    taskForm.reset();

    editingTaskId = null;

    formHeading.textContent = "Create a Task";
    submitButton.textContent = "+ Add Task";
    cancelEdit.hidden = true;

    taskPriority.value = "Medium";
}

cancelEdit.addEventListener("click", resetForm);

// ========================================
// FILTERS
// ========================================

currentFilterButtons.forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = this.dataset.filter;

        currentFilterButtons.forEach(filterButton => {
            filterButton.classList.remove("active");
        });

        this.classList.add("active");

        renderTasks();
    });
});

// ========================================
// SEARCH
// ========================================

searchInput.addEventListener("input", renderTasks);

// ========================================
// INITIALIZE
// ========================================

renderTasks();

