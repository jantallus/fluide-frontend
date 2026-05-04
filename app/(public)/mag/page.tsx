"use client";
import { useState } from 'react';
import { articles } from './articles';

export default function MagPage() {
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[number] | null>(null);
  const [filter, setFilter] = useState("Tous"); // État pour le filtre

  // Logique de filtrage des articles
  const filteredArticles = articles.filter(art => 
    filter === "Tous" || art.tag === filter
  );

  return (
    <main style={{ width: '100%', overflowX: 'hidden', position: 'relative', backgroundColor: 'white' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ultraSmoothReveal {
          0% { opacity: 0; transform: translateY(100px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hero-animation-block { animation: ultraSmoothReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        /* FIX ALIGNEMENT DES MONTAGNES */
        .mountains-container {
          position: absolute; bottom: -5px; left: 0; width: 100%; z-index: 5; line-height: 0;
        }
        .mountains-container img { width: 100%; height: auto; display: block; }

        /* STYLE DU FILTRE */
        .filter-container {
          margin-bottom: 50px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .filter-label { color: #1e40af; font-weight: 800; font-size: 1.1rem; }
        .filter-select {
          padding: 12px 25px;
          border-radius: 50px;
          border: 2px solid #1e40af;
          color: #1e40af;
          font-weight: 700;
          cursor: pointer;
          outline: none;
          background: white;
          transition: 0.3s;
        }
        .filter-select:hover { background: #f8fafc; }

        /* GRILLE ET CARTES */
        .mag-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 40px; }
        .article-card { background: #f8fafc; border-radius: 25px; overflow: hidden; cursor: pointer; transition: 0.4s; border: 1px solid #f1f5f9; display: flex; flex-direction: column; }
        .article-card:hover { transform: translateY(-15px); box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
        .card-img { height: 230px; background: #cbd5e1; }
        .card-img img { width: 100%; height: 100%; object-fit: cover; }
        .card-body { padding: 30px; flex-grow: 1; }

        /* STYLE DES DRAPEAUX */
        .article-tag { display: inline-block; padding: 5px 15px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
        .tag-actualite { background-color: #f026b8; color: white; }
        .tag-parapente { background-color: #1e40af; color: white; }

        .article-body-content p { color: #475569; line-height: 1.8; font-size: 1.15rem; margin-bottom: 20px; }
        .article-body-content h3 { color: #1e40af; margin: 40px 0 20px; font-weight: 800; }
        .article-body-content ul { padding-left: 20px; margin-bottom: 25px; }
        .article-body-content li { color: #475569; margin-bottom: 10px; font-size: 1.1rem; }

        .btn-back { background: none; border: 2px solid #1e40af; color: #1e40af; padding: 12px 30px; border-radius: 50px; font-weight: 800; cursor: pointer; margin-bottom: 40px; transition: 0.3s; }
        .btn-back:hover { background: #1e40af; color: white; }
      `}} />

      {/* SECTION HERO : STRUCTURE 100% IDENTIQUE */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#1e40af', display: 'flex', alignItems: 'center', paddingLeft: '15vw', overflow: 'hidden' }}>
        <div className="hero-animation-block">
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>
            Le Mag'<br /><span style={{ color: '#f026b8' }}>fluide</span>
          </h1>
        </div>
        <div className="mountains-container"><img src="/montagnes.svg" alt="Montagnes" /></div>
      </section>

      <section style={{ padding: '120px 15vw', position: 'relative', zIndex: 10, backgroundColor: 'white' }}>
        <div className="hero-animation-block">
          
          {!selectedArticle ? (
            <>
              {/* LISTE DÉROULANTE DE FILTRAGE */}
              <div className="filter-container">
                <span className="filter-label">Filtrer par :</span>
                <select 
                  className="filter-select" 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="Tous">Tous les articles</option>
                  <option value="Actualité">Actualité Fluide</option>
                  <option value="Parapente">Conseils Parapente</option>
                </select>
              </div>

              {/* GRILLE FILTRÉE */}
              <div className="mag-grid">
                {filteredArticles.map(art => (
                  <div key={art.id} className="article-card" onClick={() => {
                    setSelectedArticle(art);
                    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                  }}>
                    <div className="card-img"><img src={art.img} alt="" /></div>
                    <div className="card-body">
                      <div className={`article-tag ${art.tag === 'Actualité' ? 'tag-actualite' : 'tag-parapente'}`}>
                        {art.tag}
                      </div>
                      <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '10px' }}>{art.date}</span>
                      <h3 style={{ color: '#1e40af', margin: '0 0 10px' }}>{art.title}</h3>
                      <p style={{ color: '#64748b' }}>{art.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message si aucun article ne correspond au filtre */}
              {filteredArticles.length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>
                  Aucun article trouvé dans cette catégorie.
                </p>
              )}
            </>
          ) : (
            <div className="full-article">
              <button className="btn-back" onClick={() => setSelectedArticle(null)}>← Retour au Mag'</button>
              <h2 style={{ color: '#1e40af', fontSize: '2.5rem', fontWeight: 900 }}>{selectedArticle.title}</h2>
              <span style={{ color: '#f026b8', fontWeight: 800, marginBottom: '40px', display: 'block' }}>{selectedArticle.date}</span>
              <div style={{ maxWidth: '950px' }}>{selectedArticle.content}</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}