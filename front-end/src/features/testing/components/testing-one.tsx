import React, { useState } from 'react';

const TestingOne = () => {
  const [count, setCount] = useState(0);
  const [selectedOperator, setSelectedOperator] = useState('minus');
  const [selectedNumber, setSelectedNumber] = useState(1);
  console.log(typeof selectedNumber);

  const handleClick = () => {
    if (selectedOperator == 'minus') {
      setCount((prev) => prev - selectedNumber);
    } else {
      setCount((prev) => prev + selectedNumber);
    }
  };

  return (
    <div>
      <p style={{ color: count < 0 ? 'red' : 'black' }}>{count}</p>

      <select
        value={selectedOperator}
        onChange={(e) => setSelectedOperator(e.target.value)}
      >
        <option value="minus">-</option>
        <option value="plus">+</option>
      </select>
      <select
        value={selectedNumber}
        onChange={(e) => setSelectedNumber(Number(e.target.value))}
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={5}>5</option>
        <option value={10}>10</option>
      </select>
      <button onClick={handleClick}>Apply</button>
    </div>
  );
};

export default TestingOne;

// oninput: Fires every time the value changes as the user types, pastes, deletes, or otherwise modifies the input.
// onchange: Fires only after the change is committed, usually when the input loses focus (or immediately for controls like checkboxes and selects).

// Why doesn't value={5} stay a number?
// The DOM specification defines the value property of a <select> (and <input>) as a string. React follows the browser's behavior.
