/**
 * Retrieves a CSRF token from the server configuration.
 * @returns {Promise<string>} A promise that resolves to the CSRF token string.
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
 * Performs a backend fetch operation using the provided URL and method, incorporating CSRF protection.
 * This function automatically retrieves a CSRF token and includes it in the request headers.
 * @param {string} fetchUrl - The URL to fetch from the backend.
 * @param {string} usedMethod - The HTTP method to use for the request, e.g., 'POST', 'GET'.
 * @param {string} sendedBody - The body of the request, typically a JSON string for methods like POST.
 * @returns {Promise<Response>} A promise that resolves to the response of the fetch operation.
 */
async function fetchToBackend(fetchUrl, usedMethod, sendedBody) {
    const csrfToken = await getCsrfToken();
    let response = await fetch(fetchUrl, {
        method: usedMethod,
        headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`},
        credentials: 'include',
        body: sendedBody
    });
    return response;
}

/**
 * Checks the user's login status by making a request to the server and evaluates the response.
 * Redirects to the login page if the user is not logged in or if there are errors during the status check.
 * Additionally, updates UI elements based on the user's profile information if logged in.
 * @returns {Promise<void>} A promise that resolves when the login status check is complete.
 */
async function checkLoginStatus() {
    try {
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/status`;
        const response = await fetch(fetchUrl, {
            credentials: 'include'
        });

        if (!response.ok) {
            console.error('Fehler beim Überprüfen des Anmeldestatus: Ungültiger Statuscode:', response.status);
            window.location.href = '/login.html';
            return;
        }

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data.loggedIn) {
                document.getElementById('profile-actions').style.borderColor = data.profileColor;

                // let imagePath = `./../assets/profiles/${data.email.replace("@", "_at_")}/profile.jpg`;

                // let img = new Image();
                // img.src = imagePath;
                // img.onload = function() {
                //     document.getElementById('profile-actions').innerHTML = `<img id="profile-picture" src="${imagePath}" alt="Profile picture">`;
                //     document.body.style.display = 'block';
                
                // }
                // img.onerror = function() {

                // }
                let initials = `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase();
                document.body.style.display = 'block';
                document.getElementById('profile-actions').innerHTML = `${initials}`;
                loadSidebar();
            } else {
                window.location.href = '/login.html';
            }
        } catch (parseError) {
            console.error('Fehler beim Parsen des JSON:', parseError);
            console.error('Serverantwort:', text);
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Anmeldestatus:', error);
        window.location.href = '/login.html';
    }
}

/**
 * Logs out the current user by sending a logout request to the server, using CSRF token for security.
 * On successful logout, redirects to the login page. Alerts the user on failure.
 * @returns {Promise<void>} A promise that resolves when the logout process is complete.
 */
async function logout() {
    let apiUrl = await importConfig();
    let fetchUrl = `${apiUrl}/api/form`;
    const csrfResponse = await fetch(fetchUrl, {
        credentials: 'include'
    });
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    try {
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/logout`;
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'CSRF-Token': csrfToken
            },
            credentials: 'include',
        });
        const data = await response.json();
        if (data.status === '200') {
            document.body.style.display = 'none';
            console.log("logout successful");
            // document.getElementById("result").innerHTML = "logout successful";
            window.location.href = '/login.html';
        } else {
            alert("Logout failed.");
        }
    } catch (error) {
        console.error('Fehler beim Logout:', error);
    }
}

/**
 * Sets up initial event listeners upon page load for handling user authentication status checks and logout actions.
 * It checks login status immediately and attaches a click event to the logout button if present.
 */
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    document.getElementById('logout-btn') ? document.getElementById('logout-btn').addEventListener('click', logout) : console.error('Logout-Button nicht gefunden');
});

/**
 * Shows the logout button in the UI.
 * @returns {void}
 */
function showLogout() {
    document.getElementById('header-logout').setAttribute('style', 'display: flex !important');
}

/**
 * Hides the logout button in the UI after a brief delay.
 * @returns {void}
 */
function hideLogout() {
    setTimeout(() => {
        document.getElementById('header-logout').setAttribute('style', 'display: none !important');
    }, 1000);
}

/**
 * Hides the loader UI element.
 * @returns {void}
 */
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function loadSidebar() {
    document.getElementById('sidebar-header').innerHTML = `
        <a href="/">
            <div class="sidebar-top">
                <img id="join-logo" class="join-logo-head" src="./assets/img/logowhite.svg">
            </div>
        </a>

        <div class="sidebar-mid">
            <div class="sidebar-center">
                <a class="sidebar-link" id="sidebarSummary" href="./">
                    <div class="link-name">Summary</div>
                    <div><img class="link-img" src="./assets/img/summaryIconGrey.svg"></div>
                </a>
                <a class="sidebar-link" id="sidebarAddTask" href="./add-task.html">
                    <div class="link-name">Add Task</div>
                    <div><img class="link-img" src="./assets/img/addtaskIconGrey.svg"></div>
                </a>
                <a class="sidebar-link" id="sidebarBoard" href="./board.html">
                    <div class="link-name">Board</div>
                    <div><img class="link-img" src="./assets/img/boardIconGrey.svg"></div>
                </a>
                <a class="sidebar-link" id="sidebarContacts" href="./contacts.html">
                    <div class="link-name">Contacts</div>
                    <div><img class="link-img" src="./assets/img/contactsIconGrey.svg"></div>
                </a>
            </div>
        </div>
        <div id="legals">
            <a class="sidebar-bottom" href="./privacy-policy.html">Privacy Policy</a>
            <a class="sidebar-bottom" href="./legal-notice.html">Legal notice</a>
        </div>
    `;
    document.dispatchEvent(new CustomEvent('sidebarLoaded'));
}

function toggleSuccessPopup() {
    document.getElementById('success').classList.contains('d-none') ? 
        document.getElementById('success').classList.remove('d-none') : 
        document.getElementById('success').classList.add('d-none');
}

function setSuccessMessage(message) {
    document.getElementById('successMessage').innerHTML = message;
    toggleSuccessPopup();
    setTimeout(() => {
        toggleSuccessPopup();
      }, "8000");
}