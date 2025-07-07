"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
// --- MODIFICADO: Adicionado 'updateDoc' para salvar o desconto no banco ---
import { doc, getDoc, updateDoc } from "firebase/firestore";

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

            // --- INÍCIO DA NOVA LÓGICA DE DESCONTO ---

            // 1. Calcular a idade a partir da data_nascimento
            let temDireitoADesconto = false;
            if (dados.data_nascimento) {
              const hoje = new Date();
              // Garantir que a data seja interpretada corretamente
              const dataNascimento = new Date(dados.data_nascimento + "T00:00:00");
              let idade = hoje.getFullYear() - dataNascimento.getFullYear();
              const m = hoje.getMonth() - dataNascimento.getMonth();
              if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
                idade--;
              }

              // 2. Verificar as condições para o desconto
              const menorDeIdade = idade < 18;
              const maiorDe65Anos = idade > 65;
              temDireitoADesconto = menorDeIdade || maiorDe65Anos || dados.estudante === true || dados.deficiente === true;
              
              // 3. (Opcional) Atualiza o documento no Firestore com os dados calculados
              try {
                  await updateDoc(docRef, {
                      desconto: temDireitoADesconto,
                      menorDeIdade: menorDeIdade,
                      maiorDe65Anos: maiorDe65Anos,
                  });
              } catch (updateError) {
                  console.error("Erro ao atualizar o desconto no Firestore:", updateError);
              }
            }
            
            // --- FIM DA NOVA LÓGICA DE DESCONTO ---

            // Monta o objeto final do usuário, incluindo o campo 'desconto'
            const usuarioCompleto = {
              uid,
              email: user.email,
              nome: dados.nome || user.email,
              dataNascimento: dados.data_nascimento || "",
              estudante: dados.estudante === true,
              deficiente: dados.deficiente === true,
              funcionario: dados.funcionario === true,
              desconto: temDireitoADesconto, // <-- NOVO CAMPO ADICIONADO AQUI
            };

            setUsuario(usuarioCompleto);

            // O localStorage já vai funcionar corretamente pois usa o 'usuarioCompleto'
            if (typeof window !== "undefined") {
              localStorage.setItem("dadosUsuarioLogado", JSON.stringify(usuarioCompleto));
            }
          } else {
            // Se o documento não existe, o usuário não tem dados para desconto
            const usuarioBasico = {
              uid,
              email: user.email,
              nome: user.email,
              dataNascimento: "",
              estudante: false,
              deficiente: false,
              funcionario: false,
              desconto: false, // <-- NOVO CAMPO ADICIONADO AQUI
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
            desconto: false, // <-- NOVO CAMPO ADICIONADO AQUI
          });
        }
      } else {
        setUsuario(null);
        if (typeof window !== "undefined") {
            localStorage.removeItem("dadosUsuarioLogado");
        }
      }

      setLoadingUsuario(false);
    });

    return () => unsubscribe();
  }, []);

  return { usuario, loadingUsuario };
}