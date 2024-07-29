/**
 * Handles initial page load setup by hiding the loader and fetching necessary CSRF token and contact data.
 */
document.addEventListener('DOMContentLoaded', async function() {
    hideLoader();
    await getCsrfToken();
    await fetchAndDisplayContacts();
});

/**
 * Fetches and displays contacts by retrieving the CSRF token and making an API request to get contacts.
 * @returns {Promise<void>} A promise that resolves when the contacts have been fetched and displayed.
 */
async function fetchAndDisplayContacts() {
    const csrfToken = await getCsrfToken();
    try {
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/contacts`;
        const response = await fetchToBackend(fetchUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch contacts');
        }
        const contacts = await response.json();
        processAndDisplayContacts(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        document.getElementById('contact-list').innerHTML = '<p>Error loading contacts.</p>';
    }
}

/**
 * Processes and displays sorted contact data in the UI.
 * @param {Array} contacts - Array of contact objects to process and display.
 * @returns {void}
 */
function processAndDisplayContacts(contacts) {
    const sortedContacts = Object.values(contacts).sort((a, b) => a.firstName.localeCompare(b.firstName)); // Sortieren nach firstName
    filterAndRenderContacts(sortedContacts);
}

/**
 * Filters and renders contact entries grouped by the first letter of their first name.
 * @param {Array} sortedContacts - The sorted list of contact objects.
 * @returns {void}
 */
function filterAndRenderContacts(sortedContacts) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let contactSection = document.getElementById('contact-list');
    contactSection.innerHTML = '';

    letters.forEach(letter => {
        const filteredContacts = sortedContacts.filter(contact => contact.firstName.toUpperCase().startsWith(letter));
        if (filteredContacts.length > 0) {
            renderLetterSection(filteredContacts, letter);
        }
    });
}

/**
 * Renders a section in the UI for contacts starting with the same letter.
 * @param {Array} contacts - List of contacts to render under a specific letter section.
 * @param {string} letter - The letter used to group the contacts.
 * @returns {void}
 */
function renderLetterSection(contacts, letter) {
    let letterSection = document.createElement('div');
    letterSection.className = 'letter-section';
    letterSection.innerHTML = `<div class="first-char">${letter}</div>`;
    contacts.forEach(contact => {
        letterSection.appendChild(createContactElement(contact));
    });
    document.getElementById('contact-list').appendChild(letterSection);
}

/**
 * Creates a DOM element representing a single contact.
 * @param {Object} contact - Contact object containing data to populate the UI.
 * @returns {HTMLElement} The DOM element created for the contact.
 */
function createContactElement(contact) {
    let firstNameLetter = contact.firstName.charAt(0).toUpperCase();
    let lastNameLetter = contact.lastName.charAt(0).toUpperCase();
    let contactElement = document.createElement('div');
    contactElement.className = 'contact-entry';
    contactElement.innerHTML = `
        <div class="same-letters">
        <div onclick="showContactDetails('${contact.id}')" id="contact-card-${contact.id}" class="contact-card">
        <div id="contact-img-${contact.id}" class="contact-img" style="background-color: ${contact.color};">${firstNameLetter}${lastNameLetter}</div>
        <div id="contactInfo-${contact.id}" class="contact-info">
            <span>${contact.firstName} ${contact.lastName}</span>
            <p>${contact.email}</p>
        </div>
    `;
    return contactElement;
}

/**
 * Displays detailed information for a specific contact.
 * @param {string} contactId - The unique identifier for the contact.
 * @returns {Promise<void>} A promise that resolves when the contact details are displayed.
 */
async function showContactDetails(contactId) {
    try {
        let apiUrl = await importConfig();
        let fetchUrl = `${apiUrl}/api/contact/${contactId}`;
        const response = await fetchToBackend(fetchUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch contact details');
        }

        const contactDetails = await response.json();
        renderContactDetails(contactDetails);
        document.getElementById('mobile-contact-details-popup').classList.remove('d-none');
    } catch (error) {
        console.error('Error fetching contact details:', error);
        document.getElementById('contact-details').innerHTML = '<p>Error loading contact details.</p>';
    }
}

/**
 * Initiates the contact editing process by fetching contact details and displaying them in a form for editing.
 * @param {string} contactId - The unique identifier for the contact to edit.
 * @returns {Promise<void>} A promise that resolves when the edit form is displayed with the contact's current details.
 */
async function editContact(contactId) {
    try {
        let apiUrl = await importConfig();
        
        let fetchUrl = `${apiUrl}/api/contact/${contactId}`;
        const response = await fetchToBackend(fetchUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch contact details: ${response.statusText}`);
        }

        const contactDetails = await response.json();

        // Anzeige eines Bearbeitungsformulars mit den Kontaktdetails
        let editFormHtml = `
                            <div class="edit-input" style="margin-top: 20px;">
                                <label for="firstName">First Name:</label>
                                <input type="text" id="firstName" name="firstName" value="${contactDetails.firstName}">
                            </div>
                            <div class="edit-input">
                                <label for="lastName">Last Name:</label>
                                <input type="text" id="lastName" name="lastName" value="${contactDetails.lastName}">
                            </div>
                            <div class="edit-input">
                                <label for="email">Email:</label>
                                <input type="email" id="email" name="email" value="${contactDetails.email}">
                            </div>
                            <div class="edit-input">
                                <label for="phone">Phone:</label>
                                <input type="tel" id="phone" name="phone" value="${contactDetails.phone}">
                            </div>
                            <div class="edit-input">
                                <label for="color">Profil color:</label>
                                <input type="color" id="color" name="color" value="${contactDetails.color}">
                            </div>
                            <div class="add-contact-buttons">
                                <button class="btn-cancel" type="button" onclick="closeEditPopup()">Cancel X</button>
                                <button class="btn-create" type="button" onclick="saveContact('${contactDetails.id}')">Save</button>
                            </div>
        `;

        document.getElementById('edit-contact-form').innerHTML = editFormHtml;

        document.getElementById('to-edit-contact').innerHTML = `Edit contact ${contactDetails.firstName} ${contactDetails.lastName}`;

        // Öffnen des Popups
        document.getElementById('edit-contact-popup').classList.remove('d-none');
        document.getElementById('edit-contact-popup').style.display = 'block';
    } catch (error) {
        console.error('Error fetching contact details for editing:', error);
        document.getElementById('contact-details').innerHTML = '<p>Error loading contact details for editing.</p>';
    }
}

