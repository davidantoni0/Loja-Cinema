import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Cine Senai</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="Site clássico e sofisticado" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header class="topo">
          <img 
            class="imagem"
            src="/Filmes/Logo/CineSenai 2.png"
            alt="CineSenai"
            style={{ maxWidth: '200px', height: 'auto' }}
          />
        </header>

        <main>{children}
        </main>
        
        <footer class="rodape">
          <div>© 2025 CineSENAI - Todos os direitos reservados</div>
        </footer>
      </body>
    </html>
  );
}
