import s from './pipoca.module.css';

export default function Pipoca() {
    return (
        <div className={s.pipoca}>
            <h1 className={s.title}>Pipoca</h1>
            <img src="/pipoca.jpg" alt="Pipoca" className={s.image} />
        </div>
    );
}