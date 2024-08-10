/**
 * Fetches initial data and hides the loader once data is loaded.
 * @returns {Promise<void>} A promise that resolves when initial data is fetched.
 */
async function fetchInitialData() {
    showLoader();
    try {
        await fetchTasks();
        hideLoader();
    } catch (error) {
        console.error('Error fetching initial data:', error);
        hideLoader();
    } finally {
        hideLoader();
    }
}

function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'block';
    }
}

/**
 * Fetches tasks from the server and stores them in a global object.
 * @returns {Promise<void>} A promise that resolves when tasks are fetched and processed.
 */
async function fetchTasks() {

    try {
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/tasks`;
        const response = await fetchToBackend(fetchUrl, 'GET');
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        const result = await response.json();
        tasksGlobal = {};
        Object.keys(result.tasks).forEach(firebaseTaskId => {
            const task = result.tasks[firebaseTaskId];
            
            if (task.assigneeId) {
                const assigneeResponse =  fetchToBackend(`${apiUrl}/api/accounts/${task.assigneeId}`, 'GET');
                const assignee =  assigneeResponse.json();
                task.assignee = `${assignee.firstName} ${assignee.lastName}`;
                task.profileColor = assignee.color;
            }
            tasksGlobal[firebaseTaskId] = task;
        });
        displayTasks(tasksGlobal);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

/**
 * Function for opening a task and displaying the task details as popup.
 * @param {string} firebaseTaskId - Specific ID of the task you want to open.
 * @returns {void}
 */
let tasksGlobal = {};
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
    const categoryMap = { technicalTask: "Technical Task", userStory: "User Story" };
    
    popupCategoryDiv.textContent = categoryMap[task.category] || task.category;
    popupCategoryDiv.className = task.category === 'technicalTask' ? 'technicalTask' : 'userStory';
    const priorityUrl = getPriorityUrl(task.priority);
    document.getElementById('popupPrio').innerHTML = `${task.priority} <img src="${priorityUrl}">`;
    document.getElementById('popupAssignedTo').textContent = task.assigneeNames ? task.assigneeNames : 'No one assigned';

    const taskPopupElement = document.getElementById('taskPopup');
    let hiddenInput = document.getElementById('popupTaskId');
    if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'popupTaskId';
        taskPopupElement.appendChild(hiddenInput);
    }
    hiddenInput.value = firebaseTaskId;

    const taskOptionsDiv = document.getElementById('taskOptions');
    taskOptionsDiv.innerHTML = `<div id="taskDelete" onclick="showDeletePopup('${firebaseTaskId}')"><img src="./assets/img/delete.png" alt="delete task"> Delete</div>
        <div id="editTask" onclick="editTask('${firebaseTaskId}')"><img src="./assets/img/edit.png" alt="edit task"> Edit</div>
    `;
    editingSubtasks = task.subTasks || [];
    updateSubtaskList(firebaseTaskId);

    document.getElementById('taskPopup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

/**
 * Deletes a task from the backend.
 * @param {string} firebaseTaskId - The unique identifier for the task being deleted.
 * @returns {Promise<void>} A promise that resolves when the task has been deleted.
 */
async function deleteTask(firebaseTaskId) {
    try {
        let apiUrl = await importConfig();
        let response = await fetchToBackend(`${apiUrl}/api/delete-task/${firebaseTaskId}`, 'DELETE'); 
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

function toggleUserr(label) {
    let checkbox = label.querySelector('input[type="checkbox"]');
    let userFullName = checkbox.getAttribute('data-name');

    checkbox.checked = !checkbox.checked;
    if (checkbox.checked) {
        if (!toAssignUser.includes(userFullName)) {
            toAssignUser.push(userFullName); // Füge den Nutzer hinzu, wenn noch nicht vorhanden
        }
        label.classList.add("selected");
        label.style.color = "white";
    } else {
        const index = toAssignUser.indexOf(userFullName);
        if (index > -1) {
            toAssignUser.splice(index, 1); // Entferne den Nutzer, wenn vorhanden
        }
        label.classList.remove("selected");
        label.style.color = "black";
    }
}


/**
 * Edits an existing task by enabling field modifications and updating UI components.
 * Toggles field visibility for editing and sets up the environment to save changes.
 * Fetches and verifies user ID based on the task's assigned user.
 * @param {string} firebaseTaskId - The Firebase ID of the task to be edited.
 */
async function editTask(firebaseTaskId) {
    const task = tasksGlobal[firebaseTaskId];
    if (!task) {
        console.error('Task not found!', firebaseTaskId);
        return;
    }
    toggleFields(['Category', 'Title', 'Description', 'DueDate', 'Prio']);
    changePriority(task.priority);

    document.getElementById('subtasksContainer').querySelectorAll('.remove-subtask').forEach(button => button.classList.remove('d-none'));
    document.getElementById('subtasksContainer').querySelectorAll('.checkbox-subtask').forEach(button => button.classList.add('d-none'));

    const taskOptionsDiv = document.getElementById('taskOptions');
    taskOptionsDiv.innerHTML = `<button onclick="saveTask('${firebaseTaskId}')" class="save-btn">Save Changes</button>`;

    // Korrekte Initialisierung des toAssignUser Arrays
    toAssignUser = task.assigneeNames ? [...task.assigneeNames] : []; 
    await fetchAccountsAndFillDropdown();
    setupCheckboxHandlers();
    synchronizeCheckboxesWithArray();
}


function synchronizeCheckboxesWithArray() {
    const checkboxes = document.querySelectorAll('#dropdownContent input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const userFullName = checkbox.getAttribute('data-name');
        checkbox.checked = toAssignUser.includes(userFullName);
        const label = checkbox.closest('div');
        if (checkbox.checked) {
            label.classList.add("selected");
            label.style.color = "white";
        } else {
            label.classList.remove("selected");
            label.style.color = "";
        }
    });
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

/**
 * Sets the visual priority state for a task's priority button based on selection.
 * Changes the background color, text color, and image source of the priority button.
 * @param {string} currentPrio - The current priority level (e.g., 'low', 'medium', 'urgent').
 * @param {string} selectedPrio - The selected priority level to compare with the current.
 * @param {string} bgColor - The background color to set if currentPrio equals selectedPrio.
 * @param {string} imgName - The image filename to use if currentPrio equals selectedPrio.
 */
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
 * Removes a subtask from a task in the global task list and requests backend to update.
 * Updates both the subtasks list and their checked status.
 * If successful, refreshes the task display; otherwise logs and alerts the error.
 * @param {string} taskId - The ID of the task.
 * @param {number} subtaskIndex - The index of the subtask to be removed.
 */
async function removeSubtask(firebaseTaskId, subtaskIndex) {
    const task = tasksGlobal[firebaseTaskId];
    if (!task) {
        console.error('Task not found!', firebaseTaskId);
        return;
    }
    task.subTasks.splice(subtaskIndex, 1); 
    try {
        let apiUrl = await importConfig();
        let response = await fetchToBackend(`${apiUrl}/api/edit-task/${firebaseTaskId}`, 'PATCH', JSON.stringify({ subTasks: task.subTasks }));

        if (!response.ok) {
            throw new Error('Failed to update subtasks');
        }
        await fetchTasks();
        openTask(firebaseTaskId);
    } catch (error) {
        console.error('Error updating subtasks:', error);
    }
}

/**
 * Removes a subtask from a task in the global task list and requests backend to update.
 * Updates both the subtasks list and their checked status.
 * If successful, refreshes the task display; otherwise logs and alerts the error.
 * @param {string} taskId - The ID of the task.
 * @param {number} subtaskIndex - The index of the subtask to be removed.
 */
async function removeSubtask(taskId, subtaskIndex) {
    try {
        let apiUrl = await importConfig();
        let response = await fetchToBackend(`${apiUrl}/api/remove-subtask/${taskId}/${subtaskIndex}`, 'PATCH');
        if (!response.ok) {
            throw new Error('Failed to remove subtask');
        }
        tasksGlobal[taskId].subTasks.splice(subtaskIndex, 1);
        tasksGlobal[taskId].subTasksChecked.splice(subtaskIndex, 1);
        openTask(taskId);
    } catch (error) {
        console.error('Error removing subtask:', error);
        alert('Error removing subtask.');
    }
}

/**
 * Saves updates to an existing task to the backend.
 * @param {string} firebaseTaskId - The unique identifier for the task being updated.
 * @returns {Promise<void>} A promise that resolves when the task has been updated.
 */
async function saveTask(firebaseTaskId) {
    updateAssigneesFromCheckboxes();
    try {
        let updatedTaskData = {
            title: document.getElementById('popupTitleInput').value,
            description: document.getElementById('popupDescriptionInput').value,
            dueDate: document.getElementById('popupDueDateInput').value,
            assigneeNames: toAssignUser,
            category: document.getElementById('popupCategoryInput').value,
            priority: document.getElementById('input-prio').innerHTML,
            subTasks: editingSubtasks
        };
        const apiUrl = await importConfig();
        let response = await fetchToBackend(`${apiUrl}/api/edit-task/${firebaseTaskId}`, 'PATCH', JSON.stringify(updatedTaskData))
        if (!response.ok) {
            throw new Error('Failed to save task updates');
        }

        closePopup();
        closeDeletePopup();
        clearTaskDisplay();
        resetInputFields();
        document.getElementById('popupSubtasksInput').classList.add('d-none');
        document.querySelector(`label[for='popupSubtasksInput']`).classList.add('d-none');
        await fetchTasks(); 
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Error saving task details.');
    }
}

function updateAssigneesFromCheckboxes() {
    const checkboxes = document.querySelectorAll('#dropdownContent input[type="checkbox"]');
    toAssignUser = Array.from(checkboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.getAttribute('data-name'));
}

async function getProfileColor(firstName, lastName) {
    try {
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/accounts`;
        let response = await fetchToBackend(fetchUrl, 'GET');
        if (!response.ok) {
            throw new Error('Failed to fetch accounts');
        }
        let accounts = await response.json();
        for (let accountKey in accounts) {
            let account = accounts[accountKey];
            if (account.firstName === firstName && account.lastName === lastName) {
                return account.profileColor;
            }
        }
    } catch(e) {
        console.error('Error while fetching profile color:', e);
        return null;  // Es ist sinnvoll, null oder einen Default-Wert hier zurückzugeben
    }
    return null; // Gibt null zurück, wenn kein passender Eintrag gefunden wurde
}