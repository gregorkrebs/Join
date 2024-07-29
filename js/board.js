document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('popupSubtasksInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const subtaskValue = event.target.value.trim();
            if (subtaskValue) {
                addSubtaskToTask(subtaskValue);
                event.target.value = '';
                updateSubtaskList();
            }
        }
    });
});

let editingSubtasks = [];

function addSubtaskToTask(subtask) {
    editingSubtasks.push(subtask);
}

function updateSubtaskList() {
    const subtasksElement = document.getElementById('subtasksContainer');
    subtasksElement.innerHTML = '';
    editingSubtasks.forEach((subtask, index) => {
        const subtaskElement = document.createElement('div');
        subtaskElement.className = 'subtask-item';
        subtaskElement.innerHTML = `
            <span>${subtask}</span>
            <button class="remove-subtask" onclick="removeEditingSubtask(${index})">X</button>
        `;
        subtasksElement.appendChild(subtaskElement);
    });
}

function removeEditingSubtask(index) {
    editingSubtasks.splice(index, 1);
    updateSubtaskList();
}

/**
 * Fetches tasks from the server and stores them in a global object.
 * @returns {Promise<void>} A promise that resolves when tasks are fetched and processed.
 */
async function fetchTasks() {
    try {
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/tasks`;
        const response = await fetchToBackend(fetchUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        const result = await response.json();
        tasksGlobal = {};  // Re-initialize to ensure it's empty
        Object.keys(result.tasks).forEach(firebaseTaskId => {
            const task = result.tasks[firebaseTaskId];
            
            // Fetch assignee profile color
            if (task.assigneeId) {
                const assigneeResponse =  fetchToBackend(`${apiUrl}/api/accounts/${task.assigneeId}`);
                const assignee =  assigneeResponse.json();
                task.assignee = `${assignee.firstName} ${assignee.lastName}`;
                task.profileColor = assignee.color;
            }
            
            tasksGlobal[firebaseTaskId] = task;  // Store tasks by their Firebase ID
        });
        displayTasks(tasksGlobal);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}
/**
 * Displays tasks in appropriate sections based on their state.
 * @param {Object} tasks - The tasks object to display.
 * @returns {void}
 */
function displayTasks(tasks) {
    Object.keys(tasks).forEach(firebaseTaskId => {
        const task = tasks[firebaseTaskId];
        if (!task.state) {
            console.error('Unknown task state:', task.state, 'for task ID:', firebaseTaskId);
            return;
        }

        const taskElement = createTaskElement(task, firebaseTaskId);
        switch(task.state) {
            case 'todo': document.getElementById('todo-box').appendChild(taskElement); break;
            case 'in-progress': document.getElementById('inprogress-box').appendChild(taskElement); break;
            case 'awaiting-feedback': document.getElementById('feedback-box').appendChild(taskElement); break;
            case 'done': document.getElementById('done-box').appendChild(taskElement); break;
            default: console.error('Unknown task state:', task.state);
        }
    });
}

function getInitials(name) {
    const names = name.split(' ');
    let initials = '';
    for (let i = 0; i < names.length; i++) {
        if (names[i].length > 0) {
            initials += names[i][0];
        }
    }
    return initials.toUpperCase();
}

/**
 * Creates a DOM element for a task.
 * @param {Object} task - The task data for which the element is created.
 * @param {string} firebaseTaskId - The Firebase ID of the task.
 * @returns {HTMLElement} The created task element.
 */
function createTaskElement(task, firebaseTaskId) {
    const div = document.createElement('div');
    const categoryMap = {
        technicalTask: "Technical Task",
        userStory: "User Story"
    };

    let categoryName = categoryMap[task.category] || task.category;
    let priorityUrl = getPriorityUrl(task.priority);
    let assigneeInitials = task.assignee ? getInitials(task.assignee) : '';
    let profileColor = task.profileColor || '#ccc'; // Default color if profileColor is not available

    div.className = 'task-item';
    div.innerHTML = `
        <div class="${task.category}">${categoryName}</div>
        <h4>${task.title}</h4>
        <p>${task.description}</p>
        <div class="tasks-subtasks">
            <progress max="${task.subTasks.length}" value="${task.subTasks.length}"></progress>
            <p>${task.subTasks.length} Subtasks</p>
        </div>
        <div id="task-meta">
            <div id="assignedto" style="background-color: ${profileColor}">${assigneeInitials}</div>
            <div id="task-priority"><div class="task-priority-img"><img src="${priorityUrl}"></div></div>
        </div>
    `;

    div.addEventListener('click', () => openTask(firebaseTaskId));

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
    const searchInput = document.getElementById('search-task');
    const filter = searchInput.value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    if (filter) {
        Object.entries(tasksGlobal).forEach(([firebaseTaskId, task]) => {
            if (task.title.toLowerCase().includes(filter)) {
                const resultDiv = document.createElement('div');
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
 * Fetches initial data and hides the loader once data is loaded.
 * @returns {Promise<void>} A promise that resolves when initial data is fetched.
 */
async function fetchInitialData() {
    try {
        await fetchTasks();
        hideLoader();
    } catch (error) {
        console.error('Error fetching initial data:', error);
        hideLoader();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetchInitialData();
});

/**
 * Function for opening a task and displaying the task details as popup
 * 
 * @param {string} firebaseTaskId - Specific ID of the task you want to open
 * @returns {void}
 */
let tasksGlobal = {};
/**
 * Function for opening a task and displaying the task details as popup
 * 
 * @param {string} firebaseTaskId - Specific ID of the task you want to open
 * @returns {void}
 */
function openTask(firebaseTaskId) {
    const task = tasksGlobal[firebaseTaskId];
    if (!task) {
        console.error('Task not found!', firebaseTaskId);
        return;
    }

    document.getElementById('popupTitle').textContent = task.title;
    document.getElementById('popupDescription').textContent = task.description;
    document.getElementById('popupDueDate').textContent = task.dueDate;

    const popupCategoryDiv = document.getElementById('popupCategory');
    const categoryMap = {
        technicalTask: "Technical Task",
        userStory: "User Story"
    };
    popupCategoryDiv.textContent = categoryMap[task.category] || task.category;
    popupCategoryDiv.className = task.category === 'technicalTask' ? 'technicalTask' : 'userStory';
    const priorityUrl = getPriorityUrl(task.priority);
    document.getElementById('popupPrio').innerHTML = `${task.priority} <img src="${priorityUrl}">`;
    document.getElementById('popupAssignedTo').textContent = task.assignee ? task.assignee : 'No one assigned'; 

    const subtasksElement = document.getElementById('subtasksContainer');
    subtasksElement.innerHTML = '';
    if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach((subtask, index) => {
            const subtaskElement = document.createElement('div');
            subtaskElement.className = 'subtask-item';
            subtaskElement.innerHTML = `
                <span>${subtask}</span>
                <button class="remove-subtask d-none" onclick="removeSubtask('${firebaseTaskId}', ${index})">X</button>
            `;
            subtasksElement.appendChild(subtaskElement);
        });
    } else {
        subtasksElement.innerHTML = 'No subtasks';
    }

    // Display task options
    const taskOptionsDiv = document.getElementById('taskOptions');
    taskOptionsDiv.innerHTML = `
        <div id="taskDelete" onclick="showDeletePopup('${firebaseTaskId}')"><img src="./assets/img/delete.png" alt="delete task"> Delete</div>
        <div id="editTask" onclick="editTask('${firebaseTaskId}')"><img src="./assets/img/edit.png" alt="edit task"> Edit</div>
    `;
    editingSubtasks = task.subTasks || [];
    updateSubtaskList();

    document.getElementById('taskPopup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

async function removeSubtask(firebaseTaskId, subtaskIndex) {
    const task = tasksGlobal[firebaseTaskId];
    if (!task) {
        console.error('Task not found!', firebaseTaskId);
        return;
    }

    task.subTasks.splice(subtaskIndex, 1);  // Remove the subtask

    // Update the task on the server
    try {
        let apiUrl = await importConfig();
        const csrfToken = await getCsrfToken();

        let fetchUrl = `${apiUrl}/api/edit-task/${firebaseTaskId}`;
        const response = await fetch(fetchUrl, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json', 'CSRF-Token': csrfToken, 'Authorization': `Bearer ${localStorage.getItem('token')}`},
            credentials: 'include',
            body: JSON.stringify({ subTasks: task.subTasks })
        });

        if (!response.ok) {
            throw new Error('Failed to update subtasks');
        }

        // Re-fetch the updated task data to update the UI
        await fetchTasks();
        openTask(firebaseTaskId);  // Re-open the task to reflect changes
    } catch (error) {
        console.error('Error updating subtasks:', error);
        alert('Error updating subtasks.');
    }
}

/**
 * Closes the task details popup.
 * @returns {void}
 */
function closePopup() {
    document.getElementById('taskPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    resetInputFields();
}

function resetInputFields() {
    document.getElementById('popupTitleInput').value = '';
    document.getElementById('popupDescriptionInput').value = '';
    document.getElementById('popupDueDateInput').value = '';
    document.getElementById('popupAssignedToInput').value = '';
    if (document.getElementById('popupCategoryInput').tagName.toLowerCase() === 'select') {
        document.getElementById('popupCategoryInput').selectedIndex = 0;
    }
    if (document.getElementById('popupPrioInput').tagName.toLowerCase() === 'select') {
        document.getElementById('popupPrioInput').selectedIndex = 0;
    }

    const editableFields = ['Category', 'Title', 'Description', 'DueDate', 'Prio', 'AssignedTo', 'Subtasks'];
    editableFields.forEach(field => {
        const dataDiv = document.getElementById(`popup${field}`);
        const input = document.getElementById(`popup${field}Input`);
        const label = document.querySelector(`label[for='popup${field}Input']`);
        const container = document.getElementById(`popup${field}Container`);

        if (input && dataDiv && label) {
            dataDiv.classList.remove('d-none');
            input.classList.add('d-none');
            // label.classList.add('d-none');
            if (container) {
                container.classList.add('d-none');
            }
        }
    });

    const subtaskInput = document.getElementById('popupSubtasksInput');
    const subtaskLabel = document.querySelector('label[for="popupSubtasksInput"]');
    if (subtaskInput && subtaskLabel) {
        subtaskInput.classList.add('d-none');
        subtaskLabel.classList.add('d-none');
    }
}

/**
 * Triggers the display of a window to add a new task.
 * @returns {void}
 */
function addNewTask() {
    document.body.classList.add('overflow-hidden');
    document.getElementById('show-addTaskInclude').innerHTML = /*html*/ `
        <div w3-include-html="add-TaskInclude.html" ></div>`;
    includeHTMLaddTask();
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
        if (resp.ok) {
            element.innerHTML = await resp.text();
        } else {
            element.innerHTML = 'Page not found';
        }
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


function editTask(firebaseTaskId) {
    const task = tasksGlobal[firebaseTaskId];
    if (!task) {
        console.error('Task not found!', firebaseTaskId);
        return;
    }
    toggleFields(['Category', 'Title', 'Description', 'DueDate', 'Prio', 'AssignedTo', 'Subtasks']);
    changePriority(task.priority);

    const subtasksElement = document.getElementById('subtasksContainer');
    const subtaskButtons = subtasksElement.querySelectorAll('.remove-subtask');
    subtaskButtons.forEach(button => button.classList.remove('d-none'));

    const taskOptionsDiv = document.getElementById('taskOptions');
    taskOptionsDiv.innerHTML = `<button onclick="saveTask('${firebaseTaskId}')" class="save-btn">Save Changes</button>`;

    // Ensure current assignee is selected
    fetchAccountsAndFillDropdown(task.assigneeId); 
}


/**
 * Helferfunktion zum Umschalten zwischen Anzeige- und Bearbeitungsmodi für die angegebenen Felder.
 * @param {Array} fields - Feldnamen, die umgeschaltet werden sollen.
 */
function toggleFields(fields) {
    fields.forEach(field => {
        const dataDiv = document.getElementById(`popup${field}`);
        const input = document.getElementById(`popup${field}Input`);
        const label = document.querySelector(`label[for='popup${field}Input']`);
        const container = document.getElementById(`popup${field}Container`);

        if (dataDiv && input && label) {
            if (dataDiv.classList.contains('d-none')) {
                // Wechsel zu Anzeigemodus
                dataDiv.classList.remove('d-none');
                input.classList.add('d-none');
                label.classList.add('d-none');
                if (container) {
                    container.classList.add('d-none');
                }
            } else {
                // Wechsel zu Bearbeitungsmodus
                input.value = dataDiv.textContent.trim(); // Priorität kann ein spezieller Fall sein
                if (input.tagName.toLowerCase() === 'select') {
                    Array.from(input.options).forEach(option => {
                        if (option.text === dataDiv.textContent.trim()) {
                            option.selected = true;
                        }
                    });
                }
                dataDiv.classList.add('d-none');
                input.classList.remove('d-none');
                label.classList.remove('d-none');
                if (container) {
                    container.classList.remove('d-none');
                }
            }
        } else {
            console.error(`One or more elements for field '${field}' are missing in the DOM.`);
        }
    });
    toggleSubtasksInput()
}

function toggleSubtasksInput() {
    const input = document.getElementById('popupSubtasksInput');
    const label = document.querySelector('label[for="popupSubtasksInput"]');

    if (input && label) {
        if (input.classList.contains('d-none')) {
            // Wechsel zu Bearbeitungsmodus
            input.classList.remove('d-none');
            label.classList.remove('d-none');
        } else {
            // Wechsel zu Anzeigemodus
            input.classList.add('d-none');
            label.classList.add('d-none');
        }
    } else {
        console.error('One or more elements for subtasks input are missing in the DOM.');
    }
}

/**
 * Saves updates to an existing task to the backend.
 * @param {string} firebaseTaskId - The unique identifier for the task being updated.
 * @returns {Promise<void>} A promise that resolves when the task has been updated.
 */
async function saveTask(firebaseTaskId) {
    try {
        let apiUrl = await importConfig();
        const assigneeId = document.getElementById('popupAssignedToInput').value;
        const accountResponse = await fetchToBackend(`${apiUrl}/api/accounts/${assigneeId}`);
        const user = await accountResponse.json();
        const assignee = `${user.firstName} ${user.lastName}`;

        let updatedTaskData = {
            title: document.getElementById('popupTitleInput').value,
            description: document.getElementById('popupDescriptionInput').value,
            dueDate: document.getElementById('popupDueDateInput').value,
            assignee,
            category: document.getElementById('popupCategoryInput').value,
            priority: document.getElementById('input-prio').innerHTML,
            subTasks: editingSubtasks
        };

        let fetchUrl = `${apiUrl}/api/edit-task/${firebaseTaskId}`;
        const csrfToken = await getCsrfToken();
        const response = await fetch(fetchUrl, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`},
            credentials: 'include',
            body: JSON.stringify(updatedTaskData)
        });

        if (!response.ok) {
            throw new Error('Failed to save task updates');
        }

        closePopup();
        closeDeletePopup();
        clearTaskDisplay();
        resetInputFields();
        await fetchTasks(); 
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Error saving task details.');
    }
}

