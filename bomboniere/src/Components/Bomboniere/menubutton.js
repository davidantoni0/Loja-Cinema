import s from './menubutton.module.css';

function MenuButton({ label, onClick }) {
  return (
    <button className={s.button} onClick={onClick}>
      {label}
    </button>
  );
}

export default MenuButton;