/**
 * Displays a popup for adding a new contact.
 * @returns {Promise<void>} A promise that resolves when the popup is displayed.
 */
async function addNewContact() {
    document.getElementById('add-contact-popup').classList = 'modal';
    document.getElementById('add-contact-popup').style.display = 'flex';
    document.getElementById('add-new-contact-btn').style.display = "none";
}

/**
 * Saves a new contact to the backend after collecting form data.
 * @returns {Promise<void>} A promise that resolves when the new contact is successfully saved and displayed.
 */
async function saveNewContact() {
    const contactDetails = {
        firstName: document.getElementById('newfirstName').value,
        lastName: document.getElementById('newlastName').value,
        phone: document.getElementById('newphone').value,
        email: document.getElementById('newemail').value,
        color: document.getElementById('color').value
    };

    try {
        let apiUrl = await importConfig();
        const csrfToken = await getCsrfToken();
        
        let fetchUrl = `${apiUrl}/api/add-contact`;
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`},
            credentials: 'include',
            body: JSON.stringify(contactDetails)
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Hinzufügen des Kontakts: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Contact successfully added:', responseData);
        await fetchAndDisplayContacts();
        document.getElementById('newfirstName').value = '';
        document.getElementById('newlastName').value = '';
        document.getElementById('newphone').value = '';
        document.getElementById('newemail').value = '';
        document.getElementById('color').value = '';
        closeEditPopup();
    } catch (error) {
        console.error('Error while adding new contact:', error);
        // document.getElementById('contact-details').innerHTML = '<p>Fehler beim Hinzufügen der Kontaktdetails.</p>';
    }
}

/**
 * Saves updates to an existing contact's details to the backend.
 * @param {string} contactId - The unique identifier for the contact being updated.
 * @returns {Promise<void>} A promise that resolves when the contact's details have been updated.
 */
async function saveContact(contactId) {
    try {
        let apiUrl = await importConfig();
        const csrfToken = await getCsrfToken();

        let updatedContact = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            color: document.getElementById('color').value
        };

        // Überprüfe, ob eine Datei zum Hochladen ausgewählt wurde
        let fileInput = document.getElementById('fileupload');
        if (fileInput.files.length > 0) {
            let formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('contactId', contactId); // Füge die Kontakt-ID hinzu

            // Sende das Bild an den Server
            let imageUploadUrl = `${apiUrl}/api/upload-image`;
            const imageUploadResponse = await fetch(imageUploadUrl, {
                method: 'POST',
                headers: {'CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                body: formData
            });

            if (!imageUploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            const imageUploadData = await imageUploadResponse.json();
            updatedContact.imageUrl = imageUploadData.filePath; // Füge den Bildpfad zu den Kontaktinformationen hinzu
        }

        let fetchUrl = `${apiUrl}/api/contact/${contactId}`;
        const response = await fetch(fetchUrl, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`},
            credentials: 'include',
            body: JSON.stringify(updatedContact)
        });

        if (!response.ok) {
            throw new Error('Failed to save contact');
        }

        // Popup schließen und Kontaktinformationen neu laden
        closeEditPopup();
        let contactImg = 'contact-img-' + contactId;
        document.getElementById(contactImg).style.backgroundColor = document.getElementById('color').value;
        await showContactDetails(contactId);
    } catch (error) {
        console.error('Error saving contact:', error);
        document.getElementById('contact-details').innerHTML = '<p>Error saving contact details.</p>';
    }
}

