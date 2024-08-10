
/**
 * Listens for the 'sidebarLoaded' event and adds the 'sidebar-active' class
 * to the 'sidebarAddTask' element once the sidebar has been fully loaded.
 * This highlights the 'sidebarAddTask' element as active, indicating that it
 * is the current page or focus within the application.
 *
 * @event sidebarLoaded
 * @listens sidebarLoaded - Triggers when the sidebar content is fully loaded and ready.
 */
document.addEventListener('sidebarLoaded', function() {
    document.getElementById('sidebarAddTask').classList.add('sidebar-active');
});

/**
 * Initializes event listeners on DOMContentLoaded for handling task addition and managing subtask input.
 */
document.addEventListener('DOMContentLoaded', function() {
    let subTasks = [];

    document.getElementById('subtaskInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            let subtaskValue = event.target.value.trim();
            if (subtaskValue) {
                subTasks.push(subtaskValue);
                event.target.value = '';
                updateSubtaskList();
            }
        }
    });

    /**
    * Updates the list of subtasks in the UI.
    */
    function updateSubtaskList() {
        document.getElementById('subtaskList').innerHTML = '';
        subTasks.forEach(subtask => {
            let p = document.createElement('li');
            p.textContent = subtask;
            document.getElementById('subtaskList').appendChild(p);
        });
    }
    
    document.getElementById('add-task').addEventListener('submit', async function(event) {
        event.preventDefault();
    
        let title = document.getElementById('title').value.trim();
        let description = document.getElementById('description').value.trim();
        let dueDate = document.getElementById('date').value.trim();
        let assigneeNames = toAssignUser;
        let category = document.getElementById('categorySelect').value.trim();
        let priority = document.getElementById('input-prio').innerHTML.trim();
        let subTasksString = subTasks.join(', ');
    
        if (!title || !description || !dueDate || !assigneeNames || !category || !priority) {
            alert('All fields are required.');
            return;
        }
    
        let taskData = {
            title, 
            description, 
            dueDate, 
            assigneeNames,
            category, 
            priority, 
            subTasks: subTasksString
        };
    
        try {
            let apiUrl = await importConfig();
            let response = await fetchToBackend(`${apiUrl}/api/add-task`, 'POST', JSON.stringify(taskData), {
                headers: {'Content-Type': 'application/json'}
            });
    
            let result = await response.json();
            if (response.ok) {
                setSuccessMessage('Task added successfully');
                clearAllFields();
                clearSubtaskList();
                resetAllCheckboxes();
            } else {
                alert(`Failed to add task: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task due to an internal error');
        }
    });

    /**
     * Clears all subtasks from the list and updates the UI accordingly.
     */   
    function clearSubtaskList() {
        subTasks = [];
        updateSubtaskList();
    }
    fetchAccountsAndFillDropdown();
});

/**
 * Resets all checkboxes within the dropdown and clears the list of selected users.
 */
function resetAllCheckboxes() {
    let checkboxes = document.querySelectorAll('#dropdownContent input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    document.getElementById('selectedUsers').innerHTML = ``;
    toAssignUser = [];

    let selectedElements = Array.from(document.getElementsByClassName('selected'));
    selectedElements.forEach(element => {
        element.classList.remove('selected');
        if (element.style) {
            element.style.color = "black";
        }
    });
}

/**
 * Clears all input fields related to task creation.
 */
function clearAllFields() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('date').value = '';
    subTasks = [];
    document.getElementById('subtaskList').innerHTML = '';
    // window.location.href = './add-task.html';
}

document.addEventListener('DOMContentLoaded', function() {
    fetchAccountsAndFillDropdown();
});

/**
 * Closes the task addition interface and cleans up by clearing related content and resetting UI elements.
 */
function closeIncludeAddTask() {
    document.getElementById('show-addTaskInclude').innerHTML = '';
    if (includeBoard) {
        onloadBoard();
        includeBoard = false;
        document.body.classList.remove('overflow-hidden');
        document.getElementById('show-AddTask-Background').classList = 'show-Task-Background d-none';
    }

    if (includeContacts) {
        includeContacts = false;
        document.body.classList.remove('overflow-hidden');
        document.getElementById('show-Contacts-Background').classList = 'show-Contact-Background d-none';
    }
}

/**
 * Updates the priority settings for a task based on user interaction, adjusting the UI to reflect the current priority.
 * @param {string} prio - The priority level to set ('urgent', 'medium', 'low').
 */
function changePriority(prio) {
    if (prio === "urgent") {
        document.getElementById('prio-urgent').style.background = '#ff3d00';
        document.getElementById('prio-urgent').style.color = '#ffffff';
        document.getElementById('img-prio-urgent').src = './assets/img/prio-urgent-white.png';
        document.getElementById('input-prio').innerHTML = 'urgent';
        resetButtons("prio-medium", "prio-low");
    } else if (prio === "medium") {
        document.getElementById('prio-medium').style.background = '#ffa800';
        document.getElementById('prio-medium').style.color = '#ffffff';
        document.getElementById('img-prio-medium').src = './assets/img/prio-medium-white.png';
        document.getElementById('input-prio').innerHTML = 'medium';
        resetButtons("prio-urgent", "prio-low");
    } else if (prio === "low") {
        document.getElementById('prio-low').style.background = '#7ae229';
        document.getElementById('prio-low').style.color = '#ffffff';
        document.getElementById('img-prio-low').src = './assets/img/prio-low-white.png';
        document.getElementById('input-prio').innerHTML = 'low';
        resetButtons("prio-medium", "prio-urgent");
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