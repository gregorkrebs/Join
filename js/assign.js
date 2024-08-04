function toggleDropdown() {
    var dropdownContent = document.getElementById("dropdownContent");
    dropdownContent.style.display = (dropdownContent.style.display === "block") ? "none" : "block";
}

function closeDropdownOnClickOutside() {
    var dropdownContent = document.getElementById("dropdownContent");
    if (!event.target.closest('.dropdown')) {
        dropdownContent.style.display = "none";
    }
}

window.onclick = closeDropdownOnClickOutside;

let toAssignUser = [];
function toggleUser(label) {
    var checkbox = label.querySelector('input[type="checkbox"]');
    var selectedUsers = document.getElementById("selectedUsers");
    var userIcon = label.querySelector('.user-icon');
    var initials = userIcon.textContent;
    var color = userIcon.style.backgroundColor;

    checkbox.checked = !checkbox.checked;
    if (checkbox.checked) {
        addUser(selectedUsers, checkbox, initials, color);
        label.classList.add("selected");
        label.style.color = "white";
    } else {
        removeUser(selectedUsers, checkbox.value);
        label.classList.remove("selected");
        label.style.color = "black";
    }
}

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
            toAssignUser.push(userFullName);
            console.log(userFullName);
        }
    }
}

async function removeUser(selectedUsers, value) {
    var userDiv = selectedUsers.querySelector('div[data-value="' + value + '"]');
    if (userDiv) {
        userDiv.remove();

        let userFullName = await getUserNameByCheckboxValue(value);
        if (userFullName) {
            let index = toAssignUser.indexOf(userFullName);
            console.log(userFullName);
            if (index > -1) {
                console.log(userFullName);
                toAssignUser.splice(index, 1);
            }
        }    
    }
}

function removeUserDiv(userDiv) {
    let value = userDiv.getAttribute('data-value');
    let checkbox = document.querySelector('.dropdown-content input[value="' + value + '"]');
    checkbox.checked = false;
    userDiv.remove();
    let label = checkbox.parentElement;
    label.classList.remove("selected");
    label.style.color = "black";
}

// Funktion, um den Namen des Benutzers anhand des Checkbox-Werts zu erhalten
async function getUserNameByCheckboxValue(value) {
    try {
        let apiUrl = await importConfig();
        const response = await fetchToBackend(`${apiUrl}/api/accounts`, 'GET');
        if (!response.ok) {
            throw new Error('Error while fetch accounts');
        }
        
        const accounts = await response.json();
        const user = accounts[value];
        return user ? `${user.firstName} ${user.lastName}` : null;
    } catch (error) {
        console.error('Server error while fetching account names:', error);
        return null;
    }
}
