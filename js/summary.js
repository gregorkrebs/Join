
/**
 * Listens for the 'sidebarLoaded' event and adds the 'sidebar-active' class
 * to the 'sidebarSummary' element once the sidebar has been fully loaded.
 * This highlights the 'sidebarSummary' element as active, indicating that it
 * is the current page or focus within the application.
 *
 * @event sidebarLoaded
 * @listens sidebarLoaded - Triggers when the sidebar content is fully loaded and ready.
 */
document.addEventListener('sidebarLoaded', function() {
    document.getElementById('sidebarSummary').classList.add('sidebar-active');
});

/**
 * Hides the loading indicator from the user interface.
 */
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Document ready function to trigger initial data fetching.
 */
document.addEventListener('DOMContentLoaded', 
function() { 
    fetchInitialData();
});

/**
 * Additional document ready function that initializes a summary of the user session and potentially other startup tasks.
 */
document.addEventListener('DOMContentLoaded', onloadSummary);

/**
 * Initializes the application by checking user status and setting up a greeting based on user data.
 * Redirects if the user is not logged in.
 * @returns {Promise<void>} A promise that resolves when the user status check is complete.
 */
async function onloadSummary() {
    let apiUrl = await importConfig();
    let fetchUrl = `${apiUrl}/api/status`;
    const response = await fetch(fetchUrl, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.loggedIn) {
            let greetingElement = document.getElementById('board-greeting');
            greetingElement ? greetingElement.textContent = `${data.firstName} ${data.lastName}` : console.log("Element 'board-greeting' not found");
            let dateTime = getDaytime();
            document.getElementById('board-time').innerHTML = `${dateTime},`;
        } else {
            console.log("Not logged in");
        }
    })
    .catch(error => console.error('Error fetching user data:', error));
}
/**
 * Fetches the total number of tasks and updates the display accordingly.
 * @returns {Promise<void>} A promise that resolves when the task count has been fetched and displayed.
 */
async function fetchTotalTasks() {
    try {
        const data = await fetchTasks();
        data.total !== undefined ? document.getElementById('tasks-in-board').textContent = `${data.total}` : document.getElementById('tasks-in-board').textContent = '0';
    } catch (error) {
        console.error('Error fetching total tasks:', error);
        document.getElementById('tasks-in-board').textContent = '0';
    }
}

/**
 * Fetches the total number of tasks that are currently in progress and updates the display.
 * @returns {Promise<void>} A promise that resolves when the in-progress task count has been fetched and displayed.
 */
async function fetchInProgressTotalTasks() {
    try {
        const result = await fetchTasks();

        const tasks = result.tasks || {};
        let inProgressCount = 0;

        // Durchgehen aller Tasks und Zählen derjenigen mit dem Status 'in-progress'
        Object.values(tasks).forEach(task => {
            if (task.state === 'in-progress') {
                inProgressCount++;
            }
        });

        // Anzeigen der Anzahl der 'in-progress' Tasks
        document.getElementById('tasks-in-progress').textContent = inProgressCount;
    } catch (error) {
        console.error('Error fetching total tasks:', error);
        document.getElementById('tasks-in-progress').textContent = '0';
    }
}

/**
 * Fetches the total number of tasks that are awaiting feedback and updates the display.
 * @returns {Promise<void>} A promise that resolves when the awaiting feedback task count has been fetched and displayed.
 */
async function fetchAwaitingFeedbackTotalTasks() {
    try {
        const result = await fetchTasks();

        const tasks = result.tasks || {};
        let awaitingFeedbackCount = 0;

        Object.values(tasks).forEach(task => {
            if (task.state === 'awaiting-feedback') {
                awaitingFeedbackCount++;
            }
        });

        document.getElementById('tasks-awaiting-feedback').textContent = awaitingFeedbackCount;
    } catch (error) {
        console.error('Error fetching total tasks:', error);
        document.getElementById('tasks-awaiting-feedback').textContent = '0';
    }
}

/**
 * Fetches the total number of tasks that are marked as done and updates the display.
 * @returns {Promise<void>} A promise that resolves when the done task count has been fetched and displayed.
 */
async function fetchDoneTotalTasks() {
    try {
        const result = await fetchTasks();

        const tasks = result.tasks || {};
        let doneCount = 0;

        Object.values(tasks).forEach(task => {
            if (task.state === 'done') {
                doneCount++;
            }
        });

        document.getElementById('tasks-done').textContent = doneCount;
    } catch (error) {
        console.error('Error fetching total tasks:', error);
        document.getElementById('tasks-done').textContent = '0';
    }
}

/**
 * Fetches the total number of tasks that are marked as todo and updates the display.
 * @returns {Promise<void>} A promise that resolves when the todo task count has been fetched and displayed.
 */
async function fetchToDoTotalTasks() {
    try {
        const result = await fetchTasks();
        
        const tasks = result.tasks || {};
        let todoCount = 0;

        Object.values(tasks).forEach(task => {
            if (task.state === 'todo') {
                todoCount++;
            }
        });

        document.getElementById('tasks-todo').textContent = todoCount;
    } catch (error) {
        console.error('Error fetching total tasks:', error);
        document.getElementById('tasks-todo').textContent = '0';
    }
}

