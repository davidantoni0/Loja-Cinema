// inserirCompras.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";

// 🔐 Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDscqWqHk_Atx7lHsAwvSQUKkmThXOEB6s",
  authDomain: "cine-senai.firebaseapp.com",
  projectId: "cine-senai",
  storageBucket: "cine-senai.firebasestorage.app",
  messagingSenderId: "507213086330",
  appId: "1:507213086330:web:00b2d42ce40bb519e545c3"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🛒 Lista de compras/pedidos
const compras = [
  {
    "dataCompra": "16 de junho de 2025 às 14:23:15 UTC-3",
    "email": "angelina.jolie@example.com",
    "itens": [
      {
        "item": "Pipoca Pequeno",
        "precoTotal": 20.0,
        "precoUnitario": 10.0,
        "quantidade": 2,
        "tamanho": "pequeno"
      }
    ],
    "nome": "Angelina Jolie",
    "pago": true,
    "total": 69.0,
    "usuarioId": "user_angelina_035"
  },
  {
    "dataCompra": "21 de junho de 2025 às 10:35:21 UTC-3",
    "email": "leonardo.dicaprio@example.com",
    "itens": [
      {
        "item": "Olho-de-sogra",
        "precoTotal": 56.0,
        "precoUnitario": 8.0,
        "quantidade": 7,
        "tamanho": "único"
      },
      {
        "item": "Cajuzinho",
        "precoTotal": 40.0,
        "precoUnitario": 8.0,
        "quantidade": 5,
        "tamanho": "único"
      }
    ],
    "nome": "Leonardo DiCaprio",
    "pago": true,
    "total": 96.0,
    "usuarioId": "user_leonardo_036"
  },
  {
    "dataCompra": "22 de junho de 2025 às 14:48:33 UTC-3",
    "email": "brad.pitt@example.com",
    "itens": [
      {
        "item": "Porção de Aipim frito",
        "precoTotal": 200.0,
        "precoUnitario": 40.0,
        "quantidade": 5,
        "tamanho": "único"
      },
      {
        "item": "Refrigerante Médio",
        "precoTotal": 60.0,
        "precoUnitario": 15.0,
        "quantidade": 4,
        "tamanho": "médio"
      }
    ],
    "nome": "Brad Pitt",
    "pago": true,
    "total": 260.0,
    "usuarioId": "user_brad_037"
  },
  {
    "dataCompra": "23 de junho de 2025 às 16:27:19 UTC-3",
    "email": "lady.gaga@example.com",
    "itens": [
      {
        "item": "Chocolate",
        "precoTotal": 105.0,
        "precoUnitario": 15.0,
        "quantidade": 7,
        "tamanho": "único"
      },
      {
        "item": "Doce de Abóbora",
        "precoTotal": 42.0,
        "precoUnitario": 7.0,
        "quantidade": 6,
        "tamanho": "único"
      }
    ],
    "nome": "Lady Gaga",
    "pago": true,
    "total": 147.0,
    "usuarioId": "user_ladygaga_038"
  },
  {
    "dataCompra": "24 de junho de 2025 às 13:51:45 UTC-3",
    "email": "zendaya@example.com",
    "itens": [
      {
        "item": "Pipoca Grande",
        "precoTotal": 140.0,
        "precoUnitario": 35.0,
        "quantidade": 4,
        "tamanho": "grande"
      },
      {
        "item": "Água da Mineral",
        "precoTotal": 48.0,
        "precoUnitario": 8.0,
        "quantidade": 6,
        "tamanho": "único"
      }
    ],
    "nome": "Zendaya",
    "pago": true,
    "total": 188.0,
    "usuarioId": "user_zendaya_039"
  },
  {
    "dataCompra": "25 de junho de 2025 às 09:16:52 UTC-3",
    "email": "anitta@gmail.com",
    "itens": [
      {
        "item": "Pipoca Pequeno",
        "precoTotal": 80.0,
        "precoUnitario": 10.0,
        "quantidade": 8,
        "tamanho": "pequeno"
      },
      {
        "item": "Refrigerante Grande",
        "precoTotal": 60.0,
        "precoUnitario": 12.0,
        "quantidade": 5,
        "tamanho": "grande"
      }
    ],
    "nome": "Anitta",
    "pago": true,
    "total": 140.0,
    "usuarioId": "user_anitta_040"
  },
  {
    "dataCompra": "26 de junho de 2025 às 18:33:28 UTC-3",
    "email": "caetano.veloso@terra.com.br",
    "itens": [
      {
        "item": "Costelinha suína",
        "precoTotal": 320.0,
        "precoUnitario": 80.0,
        "quantidade": 4,
        "tamanho": "único"
      },
      {
        "item": "Suco de de gorselha, que parece tamarindo com sabor de limão",
        "precoTotal": 297.0,
        "precoUnitario": 99.0,
        "quantidade": 3,
        "tamanho": "único"
      }
    ],
    "nome": "Caetano Veloso",
    "pago": true,
    "total": 617.0,
    "usuarioId": "user_caetano_041"
  },
  {
    "dataCompra": "27 de junho de 2025 às 12:45:17 UTC-3",
    "email": "adele@gmail.com",
    "itens": [
      {
        "item": "Figo cristalizado",
        "precoTotal": 56.0,
        "precoUnitario": 7.0,
        "quantidade": 8,
        "tamanho": "único"
      },
      {
        "item": "Cajuzinho",
        "precoTotal": 56.0,
        "precoUnitario": 8.0,
        "quantidade": 7,
        "tamanho": "único"
      }
    ],
    "nome": "Adele",
    "pago": true,
    "total": 112.0,
    "usuarioId": "user_adele_042"
  },
  {
    "dataCompra": "28 de junho de 2025 às 15:22:39 UTC-3",
    "email": "bob.dylan@gmail.com",
    "itens": [
      {
        "item": "Pipoca Médio",
        "precoTotal": 100.0,
        "precoUnitario": 20.0,
        "quantidade": 5,
        "tamanho": "médio"
      },
      {
        "item": "Refrigerante Pequeno",
        "precoTotal": 40.0,
        "precoUnitario": 10.0,
        "quantidade": 4,
        "tamanho": "pequeno"
      }
    ],
    "nome": "Bob Dylan",
    "pago": true,
    "total": 140.0,
    "usuarioId": "user_bob_043"
  },
  {
    "dataCompra": "29 de junho de 2025 às 11:58:46 UTC-3",
    "email": "beyonce@gmail.com",
    "itens": [
      {
        "item": "Olho-de-sogra",
        "precoTotal": 64.0,
        "precoUnitario": 8.0,
        "quantidade": 8,
        "tamanho": "único"
      },
      {
        "item": "Doce de Abóbora",
        "precoTotal": 49.0,
        "precoUnitario": 7.0,
        "quantidade": 7,
        "tamanho": "único"
      }
    ],
    "nome": "Beyoncé",
    "pago": true,
    "total": 113.0,
    "usuarioId": "user_beyonce_044"
  },
  {
    "dataCompra": "30 de junho de 2025 às 17:14:23 UTC-3",
    "email": "chico.buarque@gmail.com",
    "itens": [
      {
        "item": "Porção de Aipim frito",
        "precoTotal": 240.0,
        "precoUnitario": 40.0,
        "quantidade": 6,
        "tamanho": "único"
      },
      {
        "item": "Chocolate",
        "precoTotal": 120.0,
        "precoUnitario": 15.0,
        "quantidade": 8,
        "tamanho": "único"
      }
    ],
    "nome": "Chico Buarque",
    "pago": true,
    "total": 360.0,
    "usuarioId": "user_chico_045"
  },
  {
    "dataCompra": "1 de julho de 2025 às 08:37:51 UTC-3",
    "email": "dua.lipa@gmail.com",
    "itens": [
      {
        "item": "Pipoca Grande",
        "precoTotal": 175.0,
        "precoUnitario": 35.0,
        "quantidade": 5,
        "tamanho": "grande"
      },
      {
        "item": "Refrigerante Médio",
        "precoTotal": 75.0,
        "precoUnitario": 15.0,
        "quantidade": 5,
        "tamanho": "médio"
      }
    ],
    "nome": "Dua Lipa",
    "pago": true,
    "total": 250.0,
    "usuarioId": "user_dua_046"
  },
  {
    "dataCompra": "2 de julho de 2025 às 14:29:18 UTC-3",
    "email": "elis.regina@terra.com.br",
    "itens": [
      {
        "item": "Água da Mineral",
        "precoTotal": 72.0,
        "precoUnitario": 8.0,
        "quantidade": 9,
        "tamanho": "único"
      },
      {
        "item": "Figo cristalizado",
        "precoTotal": 63.0,
        "precoUnitario": 7.0,
        "quantidade": 9,
        "tamanho": "único"
      }
    ],
    "nome": "Elis Regina",
    "pago": true,
    "total": 135.0,
    "usuarioId": "user_elis_047"
  },
  {
    "dataCompra": "3 de julho de 2025 às 19:41:35 UTC-3",
    "email": "frank.sinatra@uol.com.br",
    "itens": [
      {
        "item": "Costelinha suína",
        "precoTotal": 400.0,
        "precoUnitario": 80.0,
        "quantidade": 5,
        "tamanho": "único"
      },
      {
        "item": "Pipoca Pequeno",
        "precoTotal": 90.0,
        "precoUnitario": 10.0,
        "quantidade": 9,
        "tamanho": "pequeno"
      }
    ],
    "nome": "Frank Sinatra",
    "pago": true,
    "total": 490.0,
    "usuarioId": "user_frank_048"
  },
  {
    "dataCompra": "4 de julho de 2025 às 16:53:42 UTC-3",
    "email": "gal.costa@gmail.com",
    "itens": [
      {
        "item": "Cajuzinho",
        "precoTotal": 80.0,
        "precoUnitario": 8.0,
        "quantidade": 10,
        "tamanho": "único"
      },
      {
        "item": "Refrigerante Grande",
        "precoTotal": 72.0,
        "precoUnitario": 12.0,
        "quantidade": 6,
        "tamanho": "grande"
      }
    ],
    "nome": "Gal Costa",
    "pago": true,
    "total": 152.0,
    "usuarioId": "user_gal_049"
  },
  {
    "dataCompra": "5 de julho de 2025 às 10:26:59 UTC-3",
    "email": "iggy.pop@globo.com",
    "itens": [
      {
        "item": "Suco de de gorselha, que parece tamarindo com sabor de limão",
        "precoTotal": 495.0,
        "precoUnitario": 99.0,
        "quantidade": 5,
        "tamanho": "único"
      },
      {
        "item": "Chocolate",
        "precoTotal": 150.0,
        "precoUnitario": 15.0,
        "quantidade": 10,
        "tamanho": "único"
      }
    ],
    "nome": "Iggy Pop",
    "pago": true,
    "total": 645.0,
    "usuarioId": "user_iggy_050"
  },
  {
    "dataCompra": "16 de junho de 2025 às 14:23:15 UTC-3",
    "email": "angelina.jolie@example.com",
    "itens": [
      {
        "item": "Pipoca Pequeno",
        "precoTotal": 20.0,
        "precoUnitario": 10.0,
        "quantidade": 2,
        "tamanho": "pequeno"
      },
      {
        "item": "Refrigerante Médio",
        "precoTotal": 15.0,
        "precoUnitario": 15.0,
        "quantidade": 1,
        "tamanho": "médio"
      }
    ],
    "nome": "Angelina Jolie",
    "pago": true,
    "total": 35.0,
    "usuarioId": "user_angelina_001"
  },
  {
    "dataCompra": "17 de junho de 2025 às 10:45:32 UTC-3",
    "email": "leonardo.dicaprio@example.com",
    "itens": [
      {
        "item": "Costelinha suína",
        "precoTotal": 80.0,
        "precoUnitario": 80.0,
        "quantidade": 1,
        "tamanho": "único"
      },
      {
        "item": "Pipoca Grande",
        "precoTotal": 35.0,
        "precoUnitario": 35.0,
        "quantidade": 1,
        "tamanho": "grande"
      }
    ],
    "nome": "Leonardo DiCaprio",
    "pago": true,
    "total": 115.0,
    "usuarioId": "user_leonardo_002"
  },
  {
    "dataCompra": "18 de junho de 2025 às 19:12:44 UTC-3",
    "email": "brad.pitt@example.com",
    "itens": [
      {
        "item": "Chocolate",
        "precoTotal": 45.0,
        "precoUnitario": 15.0,
        "quantidade": 3,
        "tamanho": "único"
      },
      {
        "item": "Água da Mineral",
        "precoTotal": 16.0,
        "precoUnitario": 8.0,
        "quantidade": 2,
        "tamanho": "único"
      }
    ],
    "nome": "Brad Pitt",
    "pago": true,
    "total": 61.0,
    "usuarioId": "user_brad_003"
  },
  {
    "dataCompra": "19 de junho de 2025 às 16:33:21 UTC-3",
    "email": "lady.gaga@example.com",
    "itens": [
      {
        "item": "Cajuzinho",
        "precoTotal": 24.0,
        "precoUnitario": 8.0,
        "quantidade": 3,
        "tamanho": "único"
      },
      {
        "item": "Doce de Abóbora",
        "precoTotal": 14.0,
        "precoUnitario": 7.0,
        "quantidade": 2,
        "tamanho": "único"
      }
    ],
    "nome": "Lady Gaga",
    "pago": true,
    "total": 38.0,
    "usuarioId": "user_ladygaga_004"
  },
  {
    "dataCompra": "20 de junho de 2025 às 11:55:17 UTC-3",
    "email": "zendaya@example.com",
    "itens": [
      {
        "item": "Pipoca Médio",
        "precoTotal": 20.0,
        "precoUnitario": 20.0,
        "quantidade": 1,
        "tamanho": "médio"
      },
      {
        "item": "Refrigerante Pequeno",
        "precoTotal": 20.0,
        "precoUnitario": 10.0,
        "quantidade": 2,
        "tamanho": "pequeno"
      }
    ],
    "nome": "Zendaya",
    "pago": true,
    "total": 40.0,
    "usuarioId": "user_zendaya_005"
  },
  {
    "dataCompra": "21 de junho de 2025 às 13:27:39 UTC-3",
    "email": "anitta@gmail.com",
    "itens": [
      {
        "item": "Porção de Aipim frito",
        "precoTotal": 40.0,
        "precoUnitario": 40.0,
        "quantidade": 1,
        "tamanho": "único"
      },
      {
        "item": "Refrigerante Grande",
        "precoTotal": 12.0,
        "precoUnitario": 12.0,
        "quantidade": 1,
        "tamanho": "grande"
      }
    ],
    "nome": "Anitta",
    "pago": true,
    "total": 52.0,
    "usuarioId": "user_anitta_006"
  },
  {
    "dataCompra": "22 de junho de 2025 às 15:41:23 UTC-3",
    "email": "caetano.veloso@terra.com.br",
    "itens": [
      {
        "item": "Figo cristalizado",
        "precoTotal": 21.0,
        "precoUnitario": 7.0,
        "quantidade": 3,
        "tamanho": "único"
      },
      {
        "item": "Olho-de-sogra",
        "precoTotal": 16.0,
        "precoUnitario": 8.0,
        "quantidade": 2,
        "tamanho": "único"
      }
    ],
    "nome": "Caetano Veloso",
    "pago": true,
    "total": 37.0,
    "usuarioId": "user_caetano_007"
  },
  {
    "dataCompra": "23 de junho de 2025 às 18:14:56 UTC-3",
    "email": "adele@gmail.com",
    "itens": [
      {
        "item": "Chocolate",
        "precoTotal": 30.0,
        "precoUnitario": 15.0,
        "quantidade": 2,
        "tamanho": "único"
      },
      {
        "item": "Pipoca Pequeno",
        "precoTotal": 30.0,
        "precoUnitario": 10.0,
        "quantidade": 3,
        "tamanho": "pequeno"
      }
    ],
    "nome": "Adele",
    "pago": true,
    "total": 60.0,
    "usuarioId": "user_adele_008"
  },
  {
    "dataCompra": "24 de junho de 2025 às 09:32:11 UTC-3",
    "email": "bob.dylan@gmail.com",
    "itens": [
      {
        "item": "Costelinha suína",
        "precoTotal": 160.0,
        "precoUnitario": 80.0,
        "quantidade": 2,
        "tamanho": "único"
      },
      {
        "item": "Água da Mineral",
        "precoTotal": 8.0,
        "precoUnitario": 8.0,
        "quantidade": 1,
        "tamanho": "único"
      }
    ],
    "nome": "Bob Dylan",
    "pago": true,
    "total": 168.0,
    "usuarioId": "user_bob_009"
  },
  {
    "dataCompra": "25 de junho de 2025 às 12:48:37 UTC-3",
    "email": "beyonce@gmail.com",
    "itens": [
      {
        "item": "Suco de de gorselha, que parece tamarindo com sabor de limão",
        "precoTotal": 99.0,
        "precoUnitario": 99.0,
        "quantidade": 1,
        "tamanho": "único"
      }
    ],
    "nome": "Beyoncé",
    "pago": true,
    "total": 99.0,
    "usuarioId": "user_beyonce_010"
  },
  {
    "dataCompra": "26 de junho de 2025 às 14:15:29 UTC-3",
    "email": "chico.buarque@gmail.com",
    "itens": [
      {
        "item": "Pipoca Grande",
        "precoTotal": 35.0,
        "precoUnitario": 35.0,
        "quantidade": 1,
        "tamanho": "grande"
      },
      {
        "item": "Refrigerante Médio",
        "precoTotal": 30.0,
        "precoUnitario": 15.0,
        "quantidade": 2,
        "tamanho": "médio"
      }
    ],
    "nome": "Chico Buarque",
    "pago": true,
    "total": 65.0,
    "usuarioId": "user_chico_011"
  },
  {
    "dataCompra": "27 de junho de 2025 às 16:22:45 UTC-3",
    "email": "dua.lipa@gmail.com",
    "itens": [
      {
        "item": "Cajuzinho",
        "precoTotal": 32.0,
        "precoUnitario": 8.0,
        "quantidade": 4,
        "tamanho": "único"
      },
      {
        "item": "Doce de Abóbora",
        "precoTotal": 7.0,
        "precoUnitario": 7.0,
        "quantidade": 1,
        "tamanho": "único"
      }
    ],
    "nome": "Dua Lipa",
    "pago": true,
    "total": 39.0,
    "usuarioId": "user_dua_012"
  },
  {
    "dataCompra": "28 de junho de 2025 às 11:37:52 UTC-3",
    "email": "elis.regina@terra.com.br",
    "itens": [
      {
        "item": "Porção de Aipim frito",
        "precoTotal": 80.0,
        "precoUnitario": 40.0,
        "quantidade": 2,
        "tamanho": "único"
      },
      {
        "item": "Refrigerante Grande",
        "precoTotal": 24.0,
        "precoUnitario": 12.0,
        "quantidade": 2,
        "tamanho": "grande"
      }
    ],
    "nome": "Elis Regina",
    "pago": true,
    "total": 104.0,
    "usuarioId": "user_elis_013"
  },
  {
    "dataCompra": "29 de junho de 2025 às 17:43:18 UTC-3",
    "email": "frank.sinatra@uol.com.br",
    "itens": [
      {
        "item": "Chocolate",
        "precoTotal": 60.0,
        "precoUnitario": 15.0,
        "quantidade": 4,
        "tamanho": "único"
      },
      {
        "item": "Figo cristalizado",
        "precoTotal": 14.0,
        "precoUnitario": 7.0,
        "quantidade": 2,
        "tamanho": "único"
      }
    ],
    "nome": "Frank Sinatra",
    "pago": true,
    "total": 74.0,
    "usuarioId": "user_frank_014"
  },
  {
    "dataCompra": "30 de junho de 2025 às 10:19:33 UTC-3",
    "email": "gal.costa@gmail.com",
    "itens": [
      {
        "item": "Pipoca Médio",
        "precoTotal": 40.0,
        "precoUnitario": 20.0,
        "quantidade": 2,
        "tamanho": "médio"
      },
      {
        "item": "Água da Mineral",
        "precoTotal": 24.0,
        "precoUnitario": 8.0,
        "quantidade": 3,
        "tamanho": "único"
      }
    ],
    "nome": "Gal Costa",
    "pago": true,
    "total": 64.0,
    "usuarioId": "user_gal_015"
  },
  {
    "dataCompra": "1 de julho de 2025 às 13:56:41 UTC-3",
    "email": "iggy.pop@globo.com",
    "itens": [
      {
        "item": "Olho-de-sogra",
        "precoTotal": 40.0,
        "precoUnitario": 8.0,
        "quantidade": 5,
        "tamanho": "único"
      },
      {
        "item": "Refrigerante Pequeno",
        "precoTotal": 10.0,
        "precoUnitario": 10.0,
        "quantidade": 1,
        "tamanho": "pequeno"
      }
    ],
    "nome": "Iggy Pop",
    "pago": true,
    "total": 50.0,
    "usuarioId": "user_iggy_016"
  },
  {
    "dataCompra": "2 de julho de 2025 às 15:28:14 UTC-3",
    "email": "janis.joplin@hotmail.com",
    "itens": [
      {
        "item": "Costelinha suína",
        "precoTotal": 80.0,
        "precoUnitario": 80.0,
        "quantidade": 1,
        "tamanho": "único"
      },
      {
        "item": "Pipoca Grande",
        "precoTotal": 70.0,
        "precoUnitario": 35.0,
        "quantidade": 2,
        "tamanho": "grande"
      }
    ],
    "nome": "Janis Joplin",
    "pago": true,
    "total": 150.0,
    "usuarioId": "user_janis_017"
  },
  {
    "dataCompra": "3 de julho de 2025 às 09:44:27 UTC-3",
    "email": "joao.gilberto@ig.com.br",
    "itens": [
      {
        "item": "Doce de Abóbora",
        "precoTotal": 28.0,
        "precoUnitario": 7.0,
        "quantidade": 4,
        "tamanho": "único"
      },
      {
        "item": "Cajuzinho",
        "precoTotal": 16.0,
        "precoUnitario": 8.0,
        "quantidade": 2,
        "tamanho": "único"
      }
    ],
    "nome": "João Gilberto",
    "pago": true,
    "total": 44.0,
    "usuarioId": "user_joao_018"
  },
  {
    "dataCompra": "4 de julho de 2025 às 12:17:55 UTC-3",
    "email": "katy.perry@yahoo.com",
    "itens": [
      {
        "item": "Pipoca Pequeno",
        "precoTotal": 50.0,
        "precoUnitario": 10.0,
        "quantidade": 5,
        "tamanho": "pequeno"
      },
      {
        "item": "Refrigerante Médio",
        "precoTotal": 15.0,
        "precoUnitario": 15.0,
        "quantidade": 1,
        "tamanho": "médio"
      }
    ],
    "nome": "Katy Perry",
    "pago": true,
    "total": 65.0,
    "usuarioId": "user_katy_019"
  },
  {
    "dataCompra": "5 de julho de 2025 às 14:31:42 UTC-3",
    "email": "lorde@bol.com.br",
    "itens": [
      {
        "item": "Chocolate",
        "precoTotal": 15.0,
        "precoUnitario": 15.0,
        "quantidade": 1,
        "tamanho": "único"
      },
      {
        "item": "Figo cristalizado",
        "precoTotal": 35.0,
        "precoUnitario": 7.0,
        "quantidade": 5,
        "tamanho": "único"
      }
    ],
    "nome": "Lorde",
    "pago": true,
    "total": 50.0,
    "usuarioId": "user_lorde_020"
  },
  {
    "dataCompra": "6 de julho de 2025 às 16:53:19 UTC-3",
    "email": "madonna@gmail.com",
    "itens": [
      {
        "item": "Porção de Aipim frito",
        "precoTotal": 120.0,
        "precoUnitario": 40.0,
        "quantidade": 3,
        "tamanho": "único"
      },
      {
        "item": "Água da Mineral",
        "precoTotal": 16.0,
        "precoUnitario": 8.0,
        "quantidade": 2,
        "tamanho": "único"
      }
    ],
    "nome": "Madonna",
    "pago": true,
    "total": 136.0,
    "usuarioId": "user_madonna_021"
  },
  {
    "dataCompra": "7 de julho de 2025 às 11:25:36 UTC-3",
    "email": "marilia.mendonca@uol.com.br",
    "itens": [
      {
        "item": "Pipoca Médio",
        "precoTotal": 60.0,
        "precoUnitario": 20.0,
        "quantidade": 3,
        "tamanho": "médio"
      },
      {
        "item": "Refrigerante Grande",
        "precoTotal": 36.0,
        "precoUnitario": 12.0,
        "quantidade": 3,
        "tamanho": "grande"
      }
    ],
    "nome": "Marília Mendonça",
    "pago": true,
    "total": 96.0,
    "usuarioId": "user_marilia_022"
  },
  {
    "dataCompra": "8 de julho de 2025 às 18:42:13 UTC-3",
    "email": "neymar.jr@gmail.com",
    "itens": [
      {
        "item": "Suco de de gorselha, que parece tamarindo com sabor de limão",
        "precoTotal": 198.0,
        "precoUnitario": 99.0,
        "quantidade": 2,
        "tamanho": "único"
      }
    ],
    "nome": "Neymar Jr.",
    "pago": true,
    "total": 198.0,
    "usuarioId": "user_neymar_023"
  },
  {
    "dataCompra": "9 de julho de 2025 às 10:18:47 UTC-3",
    "email": "olivia.rodrigo@uol.com.br",
    "itens": [
      {
        "item": "Olho-de-sogra",
        "precoTotal": 24.0,
        "precoUnitario": 8.0,
        "quantidade": 3,
        "tamanho": "único"
      },
      {
        "item": "Cajuzinho",
        "precoTotal": 24.0,
        "precoUnitario": 8.0,
        "quantidade": 3,
        "tamanho": "único"
      }
    ],
    "nome": "Olivia Rodrigo",
    "pago": true,
    "total": 48.0,
    "usuarioId": "user_olivia_024"
  },
  {
    "dataCompra": "10 de julho de 2025 às 13:37:24 UTC-3",
    "email": "paulo.gustavo@yahoo.com",
    "itens": [
      {
        "item": "Costelinha suína",
        "precoTotal": 240.0,
        "precoUnitario": 80.0,
        "quantidade": 3,
        "tamanho": "único"
      },
      {
        "item": "Pipoca Grande",
        "precoTotal": 35.0,
        "precoUnitario": 35.0,
        "quantidade": 1,
        "tamanho": "grande"
      }
    ],
    "nome": "Paulo Gustavo",
    "pago": true,
    "total": 275.0,
    "usuarioId": "user_paulo_025"
  },
  {
    "dataCompra": "11 de julho de 2025 às 15:54:31 UTC-3",
    "email": "queen.latifah@globo.com",
    "itens": [
      {
        "item": "Chocolate",
        "precoTotal": 75.0,
        "precoUnitario": 15.0,
        "quantidade": 5,
        "tamanho": "único"
      },
      {
        "item": "Doce de Abóbora",
        "precoTotal": 21.0,
        "precoUnitario": 7.0,
        "quantidade": 3,
        "tamanho": "único"
      }
    ],
    "nome": "Queen Latifah",
    "pago": true,
    "total": 96.0,
    "usuarioId": "user_queen_026"
  },
  {
    "dataCompra": "12 de julho de 2025 às 09:46:18 UTC-3",
    "email": "roberto.carlos@gmail.com",
    "itens": [
      {
        "item": "Pipoca Pequeno",
        "precoTotal": 40.0,
        "precoUnitario": 10.0,
        "quantidade": 4,
        "tamanho": "pequeno"
      },
      {
        "item": "Refrigerante Pequeno",
        "precoTotal": 30.0,
        "precoUnitario": 10.0,
        "quantidade": 3,
        "tamanho": "pequeno"
      }
    ],
    "nome": "Roberto Carlos",
    "pago": true,
    "total": 70.0,
    "usuarioId": "user_roberto_027"
  },
  {
    "dataCompra": "13 de julho de 2025 às 12:29:35 UTC-3",
    "email": "sia@terra.com.br",
    "itens": [
      {
        "item": "Figo cristalizado",
        "precoTotal": 42.0,
        "precoUnitario": 7.0,
        "quantidade": 6,
        "tamanho": "único"
      },
      {
        "item": "Água da Mineral",
        "precoTotal": 32.0,
        "precoUnitario": 8.0,
        "quantidade": 4,
        "tamanho": "único"
      }
    ],
    "nome": "Sia",
    "pago": true,
    "total": 74.0,
    "usuarioId": "user_sia_028"
  },
  {
    "dataCompra": "14 de julho de 2025 às 14:52:42 UTC-3",
    "email": "taylor.swift@hotmail.com",
    "itens": [
      {
        "item": "Porção de Aipim frito",
        "precoTotal": 40.0,
        "precoUnitario": 40.0,
        "quantidade": 1,
        "tamanho": "único"
      },
      {
        "item": "Refrigerante Médio",
        "precoTotal": 45.0,
        "precoUnitario": 15.0,
        "quantidade": 3,
        "tamanho": "médio"
      }
    ],
    "nome": "Taylor Swift",
    "pago": true,
    "total": 85.0,
    "usuarioId": "user_taylor_029"
  },
  {
    "dataCompra": "15 de julho de 2025 às 16:15:29 UTC-3",
    "email": "vince.vaughn@bol.com.br",
    "itens": [
      {
        "item": "Cajuzinho",
        "precoTotal": 48.0,
        "precoUnitario": 8.0,
        "quantidade": 6,
        "tamanho": "único"
      },
      {
        "item": "Olho-de-sogra",
        "precoTotal": 32.0,
        "precoUnitario": 8.0,
        "quantidade": 4,
        "tamanho": "único"
      }
    ],
    "nome": "Vince Vaughn",
    "pago": true,
    "total": 80.0,
    "usuarioId": "user_vince_030"
  },
  {
    "dataCompra": "16 de junho de 2025 às 20:38:16 UTC-3",
    "email": "whitney.houston@ig.com.br",
    "itens": [
      {
        "item": "Chocolate",
        "precoTotal": 90.0,
        "precoUnitario": 15.0,
        "quantidade": 6,
        "tamanho": "único"
      },
      {
        "item": "Pipoca Grande",
        "precoTotal": 105.0,
        "precoUnitario": 35.0,
        "quantidade": 3,
        "tamanho": "grande"
      }
    ],
    "nome": "Whitney Houston",
    "pago": true,
    "total": 195.0,
    "usuarioId": "user_whitney_031"
  },
  {
    "dataCompra": "17 de junho de 2025 às 08:21:53 UTC-3",
    "email": "xuxa.meneghel@gmail.com",
    "itens": [
      {
        "item": "Doce de Abóbora",
        "precoTotal": 35.0,
        "precoUnitario": 7.0,
        "quantidade": 5,
        "tamanho": "único"
      },
      {
        "item": "Refrigerante Grande",
        "precoTotal": 48.0,
        "precoUnitario": 12.0,
        "quantidade": 4,
        "tamanho": "grande"
      }
    ],
    "nome": "Xuxa Meneghel",
    "pago": true,
    "total": 83.0,
    "usuarioId": "user_xuxa_032"
  },
  {
    "dataCompra": "18 de junho de 2025 às 11:44:37 UTC-3",
    "email": "yara.shahidi@uol.com.br",
    "itens": [
      {
        "item": "Pipoca Médio",
        "precoTotal": 80.0,
        "precoUnitario": 20.0,
        "quantidade": 4,
        "tamanho": "médio"
      },
      {
        "item": "Água da Mineral",
        "precoTotal": 40.0,
        "precoUnitario": 8.0,
        "quantidade": 5,
        "tamanho": "único"
      }
    ],
    "nome": "Yara Shahidi",
    "pago": true,
    "total": 120.0,
    "usuarioId": "user_yara_033"
  },
];

