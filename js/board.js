/**
 * Listens for the 'sidebarLoaded' event and adds the 'sidebar-active' class to the 'sidebarBoard' element once the sidebar has been fully loaded.
 * This highlights the 'sidebarBoard' element as active, indicating that it is the current page or focus within the application.
 * @event sidebarLoaded
 * @listens sidebarLoaded - Triggers when the sidebar content is fully loaded and ready.
 */
document.addEventListener('sidebarLoaded', function() { document.getElementById('sidebarBoard').classList.add('sidebar-active'); });
document.addEventListener('DOMContentLoaded', function() { fetchInitialData(); });
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('popupSubtasksInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            let subtaskValue = event.target.value.trim();
            if (subtaskValue) {
                addSubtaskToTask(subtaskValue);
                event.target.value = '';
                updateSubtaskList();
                document.getElementById('subtasksContainer').querySelectorAll('.checkbox-subtask').forEach(button => button.classList.add('d-none'));
            }
        }
    });
});

/**
 * Redirect zu add task site.
 */
function redirectToAddTask() { window.location.href = './add-task.html'; }

/**
 * Adds a subtask to the current task being edited.
 * @param {string} subtask - The subtask to be added.
 */
let editingSubtasks = [];
function addSubtaskToTask(subtask) {
    editingSubtasks.push(subtask);
}

/**
 * Toggles the completion status of a specified subtask and updates the backend.
 * @param {number} subtaskIndex - The index of the subtask in the list.
 */
async function checkboxEditingSubtask(subtaskIndex) {
    let checkbox = document.querySelector(`.checkbox-subtask[data-index="${subtaskIndex}"]`);
    let isChecked = checkbox.checked;
    let taskId = document.getElementById('popupTaskId').value;
    try {
        let apiUrl = await importConfig();
        let response = await fetchToBackend(`${apiUrl}/api/update-subtask-status/${taskId}/${subtaskIndex}`, 'PATCH', JSON.stringify({ status: isChecked }));
        if (!response.ok) {
            throw new Error('Failed to update subtask status');
        }
        tasksGlobal[taskId].subTasksChecked[subtaskIndex] = isChecked;
        updateSubtaskList(taskId);
        updateProgressBar(taskId);
    } catch (error) {
        console.error('Error updating subtask status:', error);
    }
}

function updateProgressBar(taskId) {
    let task = tasksGlobal[taskId];
    let progressElement = document.getElementById(`${taskId}-progress`);
    if (!progressElement) return;
    let completedSubtasks = task.subTasksChecked ? task.subTasksChecked.filter(isChecked => isChecked).length : 0;
    let totalSubtasks = task.subTasks ? task.subTasks.length : 0;
    progressElement.max = totalSubtasks;
    progressElement.value = completedSubtasks;
}

/**
 * Updates the list of subtasks displayed on the UI.
 * @param {string} taskId - The ID of the task whose subtasks are being updated.
 */
function updateSubtaskList(taskId) {
    document.getElementById('subtasksContainer').querySelectorAll('.checkbox-subtask').forEach(button => button.classList.add('d-none'));
    let subtasksElement = document.getElementById('subtasksContainer');
    subtasksElement.innerHTML = '';
    editingSubtasks.forEach((subtask, index) => {
        let isChecked = tasksGlobal[taskId]?.subTasksChecked[index] || false;
        let subtaskElement = document.createElement('div');
        subtaskElement.className = 'subtask-item';
        subtaskElement.innerHTML = updateSubtaskListHtml(subtask, index, isChecked);
        subtasksElement.appendChild(subtaskElement);
    });
}

/**
 * Removes a subtask from the list of subtasks being edited.
 * @param {number} index - The index of the subtask to remove.
 */
function removeEditingSubtask(index) {
    editingSubtasks.splice(index, 1);
    updateSubtaskList();
}

/**
 * Displays tasks in appropriate sections based on their state.
 * @param {Object} tasks - The tasks object to display.
 * @returns {void}
 */
