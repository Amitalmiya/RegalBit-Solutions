import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTodo, deleteTodo, editTodo, toggleTodo } from "../features/todos/todoSlice";
import ConfirmDialog from "./ConfirmDialog";

const ReduxComponents = () => {
  const [text, setText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);

  const todos = useSelector((state) => state.todos.items);
  const dispatch = useDispatch();

  const handleAdd = () => {
    if (text.trim()) {
      dispatch(addTodo(text));
      setText("");
    }
  };

  const handleDeleteClick = (todo) => {
    setTodoToDelete(todo);
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (todoToDelete) {
      dispatch(deleteTodo(todoToDelete.id));
      setIsDialogOpen(false);
      setTodoToDelete(null);
    }
  };
  

  const handleCancelDelete = () => {
    setIsDialogOpen(false);
    setTodoToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-green-600 mb-6">Todo App Using Redux</h1>

      <div className="flex mb-6 w-full max-w-md">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter a new todo"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-green-500 text-white font-semibold rounded-r-md hover:bg-green-600 transition-colors"
        >
          Add todo
        </button>
      </div>

      <ul className="w-full max-w-md space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center justify-between bg-white shadow-md rounded-md px-4 py-2"
          >
            <span
              onClick={() => dispatch(toggleTodo(todo.id))}
              className={`flex-1 cursor-pointer ${
                todo.completed ? "line-through text-gray-400" : "text-gray-800"
              }`}
            >
              {todo.text}
            </span>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const newText = prompt("Edit todo:", todo.text);
                  if (newText !== null && newText.trim() !== "") {
                    dispatch(editTodo({ id: todo.id, text: newText }));
                  }
                }}
                className="px-2 py-1 bg-yellow-400 text-white rounded-md hover:bg-yellow-500 transition-colors"
              >
                Edit
              </button>

              <button
                onClick={() => handleDeleteClick(todo)}
                className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={isDialogOpen}
        title="Delete Todo"
        message={`Are you sure you want to delete "${todoToDelete?.text}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default ReduxComponents;