/**
 * Closes the edit popup and optionally refreshes the list of displayed contacts.
 * @returns {void}
 */
function closeEditPopup() {
    document.getElementById('edit-contact-popup').classList.add('d-none');
    document.getElementById('edit-contact-popup').style.display = 'none';
    document.getElementById('add-contact-popup').classList.add('d-none');
    document.getElementById('add-contact-popup').style.display = 'none';
    document.getElementById('add-new-contact-btn').style.display = "flex";
}

/**
 * Closes the contacts detail popup.
 * @returns {void}
 */
function closeContactsPopup() {
    document.getElementById('mobile-contact-details-popup').classList = 'd-none';
    document.getElementById('mobile-contact-details-popup').style.display = 'none !important';
    document.getElementById('contact-details-modal').classList.add('d-none');
    document.getElementById('contact-details-modal').style.display = 'none !important';
    document.getElementById('save-contact').style.display = "none";
}

/**
 * Renders the detailed view of a contact's information.
 * @param {Object} details - Detailed information about the contact.
 * @returns {void}
 */
function renderContactDetails(details) {
    document.getElementById('contact-details').innerHTML = `
            <div class="contact-header">
                <div id="initials-picture-${details.id}" class="initials" style="background-color: ${details.color}">${details.initials}</div>
                <div>
                    <span>${details.firstName} ${details.lastName}</span>
                    <div class="action-buttons">
                        <div onclick="editContact('${details.id}')"><img alt="edit contact" src="./assets/img/edit.png"></div>
                        <div onclick="deleteContact('${details.id}')"><img alt="edit contact" src="./assets/img/delete.png"></div>
                    </div>
                </div>
            </div>
            <div>
                <h2>Contact information</h2>
                <div>
                    <p><b>Email</b></p>
                    <p><a href="mailto:${details.email}">${details.email}</a></p>
                    <p><b>Phone</b></p>
                    <p><a href="tel:${details.phone}">${details.phone}</a></p>
                </div>
            </div>
        </div>
    `;
    let imagePath = `./../assets/contacts/${details.id}/profile.jpg`;
    let img = new Image();
    img.src = imagePath;
    img.onload = function() {
        let id = 'initials-picture-' + details.id;
        document.getElementById(id).innerHTML = `<img id="profile-picture-${details.id}" src="${imagePath}" alt="Profile picture" class="profile-img">`;
        document.body.style.display = 'flex';
    }
    img.onerror = function() {
        let id = 'initials-picture-' + details.id;
        let initials = `${details.firstName.charAt(0)}${details.lastName.charAt(0)}`.toUpperCase();
        document.getElementById(id).innerHTML = initials;
        document.body.style.display = 'block';
    }
        
// <div class="d-none modal"id=mobile-contact-details-popup onclick=closeContactsPopup()><div class=modal-content id=contact-details-modal onclick=event.stopPropagation()><div class=headline-index-contact id=contact-headline-mobile><h1>Contacts</h1><img src=./assets/img/headline-bar.png id=headline-bar><text>Better with a team</text></div><div onclick=closeContactsPopup() id=closeContactsPopup><img src=./assets/img/blue-arrow-left.png></div><div class=contact-header><div class=initials style=background-color:{};>${details.initials}</div><div><span>${details.firstName} ${details.lastName}</span></div></div><div class=mobile-contact-details><h2>Contact information</h2><div><p><b>Email</b><p id=popup-mail><a href=mailto:${details.email}>${details.email}</a><p><b>Phone</b><p id=popup-phone><a href=tel:${details.phone}>${details.phone}</a></div></div><div onclick=showContactActions() id=mobile-action-button><p>...</div><div class=modal-backdrop onclick=closeContactsPopup(${details.id})><div class=d-none id=mobile-action-button-options><div onclick='editContact("${details.id}")'><img src=./assets/img/edit.png alt="edit contact"></div><div onclick='deleteContact("${details.id}")'><img src=./assets/img/delete.png alt="edit contact"></div></div></div></div>
    document.getElementById('contactDetailsPopup').innerHTML = `
            <div id="mobile-contact-details-popup" class="modal d-none" onclick="closeContactsPopup()">
            	<div id="contact-details-modal" class="modal-content" onclick="event.stopPropagation()">
                    <div id="contact-headline-mobile" class="headline-index-contact">
                        <h1>Contacts</h1>
                        <img id="headline-bar" src="./assets/img/headline-bar.png">
                        <text>Better with a team</text>
                    </div>
                    <div id="closeContactsPopup" onclick="closeContactsPopup();"><img src="./assets/img/blue-arrow-left.png"></div>
            	    <div class="contact-header">
            	    	<div class="initials" style="background-color: ${details.color}">${details.initials}</div>
            	    	<div>
            	    	    <span>${details.firstName} ${details.lastName}</span>
            	    	</div>
            	    </div>

                    <div class="mobile-contact-details">
            	    	<h2>Contact information</h2>
            	    	<div>
            	    	    <p><b>Email</b></p>
                            <p id="popup-mail"><a href="mailto:${details.email}">${details.email}</a></p>
                            <p><b>Phone</b></p>
                            <p id="popup-phone"><a href="tel:${details.phone}">${details.phone}</a></p>
            	    	</div>
                    </div>
                    <div id="mobile-action-button" onclick="showContactActions()"><p>...</p></div>
            <div class="modal-backdrop" onclick="closeContactsPopup(${details.id})">
                <div id="mobile-action-button-options" class="d-none">
                    <div onclick="editContact('${details.id}')"><img alt="edit contact" src="./assets/img/edit.png"></div>
                    <div onclick="deleteContact('${details.id}')"><img alt="edit contact" src="./assets/img/delete.png"></div>
                </div>
            </div>
        </div>`;
}

