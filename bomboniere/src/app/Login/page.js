"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Login() {
  return (
    <div>
      <header>
        <h1>Cine Senai</h1>
        <Link href="/">Voltar</Link>
      </header>
      <main>
        <form method="POST" name="login" id="login">
          <div>
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" maxLength={100} />
          </div>
          <div>
            <label htmlFor="senha">Senha</label>
            <input type="password" id="senha" name="senha" maxLength={30} />
          </div>
          <div>
            <p>Não possui conta?</p>
            <Link href="/Cadastro">Faça sua conta!</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