let taskToDelete = null;

function showDeletePopup(firebaseTaskId) {
    taskToDelete = firebaseTaskId;
    document.getElementById('deleteTaskPopup').classList.remove('d-none');
    document.getElementById('deleteOverlay').classList.remove('d-none')
}

function confirmDelete() {
    if (taskToDelete) {
        deleteTask(taskToDelete);
        taskToDelete = null;
    }
    closeDeletePopup();
}

/**
 * Fetches user accounts from the server and populates the dropdown for task assignment.
 * @param {string} currentAssignee - The ID of the currently assigned user.
 * @returns {Promise<void>} A promise that resolves when accounts have been fetched and the dropdown is populated.
 */
async function fetchAccountsAndFillDropdown(currentAssignee) {
    try {
        const csrfToken = await getCsrfToken();
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/accounts`;

        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch accounts');
        }

        const accounts = await response.json();
        const select = document.getElementById('popupAssignedToInput');
        if (!select) {
            console.error('Dropdown element not found');
            return;
        }

        select.innerHTML = '';
        Object.keys(accounts).forEach(key => {
            const user = accounts[key];
            const option = new Option(`${user.firstName} ${user.lastName}`, key);
            select.appendChild(option);
        });

        // Setzen Sie den aktuellen zugewiesenen Benutzer als den ausgewählten Wert
        if (currentAssignee && accounts[currentAssignee]) {
            select.value = currentAssignee;
        } else {
            console.error('Assigned user ID not found in the options');
        }
    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
}

/**
 * Deletes a task from the backend.
 * @param {string} firebaseTaskId - The unique identifier for the task being deleted.
 * @returns {Promise<void>} A promise that resolves when the task has been deleted.
 */
async function deleteTask(firebaseTaskId) {
    try {
        let apiUrl = await importConfig();
        const csrfToken = await getCsrfToken();

        let fetchUrl = `${apiUrl}/api/delete-task/${firebaseTaskId}`;
        const response = await fetch(fetchUrl, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`},
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        closePopup();
        closeDeletePopup();
        clearTaskDisplay();
        await fetchTasks(); 
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task.');
    }
}