async function displayTasks(tasks) {
    Object.keys(tasks).forEach(async (firebaseTaskId) => {
        let task = tasks[firebaseTaskId];
        if (!task.state) {
            console.error('Unknown task state:', task.state, 'for task ID:', firebaseTaskId);
            return;
        }
        try {
            let taskElement = await createTaskElement(task, firebaseTaskId);
            switch(task.state) {
                case 'todo': document.getElementById('todo-box').appendChild(taskElement); break;
                case 'in-progress': document.getElementById('in-progress-box').appendChild(taskElement); break;
                case 'awaiting-feedback': document.getElementById('awaiting-feedback-box').appendChild(taskElement); break;
                case 'done': document.getElementById('done-box').appendChild(taskElement); break;
                default: console.error('Unknown task state:', task.state);
            }
            let textElement = document.getElementById(`${firebaseTaskId}-description`);
            if (textElement) {
                let text = textElement.innerText;
                let maxLength = 91;
                if (text.length > maxLength) {
                    textElement.innerText = text.slice(0, maxLength) + '...';
                }
            }
            updateProgressBar(firebaseTaskId);
        } catch (error) {
            console.error('Error creating or appending task element:', error);
        }
    });
}


/**
 * Generates initials from a full name.
 * @param {string} name - The full name from which to generate initials.
 * @returns {string} The initials derived from the name.
 */
function getInitials(names) {
    return names.map(name => {
        return name.split(' ').map(part => part[0].toUpperCase()).join('');
    }).join(', ');
}

/**
 * Creates a DOM element for a task.
 * @param {Object} task - The task data for which the element is created.
 * @param {string} firebaseTaskId - The Firebase ID of the task.
 * @returns {HTMLElement} The created task element.
 */
async function createTaskElement(task, firebaseTaskId) {
    let div = document.createElement('div');
    const categoryMap = { technicalTask: "Technical Task", userStory: "User Story" };
    let categoryName = categoryMap[task.category] || task.category;
    let priorityUrl = getPriorityUrl(task.priority);
    div.id = firebaseTaskId;
    div.className = 'task-item pointer';
    div.setAttribute('draggable', 'true');
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('click', () => openTask(firebaseTaskId));
    let assigneesHTML = '';
    if (task.assigneeNames) {
        for (let fullName of task.assigneeNames) {
            let [firstName, lastName] = fullName.split(' ');
            let profileColor = await getProfileColor(firstName, lastName);
            let initials = getInitials([fullName]);
            assigneesHTML += `<div class="assignedto" style="background-color: ${profileColor || '#ccc'}; display: inline-block;">${initials}</div>`;
        }
    }
    div.innerHTML = createTaskElementHtml(task.category, categoryName, task.title, task.description, firebaseTaskId, task.subTasks.length, task.subTasks.filter(st => st.checked).length, assigneesHTML, priorityUrl);
    return div;
}

/**
 * Retrieves the URL for the priority icon based on the given priority level.
 * @param {string} prio - The priority level of the task. Expected values are "low", "medium", or "urgent".
 * @returns {string} The URL to the appropriate priority icon image.
 * This function uses a switch statement to determine which image URL to return based on the specified priority.
 * It defaults to the "low" priority image if an unrecognized priority is provided.
 */
function getPriorityUrl(prio) {
    let prioUrl;
    switch(prio) {
        case "low": prioUrl = "./assets/img/prio-low-solo.png"; break;
        case "medium": prioUrl = "./assets/img/prio-medium-solo.png"; break;
        case "urgent": prioUrl = "./assets/img/prio-urgent-solo.png"; break;
        default: prioUrl = "./assets/img/prio-low-solo.png"; break;
    }
    return prioUrl;
}

/**
 * Filters and displays tasks based on the search input.
 * @returns {void}
 */
function searchTasks() {
    let searchInput = document.getElementById('search-task');
    let filter = searchInput.value.toLowerCase();
    let resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    if (filter) {
        Object.entries(tasksGlobal).forEach(([firebaseTaskId, task]) => {
            if (task.title.toLowerCase().includes(filter)) {
                let resultDiv = document.createElement('div');
                resultDiv.className = 'search-result-item';
                resultDiv.textContent = task.id + ' - ' + task.title;
                resultDiv.onclick = function() {
                    openTask(firebaseTaskId); 
                };
                resultsContainer.appendChild(resultDiv);
            }
        });
        if (resultsContainer.innerHTML === '') {
            resultsContainer.innerHTML = '<div class="search-result-item">No tasks found.</div>';
        }
        resultsContainer.style.display = 'block'; 
    } else {
        resultsContainer.style.display = 'none';
    }
}

