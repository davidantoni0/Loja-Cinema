"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function useUsuario() {
  const [usuario, setUsuario] = useState(null);
  const [loadingUsuario, setLoadingUsuario] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const uid = user.uid;
          const docRef = doc(db, "usuarios", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();

            const usuarioCompleto = {
              uid,
              email: user.email,
              nome: dados.nome || user.email,
              dataNascimento: dados.data_nascimento || "",
              estudante: dados.estudante === true,
              deficiente: dados.deficiente === true,  // corrigido aqui
              funcionario: dados.funcionario === true,
            };

            setUsuario(usuarioCompleto);

            if (typeof window !== "undefined") {
              localStorage.setItem("dadosUsuarioLogado", JSON.stringify(usuarioCompleto));
            }
          } else {
            const usuarioBasico = {
              uid,
              email: user.email,
              nome: user.email,
              dataNascimento: "",
              estudante: false,
              deficiente: false,
              funcionario: false,
            };
            setUsuario(usuarioBasico);

            if (typeof window !== "undefined") {
              localStorage.setItem("dadosUsuarioLogado", JSON.stringify(usuarioBasico));
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setUsuario({
            uid: user.uid,
            email: user.email,
            nome: user.email,
            dataNascimento: "",
            estudante: false,
            deficiente: false,
            funcionario: false,
          });
        }
      } else {
        setUsuario(null);
      }

      setLoadingUsuario(false);
    });

    return () => unsubscribe();
  }, []);

  return { usuario, loadingUsuario };
}
