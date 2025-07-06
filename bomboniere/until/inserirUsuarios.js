// inserirUsuarios.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query, where } from "firebase/firestore";

// 🔐 Substitua pelos dados reais do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDscqWqHk_Atx7lHsAwvSQUKkmThXOEB6s",
  authDomain: "cine-senai.firebaseapp.com",
  projectId: "cine-senai",
  storageBucket: "cine-senai.firebasestorage.app",
  messagingSenderId: "507213086330",
  appId: "1:507213086330:web:00b2d42ce40bb519e545c3"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔢 Lista embutida de 50 usuários com nomes de artistas
const usuarios = [
  {
    "cpf": "25896314789",
    "data_nascimento": "1980-06-04",
    "deficiencia": false,
    "email": "angelina.jolie@example.com",
    "cep": "12345000",
    "estudante": true,
    "funcionario": false,
    "nome": "Angelina Jolie",
    "senha": "senha123"
  },
  {
    "cpf": "12345678901",
    "data_nascimento": "1974-11-04",
    "deficiencia": false,
    "email": "leonardo.dicaprio@example.com",
    "cep": "54321000",
    "estudante": false,
    "funcionario": true,
    "nome": "Leonardo DiCaprio",
    "senha": "leo123"
  },
  {
    "cpf": "15935725863",
    "data_nascimento": "1965-02-07",
    "deficiencia": false,
    "email": "brad.pitt@example.com",
    "cep": "78910000",
    "estudante": false,
    "funcionario": false,
    "nome": "Brad Pitt",
    "senha": "bradpass"
  },
  {
    "cpf": "32165498700",
    "data_nascimento": "1992-03-26",
    "deficiencia": true,
    "email": "lady.gaga@example.com",
    "cep": "99887700",
    "estudante": true,
    "funcionario": false,
    "nome": "Lady Gaga",
    "senha": "gaga123"
  },
  {
    "cpf": "65498732109",
    "data_nascimento": "2005-09-15",
    "deficiencia": false,
    "email": "zendaya@example.com",
    "cep": "11223344",
    "estudante": true,
    "funcionario": false,
    "nome": "Zendaya",
    "senha": "zenda2023"
  },
  {
    "nome": "Anitta",
    "cpf": "48392015749",
    "data_nascimento": "1998-03-30",
    "deficiencia": false,
    "email": "anitta@gmail.com",
    "cep": "25619284",
    "estudante": true,
    "funcionario": false,
    "senha": "xkwp91zm02"
  },
  {
    "nome": "Caetano Veloso",
    "cpf": "91820374651",
    "data_nascimento": "1942-08-07",
    "deficiencia": false,
    "email": "caetano.veloso@terra.com.br",
    "cep": "25794018",
    "estudante": false,
    "funcionario": false,
    "senha": "lqom2912xp"
  },
  {
    "nome": "Adele",
    "cpf": "37491028563",
    "data_nascimento": "1988-05-05",
    "deficiencia": true,
    "email": "adele@gmail.com",
    "cep": "25647382",
    "estudante": false,
    "funcionario": false,
    "senha": "mdqwo2918xp"
  },
  {
    "nome": "Bob Dylan",
    "cpf": "47582910364",
    "data_nascimento": "1941-05-24",
    "deficiencia": false,
    "email": "bob.dylan@gmail.com",
    "cep": "25710938",
    "estudante": false,
    "funcionario": false,
    "senha": "wpqz8192lm"
  },
  {
    "nome": "Beyoncé",
    "cpf": "29381740561",
    "data_nascimento": "1981-09-04",
    "deficiencia": true,
    "email": "beyonce@gmail.com",
    "cep": "25790831",
    "estudante": false,
    "funcionario": false,
    "senha": "xmqp8129sl"
  },
  {
    "nome": "Chico Buarque",
    "cpf": "57182039476",
    "data_nascimento": "1944-06-19",
    "deficiencia": false,
    "email": "chico.buarque@gmail.com",
    "cep": "25620938",
    "estudante": false,
    "funcionario": false,
    "senha": "smpq1829kl"
  },
  {
    "nome": "Dua Lipa",
    "cpf": "91827364582",
    "data_nascimento": "1995-08-22",
    "deficiencia": true,
    "email": "dua.lipa@gmail.com",
    "cep": "25732840",
    "estudante": true,
    "funcionario": false,
    "senha": "azwq1289xp"
  },
  {
    "nome": "Elis Regina",
    "cpf": "83927410561",
    "data_nascimento": "1945-03-17",
    "deficiencia": false,
    "email": "elis.regina@terra.com.br",
    "cep": "25760294",
    "estudante": false,
    "funcionario": false,
    "senha": "qowm9218xl"
  },
  {
    "nome": "Frank Sinatra",
    "cpf": "47289130576",
    "data_nascimento": "1915-12-12",
    "deficiencia": true,
    "email": "frank.sinatra@uol.com.br",
    "cep": "25698274",
    "estudante": false,
    "funcionario": false,
    "senha": "mlqz8192xp"
  },
  {
    "nome": "Gal Costa",
    "cpf": "10394857261",
    "data_nascimento": "1945-09-26",
    "deficiencia": false,
    "email": "gal.costa@gmail.com",
    "cep": "25730842",
    "estudante": false,
    "funcionario": false,
    "senha": "xmpl1928aq"
  },
  {
    "nome": "Iggy Pop",
    "cpf": "21938475602",
    "data_nascimento": "1947-04-21",
    "deficiencia": false,
    "email": "iggy.pop@globo.com",
    "cep": "25613084",
    "estudante": false,
    "funcionario": false,
    "senha": "kqpm928xwl"
  },
  {
    "nome": "Janis Joplin",
    "cpf": "84729130564",
    "data_nascimento": "1943-01-19",
    "deficiencia": true,
    "email": "janis.joplin@hotmail.com",
    "cep": "25710927",
    "estudante": false,
    "funcionario": false,
    "senha": "zpql1928mx"
  },
  {
    "nome": "João Gilberto",
    "cpf": "92837410586",
    "data_nascimento": "1931-06-10",
    "deficiencia": false,
    "email": "joao.gilberto@ig.com.br",
    "cep": "25672348",
    "estudante": false,
    "funcionario": false,
    "senha": "qwpl9182mx"
  },
  {
    "nome": "Katy Perry",
    "cpf": "58391027485",
    "data_nascimento": "1984-10-25",
    "deficiencia": false,
    "email": "katy.perry@yahoo.com",
    "cep": "25780374",
    "estudante": true,
    "funcionario": false,
    "senha": "lmzp9812qx"
  },
  {
    "nome": "Lorde",
    "cpf": "29183740597",
    "data_nascimento": "1996-11-07",
    "deficiencia": true,
    "email": "lorde@bol.com.br",
    "cep": "25619038",
    "estudante": true,
    "funcionario": false,
    "senha": "aqzw1829pm"
  },
  {
    "nome": "Madonna",
    "cpf": "39018274615",
    "data_nascimento": "1958-08-16",
    "deficiencia": false,
    "email": "madonna@gmail.com",
    "cep": "25639824",
    "estudante": false,
    "funcionario": false,
    "senha": "zmxp9182aq"
  },
  {
    "nome": "Marília Mendonça",
    "cpf": "57829130497",
    "data_nascimento": "1995-07-22",
    "deficiencia": true,
    "email": "marilia.mendonca@uol.com.br",
    "cep": "25719384",
    "estudante": true,
    "funcionario": false,
    "senha": "kqwm1829pl"
  },
  {
    "nome": "Neymar Jr.",
    "cpf": "18093274856",
    "data_nascimento": "1992-02-05",
    "deficiencia": false,
    "email": "neymar.jr@gmail.com",
    "cep": "25745832",
    "estudante": false,
    "funcionario": false,
    "senha": "pqlz9128mx"
  },
  {
    "nome": "Olivia Rodrigo",
    "cpf": "93716420875",
    "data_nascimento": "2003-02-20",
    "deficiencia": true,
    "email": "olivia.rodrigo@uol.com.br",
    "cep": "25674218",
    "estudante": true,
    "funcionario": false,
    "senha": "awqp9128mx"
  },
  {
    "nome": "Paulo Gustavo",
    "cpf": "65487913209",
    "data_nascimento": "1978-10-30",
    "deficiencia": false,
    "email": "paulo.gustavo@yahoo.com",
    "cep": "25639176",
    "estudante": false,
    "funcionario": false,
    "senha": "xqml8291ap"
  },
  {
    "nome": "Queen Latifah",
    "cpf": "87410296357",
    "data_nascimento": "1970-03-18",
    "deficiencia": false,
    "email": "queen.latifah@globo.com",
    "cep": "25619834",
    "estudante": false,
    "funcionario": false,
    "senha": "aqpw9812mx"
  },
  {
    "nome": "Roberto Carlos",
    "cpf": "29384756190",
    "data_nascimento": "1941-04-19",
    "deficiencia": true,
    "email": "roberto.carlos@gmail.com",
    "cep": "25698021",
    "estudante": false,
    "funcionario": false,
    "senha": "lqow1928mx"
  },
  {
    "nome": "Sia",
    "cpf": "47281930476",
    "data_nascimento": "1975-12-18",
    "deficiencia": true,
    "email": "sia@terra.com.br",
    "cep": "25740123",
    "estudante": true,
    "funcionario": false,
    "senha": "mzql8192pw"
  },
  {
    "nome": "Taylor Swift",
    "cpf": "58392017485",
    "data_nascimento": "1989-12-13",
    "deficiencia": false,
    "email": "taylor.swift@hotmail.com",
    "cep": "25730948",
    "estudante": false,
    "funcionario": false,
    "senha": "slpm9182xq"
  },
  {
    "nome": "Vince Vaughn",
    "cpf": "10928475632",
    "data_nascimento": "1970-03-28",
    "deficiencia": true,
    "email": "vince.vaughn@bol.com.br",
    "cep": "25750192",
    "estudante": false,
    "funcionario": false,
    "senha": "qzml9182pw"
  },
  {
    "nome": "Whitney Houston",
    "cpf": "76190384572",
    "data_nascimento": "1963-08-09",
    "deficiencia": false,
    "email": "whitney.houston@ig.com.br",
    "cep": "25632019",
    "estudante": false,
    "funcionario": false,
    "senha": "zmlp9182qw"
  },
  {
    "nome": "Xuxa Meneghel",
    "cpf": "38572910468",
    "data_nascimento": "1963-03-27",
    "deficiencia": false,
    "email": "xuxa.meneghel@gmail.com",
    "cep": "25739824",
    "estudante": false,
    "funcionario": false,
    "senha": "lpqm9182xz"
  },
  {
    "nome": "Yara Shahidi",
    "cpf": "61829034715",
    "data_nascimento": "2000-02-10",
    "deficiencia": true,
    "email": "yara.shahidi@uol.com.br",
    "cep": "25680492",
    "estudante": true,
    "funcionario": false,
    "senha": "mxqp9182lz"
  },
  {
    "nome": "Zeca Pagodinho",
    "cpf": "47290138562",
    "data_nascimento": "1959-02-04",
    "deficiencia": false,
    "email": "zeca.pagodinho@terra.com.br",
    "cep": "25672038",
    "estudante": false,
    "funcionario": false,
    "senha": "qpwl9182mx"
  }
];

