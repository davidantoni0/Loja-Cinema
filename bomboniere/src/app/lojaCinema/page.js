"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import MenuButton from "@/Components/Bomboniere/menubutton";
import SubMenuButton from "@/Components/Bomboniere/submenubutton";
import Cart from "@/Components/Bomboniere/cart";
import Link from "next/link";

export default function MenuLoja() {
    const [step, setStep] = useState("mainMenu");
    const [selectedItem, setSelectedItem] = useState();
    const [cart, setCart] = useState([]);
    const [menuData, setMenuData] = useState(null);  // Estado para armazenar os dados do menu

    // Carregar dados do JSON externamente
    useEffect(() => {
        const loadMenuData = async () => {
            const response = await fetch("menuData.json");
            if (!response.ok) {
                throw new Error(`Erro ao carregar o JSON: ${response.status}`);
            }
            const data = await response.json();
            setMenuData(data);
        };

        loadMenuData();
    }, []);

    const total = cart.reduce((acc, item) => acc + item.price, 0);

    // Carregar o estado do carrinho do localStorage
    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem("cartData"));
        if (storedData) {
            setCart(storedData.cart);
            setStep(storedData.step || "mainMenu");
            setSelectedItem(storedData.selectedItem);
        }
    }, []);

    // Salvar o estado do carrinho no localStorage
    useEffect(() => {
        const cartData = {
            cart,
            step,
            selectedItem,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem("cartData", JSON.stringify(cartData));
    }, [cart, step, selectedItem]);

    function handleClickMenu(item) {
        setSelectedItem(item.label);  // Ajuste aqui
        setStep("submenu");
    }

    function handleClickAddItem(size) {
        if (menuData && menuData.prices[selectedItem]) {
            const price = menuData.prices[selectedItem][size];
            const newItem = {
                item: selectedItem,
                size,
                price
            };

            setCart([...cart, newItem]);
            setStep("mainMenu");
        }
    }

    function handleClickRemoveItem(index) {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    }

    function handleClickClearCart() {
        setCart([]);
        localStorage.removeItem("cartData");  // Limpar os dados do localStorage
    }

    if (!menuData) {
        return <div>Carregando...</div>;
    }

    return (
        <div className={styles.menuLoja}>
            <div className={styles.menuInicio}>Bomboniere</div>

            {step === "mainMenu" && (
                <div className={styles.row}>
                    {menuData.menuItems.map((item, index) => (
                        <MenuButton 
                            key={index} 
                            label={item.label} 
                            onClick={() => handleClickMenu(item)}  // Passa o item completo
                            imageSrc={item.imageSrc} 
                        />
                    ))}
                </div>
            )}

            {step === "submenu" && selectedItem && (
                <div className={styles.row}>
                    <div className={styles.submenuTitle}>
                        Selecione o tamanho de {selectedItem.replace(/s$/, "")}:
                    </div>
                    {selectedItem && menuData.prices[selectedItem] ? (
                        Object.keys(menuData.prices[selectedItem]).map((size) => {
                            const price = menuData.prices[selectedItem][size];
                            return (
                                <SubMenuButton
                                    key={size}
                                    size={size}
                                    price={price}
                                    onClick={() => handleClickAddItem(size)}
                                />
                            );
                        })
                    ) : (
                        <p>Não há preços disponíveis para este item.</p>
                    )}
                    <button className={styles.button} onClick={() => setStep("mainMenu")}>Voltar ao Menu</button>
                </div>
            )}

            {step === "cart" && (
                <Cart 
                    cart={cart} 
                    total={total} 
                    handleClickRemoveItem={handleClickRemoveItem} 
                    handleClickClearCart={handleClickClearCart} 
                    setStep={setStep} 
                />
            )}
        

            <footer className={styles.footer}>
                <button className={styles.button} onClick={() => setStep("cart")}>Veja o Carrinho ({cart.length} itens)</button>
                
                <button className={styles.button}>
                    <Link href="../MenuPrincipal"> Menu Principal</Link>
                </button>
            </footer>
        </div>
    );
}

