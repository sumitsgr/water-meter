import React, { useState } from 'react';

const CheckPassword = () => {
  const [password, setpassword] = useState('');
  const [check, setcheck] = useState('');

  const checkPassword = () => {
    if (password.length < 8) {
      setcheck('Weak Password');
    } else if (password.length >= 12 && /\d/.test(password)) {
      setcheck('Strong Password');
    } else {
      setcheck('Medium Password');
    }
  };

  

  return (
    <div>
      <label htmlFor="Password">Password</label>
      <br />
      <input
        value={password}
        type="password"
        placeholder="type password"
        onChange={(e) => setpassword(e.target.value)}
      />
      <span
        style={{
          color:
            check === 'Weak Password'
              ? 'red'
              : check === 'Medium Password'
                ? 'orange'
                : 'green',
        }}
      >
        {check}
      </span>
      <br />
      <button disabled={password.length === 0} onClick={checkPassword}>
        check password
      </button>
    </div>
  );
};

export default CheckPassword;