// 🎯 MÉTODO 1: Usando CPF como ID do documento (RECOMENDADO)
// Vantagem: Simples, rápido e eficiente
async function inserirUsuariosComCPF() {
  console.log("🚀 Iniciando inserção com CPF como ID...");
  
  for (const usuario of usuarios) {
    try {
      // Usa o CPF como ID do documento
      const docRef = doc(db, "usuarios", usuario.cpf);
      
      // setDoc com merge: false vai sobrescrever se já existir
      // setDoc sem merge vai criar se não existir
      await setDoc(docRef, usuario);
      
      console.log(`✅ Usuário ${usuario.nome} inserido/atualizado com ID: ${usuario.cpf}`);
    } catch (error) {
      console.error(`❌ Erro ao inserir ${usuario.nome}:`, error);
    }
  }
  
  console.log("✨ Processo concluído!");
}

// 🎯 MÉTODO 2: Verificando se já existe antes de inserir
async function inserirUsuariosComVerificacao() {
  console.log("🚀 Iniciando inserção com verificação...");
  
  for (const usuario of usuarios) {
    try {
      // Verifica se já existe um usuário com este CPF
      const q = query(collection(db, "usuarios"), where("cpf", "==", usuario.cpf));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Se não existe, insere
        await addDoc(collection(db, "usuarios"), usuario);
        console.log(`✅ Usuário ${usuario.nome} inserido`);
      } else {
        console.log(`⚠️ Usuário ${usuario.nome} já existe (CPF: ${usuario.cpf})`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${usuario.nome}:`, error);
    }
  }
  
  console.log("✨ Processo concluído!");
}

// 🎯 MÉTODO 3: Usando documento de controle
async function inserirUsuariosComControle() {
  console.log("🚀 Iniciando inserção com controle...");
  
  // Verifica se já foi executado
  const controleRef = doc(db, "controle", "usuarios_inseridos");
  const controleDoc = await getDoc(controleRef);
  
  if (controleDoc.exists()) {
    console.log("⚠️ Usuários já foram inseridos anteriormente!");
    return;
  }
  
  // Se não foi executado, insere os usuários
  for (const usuario of usuarios) {
    try {
      await addDoc(collection(db, "usuarios"), usuario);
      console.log(`✅ Usuário ${usuario.nome} inserido`);
    } catch (error) {
      console.error(`❌ Erro ao inserir ${usuario.nome}:`, error);
    }
  }
  
  // Marca como executado
  await setDoc(controleRef, {
    executado: true,
    data_execucao: new Date(),
    total_usuarios: usuarios.length
  });
  
  console.log("✨ Processo concluído e marcado como executado!");
}

// 🎯 MÉTODO 4: Usando batch para inserção atômica
async function inserirUsuariosComBatch() {
  console.log("🚀 Iniciando inserção com batch...");
  
  const { writeBatch } = await import("firebase/firestore");
  const batch = writeBatch(db);
  
  usuarios.forEach((usuario) => {
    // Usa CPF como ID do documento
    const docRef = doc(db, "usuarios", usuario.cpf);
    batch.set(docRef, usuario);
  });
  
  try {
    await batch.commit();
    console.log("✅ Todos os usuários foram inseridos com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inserir usuários:", error);
  }
}

// 🚀 Executa o método escolhido
// Descomente apenas UMA das opções abaixo:

// OPÇÃO 1: Recomendada - Usa CPF como ID
inserirUsuariosComCPF();

// OPÇÃO 2: Verifica antes de inserir
// inserirUsuariosComVerificacao();

// OPÇÃO 3: Usa documento de controle
// inserirUsuariosComControle();

// OPÇÃO 4: Inserção em lote (batch)
// inserirUsuariosComBatch();