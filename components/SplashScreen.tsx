"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [stage, setStage] = useState("falling"); // falling -> splashing -> visible -> fading
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Séquence de l'animation
    const splashTimer = setTimeout(() => setStage("splashing"), 800); // Impact
    const textTimer = setTimeout(() => setStage("visible"), 1200);   // Texte
    const fadeTimer = setTimeout(() => setStage("fading"), 3800);    // Début disparition
    const removeTimer = setTimeout(() => setIsVisible(false), 4500); // Suppression

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`splash-screen-overlay ${stage === "fading" ? "exit" : ""}`}>
      
      {/* ÉTAPE 1 : LA GOUTTE QUI TOMBE */}
      {stage === "falling" && <div className="blue-drop" />}

      {/* ÉTAPE 2 & 3 : L'EXPLOSION ET LE TEXTE */}
      {(stage === "splashing" || stage === "visible" || stage === "fading") && (
        <div className="splash-graphic-container">
          <Image 
            src="/splash.jpg" 
            alt="Splash Fluide" 
            fill 
            style={{ objectFit: 'contain' }}
            priority
            className="burst-animation"
          />
          
          <div className={`quote-box ${stage === "visible" || stage === "fading" ? "show-text" : ""}`}>
            <p className="quote-main">
              Chez <span className="pink-text">fluide</span> les sensations et le pilotage ne sont pas en option !
            </p>
            <p className="quote-sub">
              Demandez simplement à votre moniteur !
            </p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .splash-screen-overlay {
          position: fixed; inset: 0; background: white;
          display: flex; justify-content: center; align-items: center;
          z-index: 10000;
        }

        /* LA GOUTTE BLEUE */
        .blue-drop {
          width: 22px; height: 22px; background: #1e40af;
          border-radius: 50% 0 50% 50%;
          transform: rotate(-45deg);
          animation: dropDown 0.8s cubic-bezier(0.6, 0.05, 0.1, 0.9) forwards;
        }

        @keyframes dropDown {
          0% { transform: translateY(-100vh) rotate(-45deg); opacity: 0; }
          70% { opacity: 1; }
          100% { transform: translateY(0) rotate(-45deg); scale: 0.4; }
        }

        /* LE SPLASH (splash.jpg) */
        .splash-graphic-container {
          position: relative; width: 85vw; height: 85vh;
          display: flex; justify-content: center; align-items: center;
        }

        .burst-animation {
          animation: splashExpand 0.7s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
        }

        @keyframes splashExpand {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1.1); opacity: 1; }
        }

        /* LE TEXTE */
        .quote-box {
          position: relative; z-index: 10; text-align: center;
          opacity: 0; transform: translateY(30px);
          transition: all 0.8s ease-out;
          max-width: 700px;
        }
        .quote-box.show-text { opacity: 1; transform: translateY(0); }

        .quote-main { font-size: 2.3rem; font-weight: 900; color: #1e3a8a; line-height: 1.2; margin-bottom: 20px; }
        .pink-text { color: #f026b8; }
        .quote-sub { font-size: 1.4rem; font-weight: 700; color: #64748b; font-style: italic; }

        /* SORTIE DE L'ÉCRAN */
        .exit { animation: fadeAway 0.7s forwards; }
        @keyframes fadeAway {
          to { opacity: 0; visibility: hidden; transform: scale(1.05); }
        }

        @media (max-width: 768px) {
          .quote-main { font-size: 1.6rem; }
          .quote-sub { font-size: 1.1rem; }
        }
      `}} />
    </div>
  );
}