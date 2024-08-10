let toAssignUser = [];
/**
 * Toggles the display state of the dropdown content.
 */
function toggleDropdown() {
    let dropdownContent = document.getElementById("dropdownContent");
    dropdownContent.style.display = (dropdownContent.style.display === "block") ? "none" : "block";
}

/**
 * Closes the dropdown if the click is outside of the dropdown element.
 * @param {Event} event - The click event triggered on the window.
 */
function closeDropdownOnClickOutside(event) {
    let dropdownContent = document.getElementById("dropdownContent");
    if (!event.target.closest('.dropdown')) {
        dropdownContent.style.display = "none";
    }
}
window.onclick = closeDropdownOnClickOutside;

/**
 * Fetches accounts from the backend and populates the dropdown for task assignment.
 * This function handles fetching, error reporting, and updates the UI to show available accounts.
 * @returns {Promise<void>} A promise that resolves when the operation is complete, updating the dropdown with user accounts.
 */
async function fetchAccountsAndFillDropdown() {
    try {
        let apiUrl = await importConfig();
        let response = await fetchToBackend(`${apiUrl}/api/accounts`, 'GET');
        if (!response.ok) {
            throw new Error('Failed to fetch accounts');
        }

        let accounts = await response.json();
        let dropdown = document.getElementById('dropdownContent');
        dropdown.innerHTML = '';

        Object.keys(accounts).forEach(key => {
            let user = accounts[key];
            let isChecked = toAssignUser.includes(`${user.firstName} ${user.lastName}`);
            let userDiv = document.createElement('div');
            userDiv.setAttribute('onclick', 'toggleUser(this)');
            userDiv.className = isChecked ? "selected" : ""; // Klasse `selected` hinzufügen, wenn geprüft
            userDiv.style.color = isChecked ? "white" : ""; // Textfarbe zu Weiß ändern, wenn geprüft
            userDiv.innerHTML = `
                <span class="user-icon" style="background-color: ${user.profileColor};">${user.initials}</span>
                ${user.firstName} ${user.lastName} (You)
                <input type="checkbox" value="${key}" data-name="${user.firstName} ${user.lastName}" data-color="${user.profileColor}" class="checkbox" ${isChecked ? 'checked' : ''}>
            `;
            dropdown.appendChild(userDiv);
        });
        setupCheckboxHandlers();

    } catch (error) {
        console.error('Error fetching accounts:', error);
    }
}

function setupCheckboxHandlers() {
    document.querySelectorAll('#dropdownContent input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const userFullName = this.getAttribute('data-name');
            if (this.checked) {
                if (!toAssignUser.includes(userFullName)) {
                    toAssignUser.push(userFullName);
                }
            } else {
                const index = toAssignUser.indexOf(userFullName);
                if (index > -1) {
                    toAssignUser.splice(index, 1);
                }
            }
            console.log(`Checkbox for ${userFullName} is now ${this.checked ? 'checked' : 'unchecked'}.`);
            console.log('Current toAssignUser Array:', toAssignUser);
        });
    });
}

/**
 * Updates the selected users list based on checked checkboxes within the dropdown.
 */
function updateSelectedUsers() {
    let checkboxes = document.querySelectorAll('#dropdownContent input[type="checkbox"]:checked');
    let selectedUserIds = Array.from(checkboxes).map(checkbox => checkbox.value);
    document.getElementById('selected-users').value = selectedUserIds.join(',');
}

/**
 * Toggles a user's selection state based on the checkbox within the label element.
 * @param {Element} label - The label element that was clicked.
 */
function toggleUser(label) {
    let checkbox = label.querySelector('input[type="checkbox"]');
    let selectedUsers = document.getElementById("selectedUsers");
    let userIcon = label.querySelector('.user-icon');
    let initials = userIcon.textContent;
    let color = userIcon.style.backgroundColor;

    checkbox.checked = !checkbox.checked;
    if (checkbox.checked) {
        // Nutzer hinzufügen und visuelle Indikatoren setzen
        addUser(selectedUsers, checkbox, initials, color);
        label.classList.add("selected");
        label.style.color = "white";
    } else {
        // Nutzer entfernen und visuelle Indikatoren zurücksetzen
        removeUserFromEditTask(selectedUsers, checkbox.value); 
        removeUser(selectedUsers, checkbox.value);
        label.classList.remove("selected");
        label.style.color = "black";
    }
}