/**
 * Closes the task details popup.
 * @returns {void}
 */
function closePopup() {
    document.getElementById('taskPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popupSubtasksInput').classList.add('d-none');
    document.getElementById('edit-assignees').classList.add('d-none');
    document.getElementById('popupAssignedTo').classList.contains('d-none') ? document.getElementById('popupAssignedTo').classList.remove('d-none') : null;
    document.querySelector(`label[for='popupSubtasksInput']`).classList.add('d-none');
    document.getElementById('popupAssignedTo-Label').classList.contains("d-none") ? document.getElementById('popupAssignedTo-Label').classList.remove("d-none") : null;
    toAssignUser = [];
    resetInputFields();
}

/**
 * Resets all input fields in the task popup to their default values.
 */
function resetInputFields() {
    document.getElementById('popupTitleInput').value = '';
    document.getElementById('popupDescriptionInput').value = '';
    document.getElementById('popupDueDateInput').value = '';
    document.getElementById('popupCategoryInput').tagName.toLowerCase() === 'select' && (document.getElementById('popupCategoryInput').selectedIndex = 0);
    document.getElementById('popupPrioInput').tagName.toLowerCase() === 'select' && (document.getElementById('popupPrioInput').selectedIndex = 0);
    let editableFields = ['Category', 'Title', 'Description', 'DueDate', 'Prio', 'AssignedTo', 'Subtasks'];
    editableFields.forEach(field => {
        let dataDiv = document.getElementById(`popup${field}`);
        let input = document.getElementById(`popup${field}Input`);
        let label = document.querySelector(`label[for='popup${field}Input']`);
        let container = document.getElementById(`popup${field}Container`);
        if (input && dataDiv && label) {
            dataDiv.classList.remove('d-none');
            input.classList.add('d-none');
            container ? container.classList.add('d-none') : null;
        }
    });
}

/**
 * Includes HTML content for adding tasks dynamically from external files.
 * @returns {Promise<void>} A promise that resolves when the HTML content is included.
 */
async function includeHTMLaddTask() {
    let includeElements = document.querySelectorAll('[w3-include-html]');
    for (let i = 0; i < includeElements.length; i++) {
        const element = includeElements[i];
        file = element.getAttribute("w3-include-html");
        let resp = await fetch(file);
        resp.ok ? element.innerHTML = await resp.text() : element.innerHTML = 'Page not found';;
    }
}

/**
 * Sets up the task board interface for adding a new task.
 * Activates the task background and configures global settings for the new task's placement.
 * @param {string} addSplit - The section where the new task will be displayed.
 * @returns {void}
 */
function addNewTaskBoard(addSplit) { 
    document.getElementById('show-AddTask-Background').classList = 'show-Task-Background';
    includeBoard = true;
    selectedSplit = addSplit;
    addNewTask();
}

/** Fetches the user ID based on first and last name from the backend.
 * @param {string} firstName - The first name of the user.
 * @param {string} lastName - The last name of the user.
 * @returns {Promise<string|null>} The user ID if found, otherwise null.
 */
async function findUserIdByName(firstName, lastName) {
    let apiUrl = await importConfig();
    const response = await fetchToBackend(`${apiUrl}/api/accounts`, 'GET');
    if (!response.ok) {
        throw new Error('Failed to fetch accounts');
    }
    const accounts = await response.json();
    const foundKey = Object.keys(accounts).find(key =>
        accounts[key].firstName === firstName && accounts[key].lastName === lastName
    );
    return foundKey || null;
}

/** Toggles the display and editability of specified fields in a form. If a field is currently displayed as static text, it switches to an editable input form; if it is an input form, it switches to static text. This is used primarily in UIs where quick editing of information is needed without navigating away from the page.
 * @param {Array<string>} fields - The names of the fields to toggle between edit and read-only modes.
 */
