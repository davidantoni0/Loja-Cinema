// bomboniere/src/app/layout.js
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Cine Senai</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="Site clássico e sofisticado" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* favicon, etc */}
      </head>
      <body>
        <header>
          <h1>Cine Senai</h1>
        </header>

        <main>
          {children}
        </main>

        <footer style={{ padding: '1rem', background: '#222', color: 'white', marginTop: '2rem' }}>
          © 2025 Cine Senai - Todos os direitos reservados
        </footer>
      </body>
    </html>
  );
}
