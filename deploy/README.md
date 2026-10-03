# NOEMA — déploiement Hostinger

Préparation basée sur `main`, commit `509652a6d58dc42929a373d18365c405df468831`.
Ces fichiers n'ont pas encore été installés sur le VPS. Les corrections locales doivent être intégrées à la version déployée et leur commit exact enregistré.

## Architecture

Internet → Nginx HTTPS → Express:3000 → Django/Gunicorn:8000 → PostgreSQL:5432.
Seul Nginx publie des ports. Django et PostgreSQL n'ont aucun port publié sur l'hôte.
PostgreSQL utilise un réseau Docker interne. Django dispose aussi du réseau applicatif pour joindre SMTP et Google.
Les médias sont dans `/srv/noema/media`, écrits par Django (UID 10001), lus par Express. La base reste dans le volume Docker `noema_postgres_data`.
Les conteneurs redémarrent avec Docker. Le mode de test ne publie que `127.0.0.1:8080`, accessible par tunnel SSH.

## Conditions avant toute installation

- Vérifier dans Hostinger et dans `/etc/os-release` : KVM 1, Ubuntu 24.04 LTS, IPv4/IPv6, région, état ; vérifier le reçu et les dates sans changer la facturation.
- Inspecter les services/ports/disques existants et ne jamais réinstaller un serveur contenant des données.
- Vérifier la clé hôte SSH depuis une source Hostinger de confiance ; ne pas désactiver la vérification de clé hôte.
- L'utilisateur saisit lui-même le mot de passe root. Ne pas l'enregistrer ni le passer en argument.
- Aucun achat, aucune nouvelle condition contractuelle ni aucun CAPTCHA ne sont traités automatiquement.

## Configuration de l'hôte

Sur un VPS confirmé neuf : appliquer les mises à jour Ubuntu, installer les certificats CA, Git, UFW, les mises à jour de sécurité automatiques et Docker Engine/Compose depuis le dépôt officiel Docker.
Voir https://docs.docker.com/engine/install/ubuntu/ . Ne pas exécuter un script d'installation distant sans le lire.

Activer Docker au démarrage. Autoriser SSH et les ports web nécessaires avant d'activer le pare-feu ; garder la session SSH actuelle ouverte. Vérifier les ports IPv4 et IPv6 depuis l'extérieur.
Docker peut contourner UFW pour les ports publiés : c'est pourquoi aucun port de base ou de backend n'est publié dans Compose.
Créer/installer un accès SSH par clé approuvé, le tester dans une deuxième session, puis seulement désactiver l'authentification SSH par mot de passe. Ne jamais supprimer le dernier accès valide.

Créer les répertoires suivants, sans écrire de secret dans une commande :

```sh
sudo install -d -m 0700 /etc/noema /srv/noema/backups
sudo install -d -m 0755 -o 10001 -g 10001 /srv/noema/media
sudo install -d -m 0755 /srv/noema/acme
```

## Secrets et variables

`app.env.example` est un modèle sans secret. Le vrai fichier est `/etc/noema/app.env`, propriétaire root, mode 0600 ; `/etc/noema/postgres.env` contient uniquement `POSTGRES_DB`, `POSTGRES_USER` et le même `POSTGRES_PASSWORD`.
Les fichiers sont lus au format brut : valeurs sans guillemets, une seule ligne par valeur. Ne pas les sourcer comme scripts shell.
Le mot de passe root ne figure dans aucun de ces fichiers.
Le propriétaire a ensuite autorisé la génération des seuls secrets Django et PostgreSQL directement sur le VPS, sans affichage. `sudo python3 deploy/init-secrets.py` prépare ces deux secrets et refuse d'écraser une configuration existante. Les paramètres SMTP et OAuth restent à saisir par le propriétaire dans un terminal sécurisé.

À fournir de manière sécurisée :

- `DJANGO_SECRET_KEY` : au moins 50 caractères aléatoires ; aucune valeur factice.
- `POSTGRES_PASSWORD` : mot de passe propre à la base, distinct de root.
- `EMAIL_HOST`, port et TLS/SSL vérifiés auprès du fournisseur ; `EMAIL_HOST_PASSWORD` de `finance@urielgroup.fr`.
- `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` d'une application Web OAuth autorisée.
- URI Google exacte : `https://laresidencenoema.com/api/auth/google/callback/` ; origine JavaScript `https://laresidencenoema.com` si requise par le client.

Le propriétaire a demandé l'activation de Google pour le lancement : sa configuration et un essai réel restent obligatoires avant bascule.
L'endpoint Gemini est désactivé dans le code (`410`) ; aucune clé Gemini n'est nécessaire tant que cette fonctionnalité reste désactivée.

Vérifier sans afficher les valeurs :

```sh
sudo python3 deploy/validate-env.py /etc/noema/app.env
```

## Construction et migration

Ne pas lancer simultanément les deux constructions sur le KVM 1. Vérifier la mémoire libre, le disque et l'absence de charge publique pendant cette étape.

```sh
docker compose -f deploy/compose.yml build django
docker compose -f deploy/compose.yml build web
docker compose -f deploy/compose.yml up -d db
docker compose -f deploy/compose.yml run --rm django python manage.py migrate --noinput
docker compose -f deploy/compose.yml run --rm django python manage.py createcachetable django_cache
docker compose -f deploy/compose.yml run --rm django python manage.py collectstatic --noinput
docker compose -f deploy/compose.yml run --rm django python manage.py check --deploy
docker compose -f deploy/compose.yml up -d django web proxy
```