// Função para calcular o total correto dos itens
function calcularTotal(itens) {
  return itens.reduce((total, item) => total + item.precoTotal, 0);
}

// Função para validar e corrigir os dados antes de inserir no Firestore
function validarDados(compras) {
  return compras.map(compra => {
    const totalCalculado = calcularTotal(compra.itens);
    
    // Corrige o total se estiver incorreto e exibe um aviso
    if (compra.total !== totalCalculado) {
      console.warn(`⚠️ Total corrigido para ${compra.nome}: ${compra.total} -> ${totalCalculado}`);
      compra.total = totalCalculado;
    }
    
    // Valida se tem itens
    if (!compra.itens || compra.itens.length === 0) {
      console.warn(`⚠️ Compra sem itens para ${compra.nome}`);
    }

    // Converte a string dataCompra para um objeto Date
    if (typeof compra.dataCompra === "string") {
      try {
        const date = new Date(compra.dataCompra);
        if (!isNaN(date.getTime())) { // Valida se a data é válida
          compra.dataCompra = date;
        } else {
          console.error(`❌ Erro ao converter dataCompra para ${compra.nome}: '${compra.dataCompra}' não é um formato de data válido.`);
        }
      } catch (error) {
        console.error(`❌ Erro ao analisar dataCompra para ${compra.nome}:`, error);
      }
    }
    
    return compra;
  });
}

