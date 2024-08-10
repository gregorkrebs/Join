/**
 * Retrieves a CSRF token from the server configuration to be used in subsequent API requests.
 * This is required for maintaining security in communications with the server.
 * @returns {Promise<string>} A promise that resolves to the CSRF token string, which is used to validate user sessions.
 */
async function getCsrfToken() {
    let apiUrl = await importConfig();
    let fetchUrl = `${apiUrl}/api/form`;
    console.log("Fetching " + fetchUrl);
    const csrfResponse = await fetch(fetchUrl, {
        credentials: 'include'
    });
    const csrfData = await csrfResponse.json();
    return csrfData.csrfToken;
}

/**
 * Handles the user registration process by preventing default form submission,
 * validating user inputs, and submitting the data to the server if all validations pass.
 * Displays appropriate messages based on the outcome of the registration attempt.
 * @param {Event} event - The event object from the form submission.
 * @returns {Promise<void>} A promise that resolves when the registration process is complete, handling both successful and unsuccessful attempts.
 */
async function registerUser(event) {
    event.preventDefault();
    const firstName = document.getElementById('sign-up-firstname').value;
    const lastName = document.getElementById('sign-up-lastname').value;
    const email = document.getElementById('sign-up-email').value;
    const checkBox = document.getElementById('legal-checkbox').checked;
    const password = document.getElementById('sign-up-password').value;
    const confirmPassword = document.getElementById('sign-up-confirmPassword').value;
    const profileColor = document.getElementById('sign-up-profileColor').value;


    if (password !== confirmPassword) {
        document.getElementById('result').innerHTML = 'Passwords do not match';
    } else {
        if (!checkBox) {
            document.getElementById('result').innerHTML = 'Please accept our privacy policy.';
        } else {
            try {
                const csrfToken = await getCsrfToken();
                let apiUrl = await importConfig();
                let fetchUrl = `${apiUrl}/api/sign-up`;
                const response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken},
                    credentials: 'include',
                    body: JSON.stringify({
                        firstName, lastName, email, password, profileColor
                    })
                });
                const data = await response.json();
        
                if (data.status === 'success') {
                    console.log("Registration successful");
                    document.getElementById("result").innerHTML = "Registration successful. Redirecting in 5 seconds...";
                    setTimeout(async () => {
                        await loginUser(email, password);
                    }, 5000);
                } else {
                    console.log(data.status);
                    document.getElementById('result').textContent = "Registration failed. Please try again.";
                }
            } catch (error) {
                console.error('Error during registration:', error);
                document.getElementById('result').innerHTML = 'Registration server not reachable.';
            }
        }
    }
}

/**
 * Logs in a user by sending their credentials to the server and handling the response.
 * Stores session token in local storage on successful login and redirects the user.
 * Displays error messages directly to the UI on failure.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<void>} A promise that resolves when the login attempt is complete, with error handling for failed attempts.
 */
async function loginUser(email, password) {
    try {
        const csrfToken = await getCsrfToken();
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/login`;
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken},
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Server responded with status: ' + response.status);
        }

        const data = await response.json();
        if (data.status === '200' && data.token) {
            localStorage.setItem('token', data.token);
            console.log("Login successful, token saved.");
            document.getElementById("result").innerHTML = "Login successful";
            window.location.href = 'index.html';
        } else {
            console.error('Login failed:', data);
            document.getElementById('result').textContent = "Login failed. Please check your username and password.";
        }
    } catch (error) {
        console.error('Error during login:', error);
        document.getElementById('result').innerHTML = 'Authentication server not reachable. Please try again later.';
    }
}

/**
 * Handles a guest login by retrieving guest credentials from the configuration and
 * using them to log in.
 * @param {Event} event - The event object from the form submission.
 * @returns {Promise<void>} A promise that resolves when the guest login process is complete.
 */
async function guestLogin(event) {
    event.preventDefault();
    let guestEmail = await getConfigData("guestEmail");
    let guestPassword = await getConfigData("guestPassword");
    await loginUser(guestEmail, guestPassword);
}

/**
 * Processes the login form submission using provided credentials.
 * @param {Event} event - The event object from the form submission.
 * @returns {Promise<void>} A promise that resolves when the login process is initiated.
 */
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    await loginUser(email, password);
}

/**
 * Initializes event listeners on relevant form elements for user interactions such as registration and login,
 * effectively setting up the UI for handling these user actions upon page load.
 */
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    }
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
});

/**
 * Reveals the login interface after a predefined delay, enhancing user experience by delaying element visibility.
 */
setTimeout(async () => {
    let loginContent = document.getElementById('login-content');
    loginContent.style.display = 'flex';
}, 1000);