/**
 * Provides interactive functionality for showing and hiding contact action options on mobile devices.
 * @returns {void}
 */
function showContactActions() {
    const actionButtonOptions = document.getElementById('mobile-action-button-options');
    if (actionButtonOptions.classList.contains('d-none')) {
        actionButtonOptions.classList.remove('d-none');
    } else {
        actionButtonOptions.classList.add('d-none');
    }
}

/**
 * Deletes a contact after confirmation and updates the displayed contact list.
 * @param {string} contactId - The unique identifier for the contact to delete.
 * @returns {Promise<void>} A promise that resolves when the contact is deleted and the list is updated.
 */
async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) {
        return;
    }

    try {
        let apiUrl = await importConfig();
        const csrfToken = await getCsrfToken();

        let fetchUrl = `${apiUrl}/api/delete/contact/${contactId}`;
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json','CSRF-Token': csrfToken,'Authorization': `Bearer ${localStorage.getItem('token')}`},
            credentials: 'include',
        });

        const result = await response.json();

        if (response.ok) {
            await fetchAndDisplayContacts();
            document.getElementById('contact-details').innerHTML = '';
        } else {
            alert(`Error deleting contact: ${result.message}`);
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('An error occurred while deleting the contact.');
    }
}

/**
 * Renders the right side of the contact management interface.
 * @returns {void}
 */
function renderRigthSide() {
    document.getElementById('contact-main').innerHTML = templateRightSide();
}

/**
 * Returns HTML content for the right side of the contact management interface.
 * @returns {string} HTML content for the right side.
 */
function templateRightSide() {
    return /*html*/ ` 
    <div id="contact-headline" class="headline-index-contact">
        <span>Contacts</span>
        <img src="./assets/img/headline-bar.png">
        <p>Better with a team</p>
    </div>
    <div id="show-contact" class="show-contact"></div>
    <button id="add-new-contact-btn" onclick="addNewContact()" class="new-contact">
        New Contact<img src="./assets/img/user-plus.png">
    </button>

    <div id="myModal" class="modal">
        <div class="modal-content">
            <h3>Contact successfully created!</h3>
        </div>
    </div>`
}
