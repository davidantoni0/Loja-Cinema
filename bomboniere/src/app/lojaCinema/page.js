"use client";
import { useState } from "react";
import styles from "./page.module.css"

export default function MenuLoja() {
    const [step, setStep] = useState("mainMenu");
    const [selectedItem, setSelectedItem] = useState();
    const [cart, setCart] = useState([]);

    const prices = {
        Pipoca: { "Pequeno": 5.0, "Médio": 7.5, "Grande": 10.0 },
        Refrigerante: { "Pequeno": 4.0, "Médio": 6.0, "Grande": 8.0 },
        Doce: { "Pequeno": 2.5, "Médio": 4.0, "Grande": 5.5 },
        Biscoito: { "Pequeno": 3.0, "Médio": 4.5, "Grande": 6.0 }
    };

    function handleClickMenu(item) {
        setSelectedItem(item);
        setStep("submenu");
    };

    function handleClickAddItem(size) {
        const price = prices[selectedItem][size];

        const newItem = {
            item: selectedItem,
            size,
            price
        };

        setCart([...cart, newItem]);
        setStep("mainMenu");
    };

    function handleClickRemoveItem(index) {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    }


    function handleClickClearCart() {
        setCart([]);
        setStep("mainMenu");
    }

    return(
        <div className={styles.menuLoja}>
            <div className={styles.menuInicio}>Bomboniere</div>

            {step === "mainMenu" && (

            <div className={styles.row}>
                <button className={styles.button} onClick={() => handleClickMenu("Pipoca")}>Pipocas</button>
                <button className={styles.button} onClick={() => handleClickMenu("Refrigerante")}>Refrigerantes</button>
                <button className={styles.button} onClick={() => handleClickMenu("Doce")}>Doces</button>
                <button className={styles.button} onClick={() => handleClickMenu("Biscoito")}>Biscoitos</button>
            </div>
            )}
            
            {step === "submenu" && (
            <div className={styles.submenu}>
            <div className={styles.submenuTitle}>
                Selecione o tamanho de {selectedItem}:
            </div>
            <button className={styles.button} onClick={() => handleClickAddItem("Pequeno")}>Pequeno</button>
            <button className={styles.button} onClick={() => handleClickAddItem("Médio")}>Médio</button>
            <button className={styles.button} onClick={() => handleClickAddItem("Grande")}>Grande</button>
            </div>
            )}

            {step === "cart" && (
            <div className={styles.cartMenu}>
                <h2>Seu Carrinho</h2>
                {cart.length === 0 ? (
                <p>O carrinho está vazio.</p>
                ) : (
                <ul>
                    {cart.map((item, index) => (
                    <li key={index}>
                        {item.item} - Tamanho {item.size} - R${item.price.toFixed(2)}

                        <button className={styles.removeButton}onClick={() => handleClickRemoveItem(index)}>Remover</button>
                    </li>
                    ))}
                </ul>
                )}
                <button className={styles.button} onClick={() => setStep("mainMenu")}>
                Voltar ao Menu
                </button>
            </div>
            )}

            <footer className={styles.footer}>
                <button className={styles.button} onClick={() => setStep("cart")}>Veja o Carrinho ({cart.length} itens)</button>
                <button className={styles.button} onClick={() => handleClickClearCart()}>Limpar o carrinho</button>
            </footer>
        </div>
    );
}