/**
 * Fetches the total number of urgent tasks and updates the display.
 * @returns {Promise<void>} A promise that resolves when the urgent task count has been fetched and displayed.
 */
async function fetchUrgentTasks() {
    try {
        const result = await fetchTasks();
        
        const tasks = result.tasks || {};
        let urgentCount = 0;

        Object.values(tasks).forEach(task => {
            if (task.priority === 'urgent') {
                urgentCount++;
            }
        });

        document.getElementById('urgent-count').textContent = urgentCount;
    } catch (error) {
        console.error('Error fetching total tasks:', error);
        document.getElementById('urgent-count').textContent = '0';
    }
}

/**
 * Fetches tasks and determines the next upcoming deadline among them.
 * @returns {Promise<void>} A promise that resolves when the task with the nearest deadline is identified and displayed.
 */
async function fetchNextUpcomingDeadlineTask() {
    try {
        let apiUrl = await importConfig();
        const response = await fetchToBackend(`${apiUrl}/api/tasks`);

        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }

        const result = await response.json();
        const tasks = result.tasks || {};
        let earliestDueDate = null;
        const now = new Date();

        Object.values(tasks).forEach(task => {
            if ((task.state === 'todo' || task.state === 'in-progress') && task.dueDate) {
                const taskDueDate = new Date(task.dueDate);
                // Ensure the task due date is in the future
                if (taskDueDate > now && (!earliestDueDate || taskDueDate < earliestDueDate)) {
                    earliestDueDate = taskDueDate;
                }
            }
        });

        // Format the earliest due date for display, if one is found that's in the future
        let displayDate = 'No upcoming deadlines';
        if (earliestDueDate) {
            displayDate = earliestDueDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        document.getElementById('NextUpcomingDeadline').textContent = displayDate;
    } catch (error) {
        console.error('Error fetching the next upcoming deadline task:', error);
        document.getElementById('NextUpcomingDeadline').textContent = 'Error fetching data';
    }
}

/**
 * Redirects the user to the board page.
 */
function redirectToBoard() {
    window.location.href = './board.html';
}

/**
 * Fetches all tasks from the server. This function is a helper used by other specific fetching functions.
 * @returns {Promise<Object>} A promise that resolves to the tasks data.
 */
async function fetchTasks() {
    try {
        let apiUrl = await importConfig();
        const response = await fetchToBackend(`${apiUrl}/api/tasks`);
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        return response.json();
    } catch(error) {
        console.error("Fehler beim Abrufen der Tasks")
    }
}

/**
 * Saves the authentication token in local storage and redirects the user to a protected route.
 * @param {Object} data - Data containing the authentication token.
 */
function saveTokenAndRedirect(data) {
    localStorage.setItem('token', data.token);
    window.location.href = '/some-protected-route.html'; // Weiterleitung zum geschützten Bereich
}

/**
 * Fetches and processes initial task-related data when the application starts.
 * @returns {Promise<void>} A promise that resolves when all initial data has been fetched and displayed.
 */
async function fetchInitialData() {
    try {
        await fetchTotalTasks();
        await fetchInProgressTotalTasks();
        await fetchAwaitingFeedbackTotalTasks();
        await fetchDoneTotalTasks();
        await fetchNextUpcomingDeadlineTask();
        await fetchUrgentTasks();
        await fetchToDoTotalTasks();
        hideLoader();
    } catch (error) {
        console.error('Error fetching initial data:', error);
        hideLoader();
    }
}

/**
 * Changes the image source of an HTML element to a hover image when the user interacts with it.
 * @param {string} id - The DOM element ID.
 * @param {string} hoverImg - The source path of the hover image.
 * @param {string} standardImg - The source path of the standard image.
 */
function changeImg(id, hoverImg, standardImg) {
    let img = document.getElementById(`${id}`);
    img.src = `${standardImg}` ? img.src = `${hoverImg}` : img.src = `${standardImg}`;
}

/**
 * Reverts the image source of an HTML element from a hover image back to the standard image.
 * @param {string} id - The DOM element ID.
 * @param {string} hoverImg - The source path of the hover image.
 * @param {string} standardImg - The source path of the standard image.
 */
function changeImgBack(id, hoverImg, standardImg) {
    let img = document.getElementById(`${id}`);
    if (img.src = `${hoverImg}`) {
        img.src = `${standardImg}`;
    }
}

/**
 * Gets the current daytime greeting based on the current hour.
 * @returns {string} The appropriate greeting for the current time of day.
 */
function getDaytime() {
    const today = new Date();
    let currentHour = today.getHours();
    
    let res = (currentHour > 5 && currentHour < 10) ? "Good morning" :
              (currentHour >= 10 && currentHour < 15) ? "Good noon" :
              (currentHour >= 15 && currentHour < 18) ? "Good afternoon" :
              (currentHour >= 18 && currentHour < 22) ? "Good evening" :
              "Good night";
    
    return res;
}