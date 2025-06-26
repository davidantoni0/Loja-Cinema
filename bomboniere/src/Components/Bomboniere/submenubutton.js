import s from './submenubutton.module.css';
import React from 'react';

function SubMenuButton({ size, onClick, price }) {
  return (
    <button className={s.button} onClick={() => onClick(size)}>
      {size} - R${price.toFixed(2)}  {/* Display size and price */}
    </button>
  );
}

export default SubMenuButton;