// Função principal para inserir compras no Firestore
async function inserirCompras() {
  try {
    console.log("🚀 Iniciando inserção de compras...");
    
    // Valida os dados antes de iniciar o processo de inserção
    const comprasValidadas = validarDados(compras);
    
    // Inicia um batch para operações de escrita em lote
    const batch = writeBatch(db);
    
    // CORREÇÃO: Referência para a coleção 'pedidosLanchonete' no Firestore
    const pedidosLanchoneteRef = collection(db, "pedidosLanchonete");
    
    // Itera sobre cada compra validada e adiciona ao batch
    comprasValidadas.forEach((compra) => {
      // Cria uma nova referência de documento na coleção 'pedidosLanchonete'
      const novoDoc = doc(pedidosLanchoneteRef);
      
      // Adiciona a operação de set (criar/substituir) ao batch
      batch.set(novoDoc, {
        ...compra, // Espalha todas as propriedades do objeto compra
        // O campo 'timestamp' é opcional, mas útil para auditoria
        timestampInsercao: new Date() // Adiciona um timestamp para registro da inserção
      });
    });
    
    // Confirma todas as operações do batch no Firestore
    await batch.commit();
    
    console.log(`✅ ${comprasValidadas.length} compras inseridas com sucesso na coleção 'pedidosLanchonete'!`);
    
  } catch (erro) {
    // Captura e exibe qualquer erro que ocorra durante o processo de inserção
    console.error("❌ Erro ao inserir compras:", erro);
  }
}

