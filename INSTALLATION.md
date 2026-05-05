# Guide d'installation — CRM Association

## 1. Prérequis

- **Node.js 20+** : https://nodejs.org (télécharger la version LTS)
- **Git** : https://git-scm.com

## 2. Première installation (en local)

```bash
# Dans le dossier du projet
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

## 3. Base de données (Neon — gratuit)

1. Créer un compte sur https://neon.tech
2. Créer un nouveau projet "crm-association"
3. Copier la **connection string** (format `postgresql://...`)
4. Ouvrir `.env` et coller la valeur dans `DATABASE_URL`

## 4. Générer le secret NextAuth

```bash
# Windows PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Ou via Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Coller le résultat dans `NEXTAUTH_SECRET` dans le fichier `.env`.

## 5. Initialiser la base de données

```bash
# Créer les tables
npm run db:push

# Créer l'utilisateur admin initial
npm run db:seed
```

L'admin créé par défaut :
- **Email** : `admin@association.fr`
- **Mot de passe** : `Admin1234!`

> Changez ce mot de passe dès la première connexion !

## 6. Lancer en développement

```bash
npm run dev
```

Ouvrir http://localhost:3000

## 7. Déploiement sur Vercel

### 7.1 Pousser sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-user/crm-association.git
git push -u origin main
```

### 7.2 Déployer sur Vercel

1. Créer un compte sur https://vercel.com
2. Cliquer "Add New Project" → importer le dépôt GitHub
3. Dans "Environment Variables", ajouter :
   - `DATABASE_URL` → votre connection string Neon
   - `NEXTAUTH_SECRET` → votre secret généré
   - `NEXTAUTH_URL` → `https://votre-domaine.vercel.app`
4. Cliquer "Deploy"

### 7.3 Après le déploiement

Dans le terminal local, pointer vers la base de prod et lancer le seed :

```bash
# Temporairement dans .env, mettre l'URL de prod
npm run db:push
npm run db:seed
```

## 8. Comptes utilisateurs

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@association.fr | Admin1234! | ADMIN |

Les admins peuvent créer d'autres utilisateurs depuis la page **Administration**.

## Rôles

| Action | Membre | Admin |
|--------|--------|-------|
| Voir comptes & contacts | ✅ | ✅ |
| Créer/modifier comptes & contacts | ❌ | ✅ |
| Supprimer comptes & contacts | ❌ | ✅ |
| Créer une interaction | ✅ | ✅ |
| Supprimer sa propre interaction | ✅ | ✅ |
| Supprimer toute interaction | ❌ | ✅ |
| Gérer les utilisateurs | ❌ | ✅ |