/**
 * Adds a user to the selected users display and list.
 * @param {Element} selectedUsers - The container element for selected users.
 * @param {Element} checkbox - The checkbox element associated with the user.
 * @param {string} initials - The initials to display for the user.
 * @param {string} color - The background color for the user display element.
 */
async function addUser(selectedUsers, checkbox, initials, color) {
    if (!selectedUsers.querySelector('div[data-value="' + checkbox.value + '"]')) {
        let userDiv = document.createElement("div");
        userDiv.className = "selected-user";
        userDiv.style.backgroundColor = color;
        userDiv.textContent = initials;
        userDiv.setAttribute('data-value', checkbox.value);
        userDiv.setAttribute('onclick', 'removeUserDiv(this)');
        selectedUsers.appendChild(userDiv);

        let userFullName = await getUserNameByCheckboxValue(checkbox.value);
        if (userFullName) {
            if (!toAssignUser.includes(userFullName)) {
                toAssignUser.push(userFullName);
            }
        }
    }
}

/**
 * Removes a user from the selected users display and list.
 * @param {Element} selectedUsers - The container element for selected users.
 * @param {string} value - The value attribute of the checkbox corresponding to the user.
 */
async function removeUser(selectedUsers, value) {
    let userDiv = selectedUsers.querySelector('div[data-value="' + value + '"]');
    if (userDiv) {
        userDiv.remove();

        let userFullName = await getUserNameByCheckboxValue(value);
        if (userFullName) {
            let index = toAssignUser.indexOf(userFullName);
            if (index > -1) {
                toAssignUser.splice(index, 1);
                console.log("User removed: " + userFullName);
                console.log("All assigned users: ", toAssignUser.join(', '));
            }
        }    
    }
}

async function removeUserFromEditTask(selectedUsers, value) {
    let userDiv = selectedUsers.querySelector(`div[data-value="${value}"]`);
    if (userDiv) {
        userDiv.remove();
        let userFullName = await getUserNameByCheckboxValue(value);
        if (userFullName) {
            const index = toAssignUser.indexOf(userFullName);
            if (index !== -1) {
                toAssignUser.splice(index, 1);  // Entferne Benutzer aus dem Array
                console.log(`User removed from edit task: ${userFullName}`);
            }
        }
    }
}

/**
 * Removes a user display element and updates the selected state.
 * @param {Element} userDiv - The user display element to remove.
 */
async function removeUserDiv(userDiv) {
    let value = userDiv.getAttribute('data-value');
    let checkbox = document.querySelector('.dropdown-content input[value="' + value + '"]');
    checkbox.checked = false;
    userDiv.remove();
    let label = checkbox.parentElement;
    label.classList.remove("selected");
    label.style.color = "black";

    let userFullName = await getUserNameByCheckboxValue(value);
    if (userFullName) {
        let index = toAssignUser.indexOf(userFullName);
        if (index > -1) {
            toAssignUser.splice(index, 1);
        }
    }
}

/**
 * Fetches the full name of a user by the checkbox value.
 * @param {string} value - The value attribute of the checkbox corresponding to the user.
 * @returns {Promise<string|null>} A promise that resolves to the full name of the user or null if not found.
 */
async function getUserNameByCheckboxValue(value) {
    try {
        let apiUrl = await importConfig();
        let response = await fetchToBackend(`${apiUrl}/api/accounts`, 'GET');
        if (!response.ok) {
            throw new Error('Error while fetching accounts');
        }
        let accounts = await response.json();
        let user = accounts[value];
        return user ? `${user.firstName} ${user.lastName}` : null;
    } catch (error) {
        console.error('Server error while fetching account names:', error);
        return null;
    }
}
