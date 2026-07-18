# Anexo — Application

Ceci est la première version réelle du logiciel Anexo : authentification,
établissements multi-clients, et le moteur d'« annexes génériques renommables »
défini dans la note de positionnement.

## Ce qui fonctionne déjà
- Création de compte + établissement (chaque établissement est isolé des autres)
- Connexion / déconnexion
- Création, renommage et personnalisation (icône) des annexes ("Annexe 1", "Annexe 2"...)
- Gestion des articles et de leurs formules tarifaires (jour/semaine/heure/etc.) par annexe
- Création de réservations multi-articles, avec calcul automatique du total

## Ce qui n'est pas encore fait (prochaines étapes)
- Vérification de disponibilité du stock sur la période choisie (actuellement, aucune
  vérification anti-double-réservation n'est faite — à ajouter avant un usage réel)
- Tableaux de bord chiffre d'affaires (jour/semaine/mois/année)
- Connexion à une plateforme agréée pour la facturation électronique conforme
- Module Hébergement (PMS)
- Gestion des équipements additionnels (casque, porte-bébé...)
- Invitation d'utilisateurs supplémentaires au sein d'un même établissement

## Comment le mettre en ligne (déploiement)

### 1. Créer la base de données (Supabase) — 5 minutes
1. Va sur supabase.com et crée un compte gratuit
2. Crée un nouveau projet (choisis une région proche, ex. "West EU")
3. Une fois le projet créé, va dans **SQL Editor** (menu de gauche) > **New query**
4. Copie tout le contenu du fichier `supabase/schema.sql` de ce projet, colle-le, et clique sur **Run**
5. Va dans **Project Settings > API** : note l'**URL** du projet et la clé **anon public**

### 2. Configurer le projet
1. Duplique le fichier `.env.local.example` en `.env.local`
2. Remplace les deux valeurs par celles récupérées à l'étape précédente

### 3. Mettre en ligne (Vercel) — même logique que Netlify pour ta landing page
1. Mets ce dossier de code sur GitHub (crée un compte gratuit si besoin, puis un nouveau
   dépôt, et envoie ces fichiers dedans)
2. Va sur vercel.com, connecte-toi avec ton compte GitHub
3. Clique sur **Add New > Project**, choisis le dépôt que tu viens de créer
4. Avant de cliquer sur "Deploy", ajoute les deux variables d'environnement
   (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`) dans la section
   **Environment Variables**
5. Clique sur **Deploy** — au bout de quelques minutes, tu as une URL en ligne

### Pour tester en local avant de mettre en ligne
```bash
npm install
npm run dev
```
Puis ouvre http://localhost:3000
