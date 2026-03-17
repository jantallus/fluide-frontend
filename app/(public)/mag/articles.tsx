// app/mag/articles.tsx
import React from 'react';

export const articles = [
  {
    id: 1,
    tag: "Parapente",
    title: "Pourquoi faire du parapente à La Clusaz ?",
    date: "Mercredi 12 novembre 2025",
    img: "/mag-clusaz.jpg",
    excerpt: "Le panorama unique sur la chaîne des Aravis et la possibilité de voler toute l’année font de La Clusaz un site exceptionnel...",
    content: (
      <div className="article-body-content">
        <p>Le parapente à La Clusaz est une activité de vol libre exceptionnelle, offrant un panorama unique sur la chaîne des Aravis. Il se distingue par la possibilité de voler toute l’année et propose une grande variété de formules adaptées à tous les niveaux.</p>
        <h3>Un cadre exceptionnel</h3>
        <p>La Clusaz est réputée pour ses sites d’envol en pleine montagne, garantissant un spectacle visuel époustouflant :</p>
        <ul>
          <li><strong>Les Aravis :</strong> vous survolez le cœur du massif avec des vues sur les sommets emblématiques et les alpages.</li>
          <li><strong>Le dénivelé :</strong> les vols offrent généralement un dénivelé important (souvent entre 500 m et plus de 1000 m selon le décollage), permettant un temps de vol significatif et un survol magnifique de la vallée.</li>
          <li><strong>L’atterrissage :</strong> l’atterrissage s’effectue souvent au niveau du village, notamment au lieu-dit « Le Cortibot », ce qui le rend très accessible.</li>
        </ul>
        <h3>Les principaux sites de décollage</h3>
        <p>Les décollages se font depuis les alpages ou les sommets accessibles par les remontées mécaniques, notamment :</p>
        <div className="table-wrapper" style={{ overflowX: 'auto', margin: '30px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Site de décollage</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Altitude approx.</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Public</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Caractéristiques</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>Crêt du Merle</td>
                <td style={{ padding: '12px' }}>1513 m</td>
                <td style={{ padding: '12px' }}>Enfants, Vol Découverte</td>
                <td style={{ padding: '12px' }}>Idéal pour les conditions calmes du matin et les plus jeunes.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>Crêt du Loup</td>
                <td style={{ padding: '12px' }}>1858 m</td>
                <td style={{ padding: '12px' }}>Tous niveaux, Vols Longs</td>
                <td style={{ padding: '12px' }}>Site plus élevé pour des vols plus longs (Panoramique, Ascendance).</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3>Les formules de vol en été (baptêmes tandem)</h3>
        <p>Fluide Parapente à La Clusaz vous propose différentes options de baptême adaptées à vos envies :</p>
        <p><strong>Vol Loupiot :</strong> Durée courte (6 à 8 min). Idéal pour une première approche, les enfants ou les personnes souhaitant un vol très doux et contemplatif. Effectué le matin pour des conditions aérologiques plus calmes.</p>
        <p><strong>Vol Evasion :</strong> Durée 15 min. Idéal pour les personnes souhaitant un vol doux et contemplatif, ou une première approche.</p>
        <p><strong>Vol Ascendance :</strong> Durée 30 min. Permet de bien profiter du paysage.</p>
        <p><strong>Vol Cross Country :</strong> Vol long (60 min). Le moniteur utilise les courants ascendants (les « thermiques ») pour gagner de l’altitude et prolonger le plaisir.</p>
        <h3>La spécificité hivernale : le parapente à ski</h3>
        <p>Ce qui rend La Clusaz unique, c’est aussi la possibilité de faire du parapente à skis ou en snowboard en hiver. Le décollage se fait en glissant sur la neige, rendant la phase de course (souvent redoutée) extrêmement facile et douce. Vous survolez les pistes de ski, offrant un contraste saisissant entre l’agitation de la station et le calme du vol libre.</p>
      </div>
    )
  },
  {
    id: 2,
    tag: "Parapente",
    title: "À quel âge débuter l’apprentissage du parapente ?",
    date: "Vendredi 22 août 2025",
    img: "/mag-apprentissage.jpg",
    excerpt: "L’âge légal est de 12 ans pour démarrer le parapente seul. Découvrez la réglementation stricte jusqu'à l'autonomie à 14 ans...",
    content: (
      <div className="article-body-content">
        <p>L’âge légal est de 12 ans pour démarrer le parapente seul et voici les modalités, contrainte de cet apprentissage jusqu’à 14 ans dont la réglementation est très claire.</p>
        <h3>Âge et autorisations</h3>
        <ul>
          <li><strong>Âge minimum :</strong> l’âge minimum pour pratiquer le parapente en France est de 12 ans. A partir de 14 ans en autonomie complète.</li>
          <li><strong>Autorisation parentale :</strong> une autorisation écrite et signée des parents ou du tuteur légal est obligatoire. L’enfant ne peut pas s’inscrire ou participer au stage sans ce document.</li>
        </ul>
        <h3>Encadrement et sécurité</h3>
        <ul>
          <li><strong>Professionnels qualifiés :</strong> les stages de parapente sont encadrés par des moniteurs diplômés d’État. Ces professionnels sont formés pour enseigner les techniques de vol et assurer la sécurité des élèves.</li>
          <li><strong>Matériel adapté :</strong> l’enfant utilisera du matériel de vol spécialement conçu pour les petits gabarits, avec des tailles de sellette et de voile appropriées.</li>
          <li><strong>Vol en biplace pédagogique :</strong> les premières expériences se font généralement en vol biplace pédagogique avec le moniteur. Cela permet à l’enfant de découvrir les sensations de vol en toute sécurité et de se familiariser avec les commandes avant de voler seul.</li>
        </ul>
        <h3>Progressivité de l’apprentissage</h3>
        <ul>
          <li><strong>Pente école :</strong> le stage commence toujours sur une pente école, un terrain en faible pente où l’enfant apprend les bases du gonflage de la voile, du décollage et de l’atterrissage.</li>
          <li><strong>Vol seul sous supervision :</strong> l’enfant n’est autorisé à faire ses premiers vols seul (appelés « grands vols ») que lorsque le moniteur estime qu’il a acquis les compétences nécessaires sur la pente école et que les conditions météorologiques sont idéales.</li>
          <li><strong>Liaison radio :</strong> pendant les premiers grands vols, l’élève est en liaison radio permanente avec le moniteur, qui le guide tout au long du vol. Un des moniteur se trouve au décollage et un 2é a l’atterrissage, il est toujours dans le champ de vision d’un des deux encadrants.</li>
        </ul>
        <p>En résumé, l’encadrement pour un enfant de 12 ans est très strict et axé sur la sécurité. Il suit une progression pédagogique rigoureuse pour garantir une expérience à la fois enrichissante et sans risque. C’est seulement a 14 ans qu’il pourra, s’il a acquis les compétences techniques, théoriques et météorologiques qu’il volera en complète autonomie.</p>
      </div>
    )
  },
  {
    id: 3,
    tag: "Actualité",
    title: "Les enfants et le parapente",
    date: "Jeudi 22 mai 2025",
    img: "/mag-enfants.jpg",
    excerpt: "Dès 4-5 ans, les plus jeunes peuvent découvrir des sensations uniques. Zoom sur l'encadrement spécifique des mineurs...",
    content: (
      <div className="article-body-content">
        <p>Le parapente est une expérience extraordinaire pour les enfants, leur permettant de découvrir des sensations uniques et de pouvoir contempler des paysages depuis le ciel. Cependant, la pratique du parapente pour les mineurs est encadrée par des règles spécifiques, principalement pour des raisons de sécurité et de maturité.</p>
        <h3>Le baptême de parapente en biplace (avec un moniteur diplomé)</h3>
        <p>C’est la formule la plus courante et la plus accessible pour les enfants.</p>
        <ul>
          <li><strong>Âge minimum :</strong> il n’y a pas d’âge légal strict pour un baptême en biplace, mais la plupart des écoles acceptent les enfants à partir de 4-5 ans, voire 3 ans pour certaines structures. L’essentiel est que l’enfant exprime l’envie de voler et puisse comprendre et suivre les consignes du moniteur.</li>
          <li><strong>Poids :</strong> un poids minimum est requis, à partir de 20 kg, car le matériel (sellette, voile) est adapté à une certaine charge.</li>
          <li><strong>Conditions de vol :</strong> pour les enfants, les vols sont effectués le matin, dans des conditions aérologiques calmes et douces, avec peu de vent et sans thermiques. La durée du vol est plus courte (10 minutes).</li>
          <li><strong>Sécurité et encadrement :</strong> le vol se fait systématiquement en biplace avec un moniteur diplômé d’État et expérimenté. Le matériel est adapté à la taille de l’enfant (sellette spécifique). Les moniteurs sont attentifs aux sensations de l’enfant et peuvent lui proposer de prendre les commandes pour quelques virages doux.</li>
        </ul>
        <h3>Les stages de parapente (pour apprendre à voler seul)</h3>
        <ul>
          <li><strong>Âge minimum :</strong> en France, l’âge minimum pour s’inscrire à un stage solo est fixé à 12 ans.</li>
          <li><strong>Brevets :</strong> les brevets fédéraux sont accessibles progressivement : le brevet initial dès 13 ans, le brevet de pilote à 14 ans, et le brevet de pilote confirmé à 16 ans.</li>
          <li><strong>Encadrement :</strong> pour les mineurs en stage, les conditions d’encadrement sont strictes, avec un ratio moniteur/élèves précis et plusieurs années d’expérience requises pour les encadrants de jeunes.</li>
        </ul>
        <p>En résumé, le parapente est une activité accessible aux enfants, principalement sous la forme de baptêmes en biplace. Pour un apprentissage approfondi, l’âge minimum requis est plus élevé.</p>
      </div>
    )
  },
  {
    id: 4,
    tag: "Parapente",
    title: "Mamie fait du parapente : une aventure accessible à tous !",
    date: "Samedi 1 mars 2025",
    img: "/mag-mamie.jpg",
    excerpt: "À 85 ans, Mamie Simone prouve que le ciel n'a pas d'âge. Découvrez son récit et les précautions pour tous les profils...",
    content: (
      <div className="article-body-content">
        <p>Qui a dit que le parapente était réservé aux jeunes casse-cou ? Certainement pas Mamie Simone, 85 ans, qui a récemment réalisé son rêve de voler comme un oiseau. Et elle n’est pas la seule ! De plus en plus de personnes de tous âges, de 20 à 110 kg, se laissent tenter par cette expérience unique.</p>
        <h3>Un vol tout en douceur</h3>
        <p>Le parapente biplace est une excellente option pour une première expérience. Vous serez accompagné d’un moniteur qualifié qui s’occupera de tout : du décollage à l’atterrissage en passant par le pilotage. Pas de panique, le décollage et l’atterrissage sont tout en douceur. Et si vous avez peur des sensations fortes, rassurez-vous, le vol ne sera acrobatique que si vous le souhaitez !</p>
        <h3>Participation active</h3>
        <p>Même si le moniteur gère la plupart du travail, le passager a un rôle à jouer. Au décollage et à l’atterrissage, une petite course à pied ou une glissade en ski où snowboard est nécessaire pour aider à la manœuvre. Pas de quoi s’inquiéter, cela reste accessible à la plupart des personnes.</p>
        <h3>Précautions médicales</h3>
        <p>Si vous avez des problèmes de genoux ou de cœur, il est important de consulter votre médecin avant de vous lancer. Les moniteurs ne sont pas habilités à donner des avis médicaux. Ils pourront cependant vous conseiller sur la faisabilité du vol en fonction de votre condition physique.</p>
        <h3>Alors, prêt à tenter l’aventure ?</h3>
        <p>Le parapente est une activité accessible à tous ceux qui rêvent de voler. Alors, n’hésitez plus, et comme Mamie Simone, offrez-vous une expérience inoubliable !</p>
      </div>
    )
  },
  {
    id: 5,
    tag: "Parapente",
    title: "Parapente et météo : le ciel bleu n’est pas toujours la clé",
    date: "Vendredi 21 février 2025",
    img: "/mag-meteo.jpg",
    excerpt: "On pourrait penser qu’un ciel sans nuages est idéal pour voler, mais la réalité du vent et des thermiques est plus complexe...",
    content: (
      <div className="article-body-content">
        <p>Le parapente est un sport aérien passionnant qui dépend fortement des conditions météorologiques. On pourrait penser qu’un ciel bleu sans nuages est idéal pour voler, mais ce n’est pas toujours le cas.</p>
        <h3>Les nuages : des indicateurs précieux</h3>
        <p>Les nuages peuvent être de précieux alliés pour le parapentiste. Ils indiquent souvent la présence de courants ascendants, ces masses d’air chaud qui permettent de prendre de l’altitude sans effort. Certains types de nuages, comme les cumulus, sont particulièrement recherchés car ils sont souvent associés à de bonnes conditions de vol.</p>
        <h3>Le vent : un élément essentiel</h3>
        <p>Le vent est un autre élément crucial à prendre en compte. Un vent léger à modéré est généralement idéal pour le parapente. Il permet de décoller facilement et de planer en douceur. Un vent trop fort peut rendre le vol inconfortable voir dangereux.</p>
        <p><strong>Conseils supplémentaires :</strong> avant de voler il est important de se renseigner sur la météo mais la clé est avant tout l’observation donc avant votre vol en biplace lâchez vos iphones et Android phones et leurs prévisions modélisées, observez le ciel et faites confiance à nos moniteurs qui connaissent leur terrain de jeu sur le bout des doigts.</p>
      </div>
    )
  },
  {
    id: 6,
    tag: "Parapente",
    title: "Le parapente et le vertige : une expérience sans vertige",
    date: "Vendredi 21 février 2025",
    img: "/mag-vertige.jpg",
    excerpt: "Pourquoi le vertige disparaît-il dès que vos pieds ne touchent plus le sol ? Explications sur ce phénomène sensoriel...",
    content: (
      <div className="article-body-content">
        <p>Le parapente est une activité aérienne palpitante qui offre des sensations de liberté et de légèreté inégalées. Cependant, de nombreuses personnes se demandent si cette activité est susceptible de provoquer le vertige. La réponse est non !</p>
        <h3>Pourquoi le vertige est-il absent en parapente ?</h3>
        <p>Le vertige est une sensation de perte d’équilibre causée par une discordance entre les informations visuelles et celles de l’oreille interne. Il se produit lorsque nos pieds sont en contact avec le sol.</p>
        <p>En parapente, nos pieds ne touchent pas le sol et nous sommes en mouvement constant dans les trois dimensions. Notre cerveau s’adapte à cette nouvelle situation et ne déclenche pas les mécanismes qui provoquent le vertige.</p>
        <p><strong>Peur du vide vs Vertige :</strong> Il est important de distinguer le vertige de la peur du vide (acrophobie). L'acrophobie est une émotion liée à la hauteur, tandis que le vertige est une sensation physique de perte d’équilibre.</p>
      </div>
    )
  },
  {
    id: 7,
    tag: "Actualité",
    title: "Lancement de la saison hivernale à La Clusaz !",
    date: "Mercredi 18 décembre 2024",
    img: "/mag-hiver.jpg",
    excerpt: "La neige est là ! Découvrez l'ambiance magique de la station et le survol des pistes enneigées skis aux pieds...",
    content: (
      <div className="article-body-content">
        <p>La neige est enfin arrivée, et avec elle, l’effervescence du début de la saison hivernale à La Clusaz. Notre belle station ouvre ses portes pour accueillir les passionnés de sports d’hiver, les familles en quête de moments magiques et tous ceux qui souhaitent vivre des aventures inoubliables.</p>
        <h3>Des pistes impeccables pour tous les amateurs de glisse</h3>
        <p>Ski, snowboard ou même luge : les activités phares de l’hiver sont de retour. La Clusaz offre un domaine skiable exceptionnel, adapté à tous les niveaux.</p>
        <h3>Prenez de la hauteur avec Fluide parapente</h3>
        <p>Pour les amateurs d’aventures aériennes, le parapente est une activité incontournable même en hiver. Imaginez-vous décoller depuis les sommets enneigés, skis aux pieds, et survoler les pistes dans un silence apaisant. Le vol de <strong>Beauregard</strong> et celui du <strong>Crêt du Loup</strong> sont parmi les options les plus populaires cette saison.</p>
        <p>La Clusaz, bien plus qu’une Station : Ski, parapente, raquettes ou moments de détente, chacun peut vivre l’hiver à son rythme. Laissez-vous emporter par la magie cet hiver !</p>
      </div>
    )
  },
  {
    id: 8,
    tag: "Parapente",
    title: "Saut ou vol en parapente : quelle est la bonne expression ?",
    date: "Mercredi 18 décembre 2024",
    img: "/mag-saut.jpg",
    excerpt: "Parachutisme et parapente : deux mondes souvent confondus. Découvrez pourquoi on 'vole' plus qu'on ne 'saute'...",
    content: (
      <div className="article-body-content">
        <p>Le parapente et le parachutisme, bien que souvent confondus, sont deux disciplines distinctes avec des approches et des sensations très différentes.</p>
        <h3>Une confusion historique entre parapente et parachutisme</h3>
        <p>Le parapente est né des parachutistes qui cherchaient à s’entraîner de manière plus économique. Dans les années 1970, ils ont commencé à utiliser des voiles pour descendre depuis des pentes herbeuses.</p>
        <p>Le parachutisme consiste à sauter d’un avion à haute altitude (10 000m) à des vitesses dépassant 200 km/h. Le terme « saut » y est donc parfaitement adapté.</p>
        <h3>Le parapente : une expérience de vol en douceur</h3>
        <p>En parapente, on ne saute pas dans le vide. On gonfle sa voile face au vent et on trottine doucement jusqu’à atteindre la vitesse nécessaire pour décoller. C'est une balade aérienne apaisante, hors du temps. Le terme <strong>« vol en parapente »</strong> est donc le seul approprié.</p>
      </div>
    )
  }
];