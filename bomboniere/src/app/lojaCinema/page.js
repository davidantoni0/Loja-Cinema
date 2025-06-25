"use client";
import { useState } from "react";
import styles from "./page.module.css"

export default function MenuLoja() {
    const [step, setStep] = useState("mainMenu");
    const [selectedItem, setSelectedItem] = useState();
    const [cart, setCart] = useState([]);

    const prices = {
        Pipocas: { "1": 5.0, "2": 7.5, "3": 10.0 },
        Refrigerantes: { "1": 4.0, "2": 6.0, "3": 8.0 },
        Doces: { "1": 2.5, "2": 4.0, "3": 5.5 },
        Biscoitos: { "1": 3.0, "2": 4.5, "3": 6.0 }
    };

    function handleClickMenu(item) {
        setSelectedItem(item);
        setStep("submenu");
    }

    function handleClickAddItem(size) {
    const preco = prices[selectedItem][size];

    const newItem = {
        item: selectedItem,
        size,
        preco
    };

    setCart([...cart, newItem]);
    setStep("mainMenu");
    }

    function handleClickCart() {

    }

    return(
        <div className={styles.menuLoja}>
            <div className={styles.menuInicio}>Bomboniere</div>

            {step === "mainMenu" && (

            <div className={styles.row}>
                <button className={styles.button} onClick={() => handleClickMenu("Pipocas")}>Pipocas</button>
                <button className={styles.button} onClick={() => handleClickMenu("Refrigerantes")}>Refrigerantes</button>
                <button className={styles.button} onClick={() => handleClickMenu("Doces")}>Doces</button>
                <button className={styles.button} onClick={() => handleClickMenu("Biscoitos")}>Biscoitos</button>
            </div>
            )}
            
            {step === "submenu" && (
            <div className={styles.submenu}>
            <div className={styles.submenuTitle}>
                Selecione o tamanho de {selectedItem}:
            </div>
            <button className={styles.button} onClick={() => handleClickAddItem("1")}>Pequeno</button>
            <button className={styles.button} onClick={() => handleClickAddItem("2")}>Médio</button>
            <button className={styles.button} onClick={() => handleClickAddItem("3")}>Grande</button>
            </div>
            )}

            <footer className={styles.footer}>
                <div className={styles.cart}>
                <button className={styles.button} onClick={() => handleClickCart("Carrinho")}>Veja o Carrinho ({cart.length} itens)</button>
                </div>

                <div className={styles.deleteCart}>
                <button className={styles.button} onClick={() => handleClickCart("Carrinho")}>Veja o Carrinho ({cart.length} itens)</button>
                </div>
            </footer>
        </div>
    );
}

