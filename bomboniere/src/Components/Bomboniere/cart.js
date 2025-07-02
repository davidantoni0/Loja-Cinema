import React from 'react';
import styles from './cart.module.css';

function Cart({ cart, total, handleClickRemoveItem, handleClickClearCart, setStep }) {
    return (
        <div className={styles.cartMenu}>
            <h2>Seu Carrinho</h2>
            {cart.length === 0 ? (
                <p>O carrinho está vazio.</p>
            ) : (
                <ul>
                    {cart.map((item, index) => (
                        <li key={index}>
                            {item.item.replace(/s$/, "")} - Tamanho {item.size} - R${item.price.toFixed(2)}
                            <button className={styles.removeButton} onClick={() => handleClickRemoveItem(index)}>Remover</button>
                        </li>
                    ))}
                </ul>
            )}
            <p className={styles.total}>Total: R$ {total.toFixed(2)}</p>
            <div className={styles.cartFinalActions}>
                <button className={styles.button} onClick={() => setStep("mainMenu")}>
                    Voltar ao Menu
                </button>
                <button className={styles.button} onClick={handleClickClearCart}>
                    Limpar o carrinho
                </button>
            </div>
            
        </div>
    );
}

//npm install pluralize

//import pluralize from 'pluralize';

//function getSingular(label) {
//    return pluralize.singular(label);
//}


export default Cart;
