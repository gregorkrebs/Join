function templateGenerateHTML(element) {
    let title = element['title'];
    let description = element['description'];
    let priority = element['priority'];
    let category = element['category'];
    let categoryColor = element['categoryColor'];

    return /*html*/ `
            <div  draggable="true" ondragstart="startDragging(${element['id']})" onclick="openShowTask(${element['id']})" class="current-task">
                <div class="current-Task-Category ${categoryColor}">${category}</div>
                <p class="task-title">${title}</p>
                <p class="task-decription">${description}</p>
                <div id="progress${element['id']}" class="progress-bar-row d-none"></div>
                <div class="assignedto-prio-row">
                    <div id="assigned-to-currentTask${element['id']}" class="assigned-to-currentTask" ></div>
                    <img class="current-Task-Prio" src="./assets/img/${priority}-solo.png" alt="">
                </div>
            </div>
        `
}

function templateOpenShowTask(title, description, date, priority, category, categoryColor, capitalizedPriority) {
    return /*html*/ ` 
    <div class="showTask-Category ${categoryColor}">${category}</div>
    <div class="showTask-exitButton"><img onclick="closeShowTask()" src="./assets/img/exit.png" alt=""></div>
    <h3 class="showTask-title">${title}</h3>
    <p class="showTask-description">${description}</p>
    <p class="showTask-headers">Due date: ${date}</p>
    <div class="priority-bar-row showTask-headers" >Priority: 
        <div id="prio-full-task" class="showTask-headers prio-full-task ${priority}-full-task">
            <p class="margin-none no-scale ">${capitalizedPriority}</p>
            <img id="icon-prio" class="icon-full-task" src="./assets/img/${priorityImg}.png">
        </div>
    </div>
    <p class="showTask-headers">Subtasks:</p>
    <div id="subTask-box" class="showTask-subtasks"></div>
    <p class="showTask-headers">Assigned To:</p>
    <div class="assigned-modifyTask">
        <div id="assigned-box" ></div>
    </div>
    <div  id="modify-task" class="modify-button" >
        <button onclick="renderMoveBox()" class="moveTaskBtn" >Move</button>
        <img onclick="modifyTaskOnBoard()" src="./assets/img/edit-button.png" alt="">
    </div>
`
}


function templateSubtask(i, currentSubTask) {
    return /*html*/ `
        <div class="assigned-box">
            <input id="subTaskCheck${i}" onclick="saveCheck(${i})" type="checkbox">
            <div id="subTask${i}" >${currentSubTask}</div>
        </div>
        `
}


function templateRenderProgressbar(subLength, subWidth) {
    return /*html*/`
    <div id="subtaskProgress" class="progress-bar">
        <div id="subtaskBar" class="subtaskBar"  style="width:${subWidth}% !important;"></div>
    </div>
    <p class="margin-none ">${countOfAllCheckedSubtasks} / ${subLength} Done</p>
    `;
}


function templateAssignedToBox(i, contactColor, firstLetter, secondLetter, firstName, lastName) {
    return /*html*/ `
    <div class="assigned-box">
        <div id="assigned-icon${i}" class="assigned-icon" style ="background-color: ${contactColor}">${firstLetter}${secondLetter}</div>
        <div id="assigned-name">${firstName} ${lastName}</div>
    </div>
    `
}

