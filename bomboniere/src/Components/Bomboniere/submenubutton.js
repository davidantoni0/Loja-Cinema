import s from './submenubutton.module.css';

function SubMenuButton({ size, onClick }) {
  return (
    <button className={s.button} onClick={() => onClick(size)}>
      {size}
    </button>
  );
}

export default SubMenuButton;