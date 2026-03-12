import React from 'react';
import { useNavigate } from 'react-router-dom';

function TaskList() {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Task List</h1>
            <button onClick={() => navigate('/tasks/create')}>Create Task</button>
        </div>
    );
}

export default TaskList;