// Função alternativa para inserir na coleção 'ingressos' (como no seu código original)
async function inserirIngressos() {
  try {
    console.log("🚀 Iniciando inserção de ingressos...");
    
    const comprasValidadas = validarDados(compras);
    const batch = writeBatch(db);
    
    // Referência para a coleção 'ingressos' no Firestore
    const ingressosRef = collection(db, "ingressos");
    
    comprasValidadas.forEach((compra) => {
      const novoDoc = doc(ingressosRef);
      batch.set(novoDoc, {
        ...compra,
        timestamp: new Date()
      });
    });
    
    await batch.commit();
    
    console.log(`✅ ${comprasValidadas.length} ingressos inseridos com sucesso!`);
    
  } catch (erro) {
    console.error("❌ Erro ao inserir ingressos:", erro);
  }
}

// Função para remover duplicatas (opcional)
function removerDuplicatas(compras) {
  const comprasUnicas = new Map();
  
  compras.forEach(compra => {
    // Cria uma chave única baseada no email e data de compra para identificar duplicatas
    const chave = `${compra.email}-${compra.dataCompra}`;
    if (!comprasUnicas.has(chave)) {
      comprasUnicas.set(chave, compra);
    }
  });
  
  return Array.from(comprasUnicas.values());
}

// Função para testar a conexão com o Firebase
async function testarConexao() {
  try {
    console.log("🔗 Testando conexão com Firebase...");
    
    // Tenta criar uma referência simples
    const testRef = collection(db, "test");
    console.log("✅ Conexão estabelecida com sucesso!");
    
  } catch (erro) {
    console.error("❌ Erro na conexão:", erro);
  }
}

// 🚀 Executa a função de inserção
console.log("📋 Dados para inserção:", compras);
console.log("🔢 Total de compras:", compras.length);

// Descomente APENAS uma das opções abaixo:

// OPÇÃO 1: Testar conexão primeiro
// testarConexao();

// OPÇÃO 2: Inserir na coleção 'pedidosLanchonete' (recomendado para o relatório)
inserirCompras();

// OPÇÃO 3: Inserir na coleção 'ingressos' (se for para outro propósito)
// inserirIngressos();
