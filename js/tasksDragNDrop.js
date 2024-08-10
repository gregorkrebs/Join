/**
 * Initializes dragging of a task element by setting the data transfer payload.
 * @param {DragEvent} e - The event associated with the start of a drag.
 */
function handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
}

/**
 * Prevents the default handling of an element to allow dropping.
 * @param {DragEvent} e - The event where a drag over occurs.
 */
function allowDrop(e) {
    e.preventDefault(); 
}

/**
 * Handles the drop event by appending the dragged task element to a new target.
 * Updates the task state based on the drop location.
 * @param {DragEvent} event - The event associated with the drop.
 * @param {string} targetId - The ID of the target container where the task is dropped.
 */
function handleDrop(event, targetId) {
    event.preventDefault();
    event.stopPropagation();

    const data = event.dataTransfer.getData("text");
    const taskElement = document.getElementById(data);
    const targetBox = document.getElementById(targetId);

    targetBox.appendChild(taskElement);
    updateTaskState(data, targetId.replace('-box', ''));
}

/**
 * Updates the state of a task in the backend based on its new state in the UI.
 * Handles errors by logging and potentially alerting the user.
 * @param {string} taskId - The ID of the task being updated.
 * @param {string} newState - The new state of the task (e.g., 'todo', 'in-progress').
 */
async function updateTaskState(taskId, newState) {
    try {
        let apiUrl = await importConfig();
        const response = await fetchToBackend(`${apiUrl}/api/edit-task-state/${taskId}`, 'PATCH', JSON.stringify({ newState }));
        if (!response.ok) {
            throw new Error('Task status update failed');
        }
    } catch (error) {
        console.error('Error updating task status:', error);
    }
}