Ne pas générer de migrations sur le serveur. Créer l'administrateur Django dans un terminal interactif où l'utilisateur saisit lui-même son mot de passe.
Ne pas afficher `docker inspect`, `docker compose config` résolu ni le contenu des fichiers d'environnement : ils peuvent révéler des secrets.

## Recette avant DNS

Le mode `nginx.preflight.conf` est limité à la boucle locale. Il transmet un contexte HTTPS à Django pour tester la configuration du proxy, mais **ne constitue pas un test TLS réel**.
Pour la recette réelle HTTPS avant bascule, obtenir un certificat valide pour le domaine au moyen d'un challenge DNS, avec ajout temporaire du TXT de validation uniquement après explication. Les conditions de l'autorité de certification doivent être acceptées par le propriétaire, pas automatiquement.
Ne pas employer `--agree-tos` sans accord distinct. Ne pas contourner un avertissement TLS du navigateur.

Installer le certificat sous `/etc/letsencrypt/live/laresidencenoema.com/`. Publier le proxy avec le fichier complémentaire uniquement quand ce certificat existe :

```sh
docker compose -f deploy/compose.yml -f deploy/compose.public.yml up -d proxy
```

Tester par résolution locale du domaine vers l'IP du VPS, sans modifier le DNS public : `curl --resolve` et/ou résolution locale de la machine de test. Garder Django/PostgreSQL inaccessibles de l'extérieur.

Recette nécessaire, avec données marquées `TEST NOEMA DEPLOIEMENT` :

- accueil, ressources, catalogue, FAQ, simulateur et réponses API ; aucun contenu de secours ne doit masquer un backend en panne ;
- dépôt d'un prospect, présence de sa ligne dans PostgreSQL, mail reçu dans `finance@urielgroup.fr` ;
- rendez-vous, présence durable dans PostgreSQL et réception du mail ;
- refus des formulaires invalides ; anonymes interdits sur la liste de prospects et l'administration ;
- connexion/déconnexion, CSRF, cookies sécurisés, récupération du mot de passe et connexion Google réelle ;
- connexion à Django Admin, téléversement d'une image de test, lecture publique, conservation après recréation des conteneurs ;
- HTTPS valide pour le domaine et `www`, puis redémarrage contrôlé du VPS et nouveau contrôle des services ;
- sauvegarde PostgreSQL/médias, restauration dans une base isolée, vérification des lignes et empreintes des médias ;
- suppression seulement des lignes, comptes et médias de test identifiés.

Les tests automatiques locaux n'attestent ni de la délivrabilité SMTP, ni du fonctionnement OAuth réel, ni de la capacité de charge du KVM 1.

## Sauvegarde WordPress et DNS

Avant la bascule : sauvegarder uniquement le WordPress NOEMA dans un emplacement protégé, avec ses fichiers et sa base SQL. Ne pas modifier les fichiers ou tables source, ni les sites URIEL.
Conserver les deux archives, leur date, leur taille, leur SHA-256 et la liste de leur contenu. Vérifier une restauration hors production dans un environnement isolé. Ne pas exporter ni publier des fichiers de configuration WordPress dans Git.

Exporter les valeurs **exactes de la zone hPanel**, avec noms/types/valeurs/TTL et l'éventuelle configuration CDN/ALIAS. Une réponse DNS publique peut être synthétisée par le CDN et ne suffit pas pour reconstruire la zone.
Conserver intégralement MX/SPF/DKIM/DMARC et les nameservers. Modifier uniquement les entrées web du domaine racine et de `www` une fois la recette réussie.
Si le VPS n'a pas d'IPv6 web opérationnelle, ne pas laisser une ancienne entrée AAAA envoyer une partie des visiteurs vers l'ancien hébergement ; sa modification fait partie de la bascule web autorisée.

Après propagation : contrôler les serveurs DNS autoritatifs et plusieurs résolveurs, HTTPS, formulaires, réception SMTP et OAuth. Garder WordPress intact, Render disponible et le VPS accessible.

## Sauvegardes du nouveau site

`sudo bash deploy/backup.sh` produit un dump PostgreSQL, une archive des médias et leurs SHA-256. Le script ne supprime aucune sauvegarde et ne touche pas à WordPress.
Compléter par une restauration de test et une copie hors VPS, avant de considérer la sauvegarde validée. Définir ensuite un timer quotidien et une rétention adaptés à l'espace réellement disponible.
Configurer et tester le renouvellement du certificat et le rechargement Nginx.

## Retour arrière

1. Conserver les demandes reçues depuis la bascule : sauvegarder d'abord la nouvelle base et les médias.
2. Restaurer exclusivement les anciennes entrées web exactes et leurs TTL depuis l'export hPanel. Restaurer le réglage CDN web seulement s'il a dû être modifié.
3. Vérifier l'ancien WordPress en HTTPS ; ses fichiers et sa base doivent être restés intacts.
4. Garder le VPS et Render disponibles pour diagnostic. Ne pas supprimer les volumes Docker, ne pas lancer `docker compose down -v`.
5. Corriger le nouveau site hors trafic, puis refaire la recette avant une nouvelle bascule.

Pour un retour arrière applicatif sur le VPS, réutiliser les images du commit précédent enregistré. Ne pas restaurer une ancienne base par-dessus des demandes clients nouvelles sans plan de conservation des données.
