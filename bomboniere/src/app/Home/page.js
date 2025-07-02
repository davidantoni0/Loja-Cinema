'use client';
import React from 'react';
import Login from "@/Components/Login/page";
import styles from './page.module.css';


function Home() {

    const [menuState, setMenuState] = React.useState("mainMenu");

  return (
    <div>
        <header className={styles.header}>
            <button className={styles.loginButton} onClick={() => setMenuState("login")}>
                Login
            </button>


        </header>
        
      <main>
            {menuState === "login" && (
                <div className={styles.loginContainer}>
                    <Login/>
                </div>
            )}
      </main>
        <h1>CineSenai</h1>
        <p>This is the home page of the Bomboniere application.</p>
        <ol>
          <li>Explore our features.</li>
          <li>Check out the latest updates.</li>
        </ol>
      <footer>
        <p>&copy; 2023 Bomboniere. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;