/**
 * Clears the task display in all sections.
 * @returns {void}
 */
function clearTaskDisplay() {
    document.getElementById('todo-box').innerHTML = '';
    document.getElementById('inprogress-box').innerHTML = '';
    document.getElementById('feedback-box').innerHTML = '';
    document.getElementById('done-box').innerHTML = '';
}

function closeDeletePopup() {
    let popupElement = document.getElementById('deleteTaskPopup');
    if (popupElement) {
        popupElement.classList.add('d-none');
        document.getElementById('deleteOverlay').classList.add('d-none')
    }
}

/**
 * Updates the priority settings for a task based on user interaction, adjusting the UI to reflect the current priority.
 * @param {string} prio - The priority level to set ('urgent', 'medium', 'low').
 */
function changePriority(prio) {
    setPriority('urgent', prio, '#ff3d00', 'prio-urgent-white.png');
    setPriority('medium', prio, '#ffa800', 'prio-medium-white.png');
    setPriority('low', prio, '#7ae229', 'prio-low-white.png');
    document.getElementById('input-prio').innerHTML = prio;
}

function setPriority(currentPrio, selectedPrio, bgColor, imgName) {
    let button = document.getElementById(`prio-${currentPrio}`);
    let img = document.getElementById(`img-prio-${currentPrio}`);
    if (currentPrio === selectedPrio) {
        button.style.background = bgColor;
        button.style.color = '#ffffff';
        img.src = `./assets/img/${imgName}`;
    } else {
        button.style.background = '';
        button.style.color = 'black';
        img.src = `./assets/img/prio-${currentPrio}-solo.png`;
    }
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