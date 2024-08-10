function generateContactfield(i, firstChar, secondChar, color, fullFirstname, fullName, mail, phone) {
    return /*html*/`
    <div id="contact-headline" class="headline-index-showContact">
        <span>Contacts</span>
        <img src="./assets/img/headline-bar.png">
        <p>Better with a team</p>
        <img onclick="closeShowContact()" class="arrow-left-contacts" src="./assets/img/arrow-left.png" alt="">
    </div>
    <div class="show-contact-headline">
    <span id="cancel-popup" onclick="closePopup()" class="cancel-x d-none">X</span>
        <div id="contact-img" class="contact-img-big" style="background-color:${color}">${firstChar} ${secondChar}</div>
        <div class="show-contact-headline-right"> 
            <div class="contact-head-name">${fullFirstname} ${fullName}</div>
            <div onclick="addNewTaskBoardContacts('todo-box')" id="add-task" class="blue-font"> + Add Task </div>
        </div>
    </div>
    <div class="show-contact-middle">
        <span>Contact Information</span> 
        <div class="edit-contact" onclick="editContact(${i}, '${color}')">
            <img style="width: 30px; height: 30px; object-fit: contain;" src="./assets/img/pen.png"><p> Edit Contact</p>
        </div>
    </div>
    <div class="show-contact-bottom">
        <span style="font-size: 16px; font-weight: 700; padding-bottom: 15px;">Email</span>
        <span class="blue-font" style="padding-bottom: 22px;">${mail}</span>
        <span style="font-size: 16px; font-weight: 700; padding-bottom: 15px;">Phone</span>
        <span>${phone}</span>
    </div> `
}


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


function generateAllContacts1(currentcontact, firstChar, secondChar, i, color, firstName, fullFirstname, fullName) {
    return /*html*/ `
    <div onclick="showContactVariables('${firstName}', '${color}')" id="contact-card${i}" class="contact-card">
        <div id="contact-img${i}" class="contact-img" style='background-color: ${color};'>${firstChar} ${secondChar}</div>
        <div id="contactInfo${i}" class="contact-info">
            <span>${fullFirstname} ${fullName}</span>
            <p>${currentcontact['mail']}</p>
        </div>
    </div>`
}