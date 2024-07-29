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
 * Fetches CSRF token and performs a backend fetch operation using a provided URL.
 * @param {string} fetchUrl - The URL to fetch from the backend.
 * @returns {Promise<Response>} A promise that resolves to the response of the fetch operation.
 */
async function fetchToBackend(fetchUrl) {
    const csrfToken = await getCsrfToken();
    let response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`},
        credentials: 'include',
    });
    return response;
}

/**
 * Checks the user's login status by requesting the login state from the server.
 * Redirects to the login page if not logged in or in case of any errors during the status check.
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
                let imagePath = `./../assets/profiles/${data.email.replace("@", "_at_")}/profile.jpg`;

                let img = new Image();
                img.src = imagePath;
                img.onload = function() {
                    document.getElementById('profile-actions').innerHTML = `<img id="profile-picture" src="${imagePath}" alt="Profile picture">`;
                    document.body.style.display = 'block';
                }
                img.onerror = function() {
                    let initials = `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase();
                    document.body.style.display = 'block';
                    document.getElementById('profile-actions').innerHTML = `${initials}`;
                }
                // documenet.getElementById('profile-actions').style.background = data.color;
            } else {
                window.location.href = '/login.html'; // Weiterleiten auf login.html, wenn nicht angemeldet
            }
        } catch (parseError) {
            console.error('Fehler beim Parsen des JSON:', parseError);
            console.error('Serverantwort:', text);
            window.location.href = '/login.html'; // Weiterleiten auf login.html im Fehlerfall
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Anmeldestatus:', error);
        window.location.href = '/login.html'; // Weiterleiten auf login.html im Fehlerfall
    }
}

/**
 * Logs out the current user by sending a logout request to the server and then redirects to the login page.
 * Handles the request using CSRF token for security.
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
                'CSRF-Token': csrfToken // CSRF-Token in den Header einfügen
            },
            credentials: 'include', // Einschließen von Cookies im Request
        });
        const data = await response.json();
        if (data.status === '200') {
            document.body.style.display = 'none';
            console.log("logout successful");
            // document.getElementById("result").innerHTML = "logout successful";
            window.location.href = '/login.html';
        } else {
            alert("Logout failed.");
            // document.getElementById('result').textContent = "Logout failed. Please try again.";
        }
    } catch (error) {
        console.error('Fehler beim Logout:', error);
    }
}

/**
 * Adds event listeners upon DOMContentLoaded event, particularly for checking login status and handling logout.
 */

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    } else {
        console.error('Logout-Button nicht gefunden');
    }
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