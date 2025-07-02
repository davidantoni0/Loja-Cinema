import s from './menubutton.module.css';
import Image from 'next/image';

function MenuButton({ label, onClick, imageSrc }) {
  return (
    <button className={s.button} onClick={onClick}>
      {imageSrc && <Image src={imageSrc} alt={label} width={100} height={100} />}
      {label}
    </button>
  );
}

export default MenuButton;
