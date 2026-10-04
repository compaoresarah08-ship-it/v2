# Déploiement automatique NOEMA

Un push sur `main` dans `urielgroup2012-wq/Noema` déclenche **Deploy NOEMA to Hostinger** dans l'onglet **Actions**. Un merge vers `main` est aussi un push. Les autres branches ne mettent pas le site en production. Le workflow historique GitHub Pages reste uniquement manuel.

## Pour mettre le site à jour

1. Modifier le code, créer un commit et le pousser sur `main`.
2. Ouvrir l'onglet Actions du dépôt, puis le lancement correspondant au commit.
3. Attendre que **validate** et **deploy** passent au vert. Le site utilise alors ce commit. Un simple push accepté par Git ne signifie pas que le déploiement est terminé.

Les tests TypeScript, calcul de financement, Express, SEO et Django précèdent tout accès au VPS. Le code est envoyé dans un bundle Git via une clé SSH dédiée, stockée dans le secret Actions `NOEMA_DEPLOY_KEY`. La variable `NOEMA_KNOWN_HOSTS` contient la clé publique vérifiée du VPS. Aucun mot de passe root, SMTP, PostgreSQL ou secret OAuth ne quitte le serveur.

Sur le VPS : construction séquentielle des deux images, vérification Django et absence de migrations en attente, démarrage de conteneurs temporaires privés, tests HTTP, sauvegarde PostgreSQL/médias, collecte des fichiers statiques, remplacement des services applicatifs et vérification HTTPS. PostgreSQL et les médias restent persistants. Les nouveaux conteneurs conservent `restart: unless-stopped`. Les anciens fichiers et images restent disponibles.

Une erreur avant la bascule laisse la version précédente en ligne. Une erreur détectée après remplacement des conteneurs provoque un retour aux anciens services applicatifs et un contrôle HTTP. **La base n'est jamais restaurée automatiquement**, pour préserver les demandes reçues entre-temps. Une courte interruption reste possible au remplacement des conteneurs sur ce VPS unique.

## Cas qui demandent une intervention

- **Migrations de base** : arrêt avant bascule si `migrate --check` détecte une migration en attente. Un opérateur doit examiner sa compatibilité, sauvegarder la base, appliquer les migrations selon un plan adapté puis relancer le workflow. Le workflow ne promet pas un retour arrière sûr d'un changement de schéma.
- **Échec des tests** : corriger, committer et pousser de nouveau. Les détails sont dans Actions.
- **Quota GitHub Actions** : les exécutions utilisent le quota existant du compte. Au-delà, le blocage ou une éventuelle facturation dépend des paramètres de dépenses du compte ; aucun moyen de paiement ni budget payant n'est ajouté par cette installation. Surveiller l'usage dans GitHub avant d'augmenter la fréquence des pushes.
- **Disque libre inférieur à 10 Gio** : arrêt sans supprimer les données ou sauvegardes. Les sauvegardes et anciennes images doivent être entretenues par un opérateur.
- **Clé révoquée ou serveur inaccessible** : contrôler l'accès sans désactiver la vérification de clé hôte SSH.

## Sécurité et exploitation

La clé dédiée donne le droit de déployer le code de NOEMA, donc doit être protégée comme un accès à la production. Elle n'ouvre pas de terminal et n'autorise pas de tunnel SSH. Le compte `noema-deploy` n'appartient pas au groupe Docker. Il peut seulement appeler le récepteur installé par root. Les scripts de contrôle `/usr/local/sbin/noema-receive`, `/usr/local/sbin/noema-deploy` et `/usr/local/lib/noema/smoke.py` ne s'auto-mettront pas à jour depuis Git ; leur modification exige une installation par l'opérateur.

Le service systemd temporaire termine le déploiement même si la connexion du runner se coupe. Un verrou empêche deux déploiements simultanés. Les déploiements doivent avancer dans l'historique Git : pour annuler une modification, préférer **Revert** ou `git revert`, puis pousser le nouveau commit sur `main`, plutôt qu'un force-push.

Pour désactiver l'automatisme : désactiver **Deploy NOEMA to Hostinger** dans Actions ; la version publique continue de fonctionner. Pour révoquer son accès au VPS : retirer uniquement la clé dans `/home/noema-deploy/.ssh/authorized_keys` et supprimer le secret dédié. Cela ne touche pas à l'accès SSH administrateur existant.

Le contrôle final tourne depuis le runner GitHub, à l'extérieur du VPS, avec DNS normal et validation TLS. Il vérifie le commit via l'en-tête `X-Noema-Release`, les pages canoniques, le XML du sitemap, `robots.txt`, l'API reliée à PostgreSQL et l'écran de connexion administrateur. Il ne crée pas de prospects et n'envoie pas d'emails à chaque push ; les tests unitaires isolés couvrent les formulaires et l'envoi.

Les conditions GitHub existantes et les quotas Actions s'appliquent. Ce mécanisme n'achète aucun service et ne change ni les DNS, ni WordPress, ni l'aperçu Render.
