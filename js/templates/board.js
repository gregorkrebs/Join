function createTaskElementHtml(category, categoryName, title, description, firebaseTaskId, subTasksLength, subTasks, assigneesHTML, priorityUrl) {
    let html = `<div class="${category}">${categoryName}</div>
        <h4>${title}</h4>
        <p id="${firebaseTaskId}-description">${description}</p>
        <div class="tasks-subtasks">
            <progress id="${firebaseTaskId}-progress" max="${subTasksLength}" value="${subTasks}"></progress>
            <p>${subTasksLength} Subtasks</p>
        </div>
        <div id="task-priority">
            <div id="task-meta">
                ${assigneesHTML}
            </div>
            <div class="task-priority-img">
                <img src="${priorityUrl}"></div>
            </div>
        </div>`;
    return html;
}

function updateSubtaskListHtml(subtask, index, isChecked) {
    let html = `
        <li>${subtask}</li>
        <button class="remove-subtask d-none" onclick="removeEditingSubtask(${index})">X</button>
        <input class="checkbox-subtask" type="checkbox" data-index="${index}" onclick="checkboxEditingSubtask(${index})" ${isChecked ? 'checked' : ''}>
    `;
    return html;
}

/**
 * Triggers the display of a window to add a new task.
 * @returns {void}
 */
function addNewTask() {
    document.body.classList.add('overflow-hidden');
    document.getElementById('show-addTaskInclude').innerHTML = /*html*/ `
        <div w3-include-html="add-TaskInclude.html" ></div>`;
    includeHTMLaddTask();
}