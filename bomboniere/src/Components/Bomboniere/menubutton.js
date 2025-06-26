import s from './menubutton.module.css';
import Image from 'next/image';


function MenuButton({ label, onClick, imageSrc }) {
  return (
    <button className={s.button} onClick={onClick}>
      {imageSrc && <Image src={imageSrc} alt={label} width={20} height={20} />}
      {label}
    </button>
  );
}

export default MenuButton;