
"use client";
import { useState } from "react";
import styles from "./page.module.css"
export default function Login() {
 
    return(
        <div>
            <header>
                <h1>Cine Senai</h1>
                <a href="bomboniere\src\app\page.js">Voltar</a>
            </header>
            <main>
                <form method="POST" name="login" id="login">
                    <div>
                        <label htmlFor="email"> E-mail </label>
                        <input type="email" id="email" name="email" maxLength={100}></input>
                    </div>
                    <div>
                        <label htmlFor="senha">Senha</label>
                        <input type="password" id="senha" name="senha" maxLength={30}></input>
                    </div>
                    <div>
                        <p>Não possui conta?</p>
                        <a href="#">Faça sua conta!</a>
                    </div>

                    
                </form>
            </main>
        </div>

    );
}
