import React, { useState } from 'react';

const TestingTwo = () => {
  const [color, setColor] = useState('white');

  return (
    <div>
      <div
        style={{
          width: '9%',
          height: '30vh',
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid black',
          display: 'flex',
        }}
      >
        {color}
      </div>
      <button
        style={{ border: '1px solid black' }}
        onClick={() => setColor('red')}
      >
        Red
      </button>
      <br />
      <button
        style={{ border: '1px solid black' }}
        onClick={() => setColor('green')}
      >
        Green
      </button>
      <br />
      <button
        style={{ border: '1px solid black' }}
        onClick={() => setColor('blue')}
      >
        blue
      </button>
    </div>
  );
};

export default TestingTwo;
