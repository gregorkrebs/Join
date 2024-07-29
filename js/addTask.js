/**
 * Fetches the CSRF token required for making secure requests to the server.
 * @returns {Promise<string>} A promise that resolves to the CSRF token.
 */
async function getCsrfToken() {
    let apiUrl = await importConfig();
    let fetchUrl = `${apiUrl}/api/form`;
    const csrfResponse = await fetch(fetchUrl, {
        credentials: 'include'
    });
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    return csrfToken;
}

/**
 * Attaches event listeners to handle the task submission form. Prevents the default form submission
 * and manually handles data collection, validation, and submission.
 */
document.addEventListener('DOMContentLoaded', function() {
    let subTasks = [];

    document.getElementById('subtaskInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const subtaskValue = event.target.value.trim();
            if (subtaskValue) {
                subTasks.push(subtaskValue);
                event.target.value = '';
                updateSubtaskList();
            }
        }
    });

    function updateSubtaskList() {
        document.getElementById('subtaskList').innerHTML = '';
        subTasks.forEach(subtask => {
            const p = document.createElement('li');
            p.textContent = subtask;
            document.getElementById('subtaskList').appendChild(p);
        });
    }
    
    document.getElementById('add-task').addEventListener('submit', async function(event) {
        event.preventDefault(); // Verhindert das Standardformular-Submit-Verhalten
    
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const dueDate = document.getElementById('date').value;
        const assignee = document.getElementById('userSelect').value;
        const category = document.getElementById('categorySelect').value;
        const prio = document.getElementById('input-prio').innerHTML;
        const subTasksString = subTasks.join(', ');
    
        if (!title || !description || !dueDate || !assignee || !category || !prio) {
            console.log({ title, description, dueDate, assignee, category, prio });
            alert('All fields are required');
            return;
        }
    
        const taskData = {
            title: title,
            description: description,
            dueDate: dueDate,
            assignee: assignee,
            category: category,
            priority: prio,
            subTasks: subTasksString
        };
    
        try {
            const csrfToken = await getCsrfToken();
            let apiUrl = await importConfig();
            let fetchUrl = `${apiUrl}/api/add-task`;
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfToken,
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                body: JSON.stringify(taskData)
            });
    
            const result = await response.json();
            if (response.ok) {
                alert('Task added successfully');
                clearAllFields();
                clearSubtaskList();  // Leert das Subtasks-Array nach dem Absenden
            } else {
                alert('Failed to add task: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task due to an internal error');
        }
    }); 

    function clearSubtaskList() {
        subTasks = [];
        updateSubtaskList();
    }

    fetchAccountsAndFillDropdown();
});


/**
 * Clears all input fields related to task creation.
 */
function clearAllFields() {
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('date').value = '';
    subTasks = [];
    document.getElementById('subtaskList').innerHTML = '';
    window.location.href = './add-task.html';
}

/**
 * Fetches user accounts from the server and populates the dropdown for task assignment.
 * @returns {Promise<void>} A promise that resolves when accounts have been fetched and the dropdown is populated.
 */
async function fetchAccountsAndFillDropdown() {
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
        const select = document.getElementById('userSelect');
        select.innerHTML = '';

        Object.keys(accounts).forEach(key => {
            const user = accounts[key];
            let option = new Option(`${user.firstName} ${user.lastName}`, key);
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
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