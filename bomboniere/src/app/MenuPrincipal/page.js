"use client";
import { useEffect, useState } from "react";
import Link from "next/link"; // ✅ IMPORTAÇÃO CORRETA

export default function MenuPrincipal() {
  const [nome, setNome] = useState("");

  useEffect(() => {
    const nomeSalvo = localStorage.getItem("nomeUsuario");
    if (nomeSalvo) {
      setNome(nomeSalvo);
    }
  }, []);

  return (
    <div>
      <h2>Olá, {nome}</h2>
      <Link href="/filmes-assentos">Compre seu ingresso!</Link>
      <br/>
      <Link href="/lojaCinema">Conheça nossa Bomboniere!</Link>
    </div>
  );
}
