"use client";

export default function EquipePage() {
  return (
    <main style={{ width: '100%', overflowX: 'hidden', position: 'relative', backgroundColor: 'white' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ultraSmoothReveal {
          0% { opacity: 0; transform: translateY(100px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .hero-animation-block {
          will-change: transform, opacity;
          animation: ultraSmoothReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* --- STRUCTURE DE VERROUILLAGE DES MONTAGNES --- */
        .mountains-container {
          position: absolute;
          bottom: -5px; 
          left: 0;
          width: 100%;
          z-index: 5;
          line-height: 0;
        }
        .mountains-container img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* --- SECTIONS DE CONTENU --- */
        .content-section {
          padding: 100px 15vw;
          background-color: white;
          position: relative;
          z-index: 10;
        }

        .content-section h2 { 
          color: #1e40af; 
          font-size: 2.2rem; 
          font-weight: 900; 
          margin-bottom: 30px; 
        }

        .content-section h3 { 
          color: #1e40af; 
          font-size: 1.8rem; 
          font-weight: 800; 
          margin-top: 60px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .content-section h3::after {
          content: "";
          flex: 1;
          height: 2px;
          background: #f1f5f9;
        }

        .content-section p { 
          color: #475569; 
          line-height: 1.8; 
          font-size: 1.1rem; 
          margin-bottom: 20px;
          max-width: 900px;
        }

        .highlight-fuchsia {
          color: #f026b8;
          font-weight: 800;
        }
      `}} />

      {/* --- SECTION 1 : HERO (100VH) --- */}
      <section style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#1e40af', 
        display: 'flex', 
        alignItems: 'center', 
        paddingLeft: '15vw', 
        overflow: 'hidden' 
      }}>
        <div className="hero-animation-block" style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
            fontWeight: 900, 
            color: 'white', 
            margin: 0, 
            lineHeight: 1.1 
          }}>
            L'équipe de <br /><span className="highlight-fuchsia">Fluide Parapente</span>
          </h1>
          <p style={{ 
            fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', 
            color: 'rgba(255,255,255,0.8)', 
            marginTop: '30px', 
            fontWeight: 500 
          }}>
            Des passionnés expérimentés
          </p>
        </div>

        <div className="mountains-container">
          <img src="/montagnes.svg" alt="Montagnes" />
        </div>
      </section>

      {/* --- SECTION 2 : PRÉSENTATION GÉNÉRALE --- */}
      <section className="content-section">
        <div className="hero-animation-block">
          <h2>Partager l'excellence du vol libre</h2>
          <p>
            Avec plus d’une décennie d’expérience sur le site exceptionnel de <strong>La Clusaz</strong>, Léo et Julien se consacrent à partager leur passion du parapente dans une ambiance à la fois chaleureuse et professionnelle. 
          </p>
          <p>
            Leur objectif : vous faire vivre un moment unique et mémorable, dans le cadre majestueux des Alpes, en toute sécurité. Leur expertise et leur amour pour le vol se ressentent dans chaque instant passé en leur compagnie.
          </p>

          {/* --- PROFIL LÉO --- */}
          <h3>Léo, une passion dans le vent depuis 2008</h3>
          <p>
            Depuis 2008, Léo déploie ses ailes pour offrir à chacun une expérience magique et inoubliable. Ce qu’il préfère ? Le frisson unique du moment où les pieds quittent le sol, cette sensation de liberté absolue qui accompagne chaque décollage.
          </p>
          <p>
            Avec une approche basée sur le partage, l’adaptation, et une grande capacité d’écoute, Léo sait transformer chaque baptême en parapente en un moment de pur bonheur, parfaitement adapté aux envies et besoins de chacun. Que vous soyez en quête de sérénité ou d’un petit frisson, il saura vous guider avec simplicité et convivialité.
          </p>
          <p>
            Quand Léo n’est pas dans les airs, il est toujours en quête de nouveaux défis ou de partages autour de sa passion. Avec lui, chaque vol devient une expérience humaine autant qu’aérienne.
          </p>

          {/* --- PROFIL JULIEN --- */}
          <h3>Julien, 30 ans de passion et d’exploration</h3>
          <p>
            Pour Julien, le parapente n’est pas juste une activité : c’est un mode de vie. Depuis plus de 30 ans, il nourrit une véritable passion pour le vol libre. Dès son plus âge, il a été attiré par cette sensation unique de planer dans les airs, au point de faire de cette passion une véritable vocation.
          </p>
          <p>
            Ses aventures aériennes l’ont mené aux quatre coins du monde, à la recherche des meilleurs spots de vol. Pourtant, c’est à La Clusaz, au pied de la majestueuse chaîne des Aravis, qu’il a choisi de poser son sac. Ce décor grandiose, il le considère comme la toile parfaite pour partager sa passion avec ses passagers.
          </p>
          <p>
            Avec Julien, préparez-vous à vivre un moment intense et enrichissant. Toujours prêt à transmettre ses connaissances et à partager des anecdotes de voyage, il saura vous embarquer dans un univers aérien à la fois technique, poétique et accessible à tous.
          </p>
        </div>
      </section>

    </main>
  );
}