function toggleFields(fields) {
    fields.forEach(field => {
        const dataDiv = document.getElementById(`popup${field}`);
        const input = document.getElementById(`popup${field}Input`);
        const label = document.querySelector(`label[for='popup${field}Input']`);
        const container = document.getElementById(`popup${field}Container`);
        if (dataDiv && input && label) {
            dataDiv.classList.contains('d-none')
                ? (dataDiv.classList.remove('d-none'), input.classList.add('d-none'), label.classList.add('d-none'), container && container.classList.add('d-none'))
                : (input.value = dataDiv.textContent.trim(), input.tagName.toLowerCase() === 'select' && 
                   Array.from(input.options).forEach(option => {
                       option.text === dataDiv.textContent.trim() && (option.selected = true);
                   }),
                   dataDiv.classList.add('d-none'), input.classList.remove('d-none'), label.classList.remove('d-none'), container && container.classList.remove('d-none'));
        } else {
            console.error(`One or more elements for field '${field}' are missing in the DOM.`);
        }        
    });
    let editAssignees = document.getElementById('edit-assignees').classList;
    editAssignees.contains('d-none') ? editAssignees.remove('d-none') : editAssignees.add('d-none');
    let popupAssignedTo = document.getElementById('popupAssignedTo').classList;
    popupAssignedTo.contains('d-none') ? popupAssignedTo.remove('d-none') : popupAssignedTo.add('d-none');
    let popupAssignedToLabel = document.getElementById('popupAssignedTo-Label').classList;
    popupAssignedToLabel.contains("d-none") ? popupAssignedToLabel.remove("d-none") : popupAssignedToLabel.add("d-none");
    toggleSubtasksInput();
}

/** Toggles the visibility of the subtask input field and its label.
 */
function toggleSubtasksInput() {
    let input = document.getElementById('popupSubtasksInput');
    let label = document.querySelector('label[for="popupSubtasksInput"]');
    (input && label) ? input.classList.contains('d-none') ? input.classList.remove('d-none') + label.classList.remove('d-none') : input.classList.add('d-none') + label.classList.add('d-none') : console.error('One or more elements for subtasks input are missing in the DOM.');
}

/** Displays the delete confirmation popup for a specific task.
 * This function sets a global variable `taskToDelete` with the ID of the task that might be deleted and makes the delete confirmation popup visible.
 * @param {string} firebaseTaskId - The Firebase ID of the task to potentially delete.
 */
let taskToDelete = null;
function showDeletePopup(firebaseTaskId) {
    taskToDelete = firebaseTaskId;
    document.getElementById('deleteTaskPopup').classList.remove('d-none');
    document.getElementById('deleteOverlay').classList.remove('d-none')
}

/**
 * Confirms the deletion of the task that is marked for deletion. If a task is marked for deletion (i.e., `taskToDelete` is not null), this function
 * will call `deleteTask` to perform the deletion and then reset `taskToDelete` to null. Regardless of whether a task was deleted, it will close the delete confirmation popup.
 */
function confirmDelete() {
    if (taskToDelete) {
        deleteTask(taskToDelete);
        taskToDelete = null;
    }
    closeDeletePopup();
}

/**
 * Closes the delete confirmation popup. This function checks if the popup exists and if so, hides it along with the overlay.
 * It uses a conditional (ternary) operator to check for the existence of the popup element before attempting to modify its class list.
 */
function closeDeletePopup() {
    let popupElement = document.getElementById('deleteTaskPopup');
    popupElement ? popupElement.classList.add('d-none') + document.getElementById('deleteOverlay').classList.add('d-none') : null;
}

/**
 * Clears the task display in all sections.
 * @returns {void}
 */
function clearTaskDisplay() {
    document.getElementById('todo-box').innerHTML = '';
    document.getElementById('in-progress-box').innerHTML = '';
    document.getElementById('awaiting-feedback-box').innerHTML = '';
    document.getElementById('done-box').innerHTML = '';
}

/**
 * Resets the style and appearance of two priority buttons back to their default state.
 * @param {string} button1 - The first button to reset.
 * @param {string} button2 - The second button to reset.
 */
function resetButtons(button1, button2) {
    document.getElementById(button1).style.background = '';
    document.getElementById(button1).style.color = 'black';
    document.getElementById(button2).style.color = 'black';              
    document.getElementById(button2).style.background = '';
    let b1 = 'img-' + button1;
    let b2 = 'img-' + button2;
    document.getElementById(b1).src = './assets/img/' + button1 + '-solo.png';
    document.getElementById(b2).src = './assets/img/' + button2 + '-solo.png';
}