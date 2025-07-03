import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function useUsuario() {
  const [usuario, setUsuario] = useState(null);
  const [loadingUsuario, setLoadingUsuario] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const dadosUsuarioLS = localStorage.getItem("dadosUsuarioLogado");
        if (dadosUsuarioLS) {
          setUsuario(JSON.parse(dadosUsuarioLS));
          setLoadingUsuario(false);
          return;
        }

        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const dados = docSnap.data();
            const usuarioCompleto = {
              uid: user.uid,
              email: user.email,
              nome: dados.nome || user.email,
              dataNascimento: dados.data_nascimento || "",
              estudante: dados.estudante === true,
              deficiente: dados.deficiencia === true,
              funcionario: dados.funcionario === true,
            };
            setUsuario(usuarioCompleto);
            localStorage.setItem("dadosUsuarioLogado", JSON.stringify(usuarioCompleto));
          } else {
            const usuarioBasico = {
              uid: user.uid,
              email: user.email,
              nome: user.email,
              estudante: false,
              deficiente: false,
              funcionario: false,
            };
            setUsuario(usuarioBasico);
            localStorage.setItem("dadosUsuarioLogado", JSON.stringify(usuarioBasico));
          }
        } else {
          setUsuario(null);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setUsuario(null);
      } finally {
        setLoadingUsuario(false);
      }
    }

    carregarUsuario();
  }, []);

  return { usuario, loadingUsuario };
}
