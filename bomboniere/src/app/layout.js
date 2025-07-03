import Head from 'next/head';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <Head>
        <title>Meu Site Legal</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="Site clássico e sofisticado" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* favicon, etc */}
      </Head>
      <body>
        <header style={{ padding: '1rem', background: '#222', color: 'white' }}>
          <h1>Meu Site Legal</h1>
          <nav>
            <a href="/" style={{ color: 'white', marginRight: '1rem' }}>Home</a>
            <a href="/sobre" style={{ color: 'white' }}>Sobre</a>
          </nav>
        </header>

        <main style={{ padding: '1rem' }}>{children}</main>

        <footer style={{ padding: '1rem', background: '#222', color: 'white', marginTop: '2rem' }}>
          © 2025 Meu Site Legal - Todos os direitos reservados
        </footer>
      </body>
    </html>
  );
}
