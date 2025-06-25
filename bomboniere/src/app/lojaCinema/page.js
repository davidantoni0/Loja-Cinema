"use client";
import { useState } from "react";
import styles from "./page.module.css"

export default function MenuLoja() {
    const [number, setNumber] = useState("0");

    function handleClick(value) {
        if (number === "0" && value !== "." && !isNaN(value)) {
            setNumber(value);
        } else {
            setNumber(number + value);
        }
    }


    return(
        <div className={styles.menuLoja}>
            <div className={styles.menuInicio}>Bomboniere</div>

            <div className={styles.keyboard}>
                <div className={styles.row}>
                    <button className={styles.button} onClick={() => handleClick("1")}>Pipocas</button>
                    <button className={styles.button} onClick={() => handleClick("2")}>Refrigerantes</button>
                    <button className={styles.button} onClick={() => handleClick("3")}>Doces</button>
                    <button className={styles.button} onClick={() => handleClick("4")}>Biscoitos</button>
                </div>

            </div>
            
            <footer className={styles.footer}>
                <a>
                    veja 
                </a>
            </footer>
        </div>
    );
}

