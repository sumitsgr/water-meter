import React, { useState } from 'react';

const TodoList = () => {
  const [todo, settodo] = useState([]);
  console.log(todo);

  const handleClick = () => {};

  return (
    <div>
      <input
        type="text"
        placeholder="add todos..."
        onChange={(e) => settodo(e.target.value)}
      />
      <button onClick={handleClick}>Add Todo</button>
    </div>
  );
};

export default TodoList;
