# RAPPORT TECHNIQUE
## Plateforme Bancaire Distribuée — Architecture Microservices
### INF462 — Groupe 9

**Membres du groupe :**
- Zegou
- Anthony Kitio
- Ngo Esther
- Tafou

**Dépôt GitHub :** https://github.com/Remise-Tp-INF462-2026/INF462--Groupe9-Zegou-Anthony-Kitio-Ngo-esther-Tafou

**Date :** Juin 2026

---

## TABLE DES MATIÈRES

1. Introduction et contexte
2. Analyse des besoins (DDD)
3. Architecture globale
4. Infrastructure technique
5. Microservices développés
6. Interface utilisateur (Frontend)
7. Communication inter-services (Kafka)
8. Conteneurisation (Docker)
9. Orchestration (Kubernetes)
10. Pipeline CI/CD (GitHub Actions)
11. Sécurité
12. Tests et démonstration
13. Difficultés rencontrées
14. Conclusion et perspectives

---

## 1. INTRODUCTION ET CONTEXTE

### 1.1 Présentation du projet

Ce projet a pour objectif de concevoir et développer une **plateforme bancaire distribuée** basée sur une architecture microservices. Il s'inscrit dans le cadre du cours INF462 portant sur les systèmes distribués et les architectures cloud-native.

### 1.2 Objectifs

- Concevoir une plateforme bancaire moderne selon les principes des microservices
- Appliquer la méthodologie Domain-Driven Design (DDD)
- Mettre en place une infrastructure DevOps complète (Docker, Kubernetes, CI/CD)
- Développer une interface web professionnelle pour les utilisateurs

### 1.3 Technologies utilisées

| Catégorie | Technologies |
|-----------|-------------|
| Backend Java | Spring Boot 3.2, Spring Security, Spring Cloud |
| Backend Python | FastAPI, SQLAlchemy, Uvicorn |
| Backend Node.js | Express.js, Kafka.js |
| Frontend | React 18, Vite, Recharts |
| Bases de données | PostgreSQL 15, MongoDB 7, Redis 7 |
| Messagerie | Apache Kafka 3.5 |
| Infrastructure | Docker, Kubernetes, GitHub Actions |
| Sécurité | JWT, BCrypt, CORS |

---

## 2. ANALYSE DES BESOINS — DOMAIN DRIVEN DESIGN (DDD)

### 2.1 Acteurs du système

| Acteur | Rôle | Accès |
|--------|------|-------|
| CLIENT | Utilisateur final gérant ses comptes | Comptes, Transactions, Prêts, Documents |
| SUPER_ADMIN | Supervise toute la plateforme | Accès total |
| OPERATOR_ADMIN | Gère les clients et valide les prêts | Clients, Validation prêts |
| OPERATOR_ANALYST | Analyse les dossiers de prêts | Validation prêts |
| Système OCR/IA | Traite automatiquement les documents | Document service |

### 2.2 Bounded Contexts identifiés

L'analyse DDD a permis d'identifier **10 contextes délimités** :

1. **Identity & Access** — Authentification, autorisation, gestion des sessions JWT
2. **Customer Management** — Profils clients, KYC, vérification d'identité
3. **Account Management** — Comptes bancaires (Courant, Épargne, Mobile Money)
4. **Transaction Processing** — Dépôts, retraits, virements, historique
5. **Loan Management** — Demandes de prêt, scoring crédit, remboursements
6. **Document Processing** — OCR, extraction de données, vérification KYC
7. **Notification** — Alertes email, SMS, push notifications
8. **Reporting & Analytics** — Tableaux de bord, statistiques
9. **Configuration** — Config centralisée des microservices
10. **Service Discovery** — Registre et découverte des services

### 2.3 Agrégats principaux

- **User** (auth-service) : id, email, passwordHash, role, firstName, lastName
- **Customer** (customer-service) : id, userId, phoneNumber, address, creditScore, kycStatus
- **Account** (account-service) : id, accountNumber, customerId, type, balance, currency, status
- **Transaction** (transaction-service) : id, type, amount, sourceAccountId, destinationAccountId, status
- **Loan** (loan-service) : id, customerId, amount, durationMonths, interestRate, status, creditScore

### 2.4 Événements domaine

- `UserRegistered` → déclenche la création du profil client
- `TransactionCompleted` → publié sur Kafka, consommé par Notification service
- `TransactionFailed` → publié sur Kafka, déclenche une alerte
- `LoanApproved` → déclenche un versement sur le compte
- `KYCVerified` → met à jour le statut client

---

## 3. ARCHITECTURE GLOBALE

### 3.1 Vue d'ensemble

```
                    ┌─────────────────┐
                    │   FRONTEND      │
                    │  React / Vite   │
                    │  Port 5173      │
                    └────────┬────────┘
                             │ HTTP
                    ┌────────▼────────┐
                    │   API GATEWAY   │
                    │  Spring Cloud   │
                    │  Port 8080      │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌───────▼──────┐  ┌───────▼──────┐
   │Auth Service │   │Customer Svc  │  │Account Svc   │
   │Port 8081    │   │Port 8082     │  │Port 8083     │
   │Java/Spring  │   │Java/Spring   │  │Java/Spring   │
   └─────────────┘   └──────────────┘  └──────────────┘
          │
   ┌──────▼──────┐   ┌───────────────┐  ┌────────────┐
   │Transaction  │   │  Loan Service │  │  Document  │
   │Port 8084    │   │  Port 8086    │  │  Port 8087 │
   │Java/Spring  │   │  Python/Fast  │  │  Python    │
   └──────┬──────┘   └───────────────┘  └────────────┘
          │ Kafka
   ┌──────▼──────┐   ┌───────────────┐
   │Notification │   │  Config Srv   │
   │Port 8089    │   │  Port 8888    │
   │Node.js      │   │  Java/Spring  │
   └─────────────┘   └───────────────┘
```

### 3.2 Tableau des ports et services

| Service | Port | Technologie | Base de données | Rôle |
|---------|------|-------------|-----------------|------|
| API Gateway | 8080 | Java/Spring Cloud | — | Point d'entrée unique |
| Config Server | 8888 | Java/Spring Cloud | — | Configuration centralisée |
| Discovery Server | 8761 | Java/Eureka | — | Registre de services |
| Auth Service | 8081 | Java/Spring Boot | PostgreSQL (auth_db) | Authentification JWT |
| Customer Service | 8082 | Java/Spring Boot | PostgreSQL (customer_db) | Gestion clients |
| Account Service | 8083 | Java/Spring Boot | PostgreSQL (account_db) | Gestion comptes |
| Transaction Service | 8084 | Java/Spring Boot | PostgreSQL (transaction_db) | Transactions + Kafka |
| Loan Service | 8086 | Python/FastAPI | PostgreSQL (loan_db) | Prêts + scoring |
| Document Service | 8087 | Python/FastAPI | MongoDB | OCR + KYC |
| Notification Service | 8089 | Node.js/Express | MongoDB | Notifications + Kafka |
| Frontend | 5173 | React/Vite | — | Interface utilisateur |
| PostgreSQL | 5432 | Docker | — | Bases de données |
| Kafka | 9092 | Docker | — | Messagerie asynchrone |
| Redis | 6379 | Docker | — | Cache |
| MongoDB | 27017 | Docker | — | Documents/notifications |

---

## 4. INFRASTRUCTURE TECHNIQUE

### 4.1 Config Server (Port 8888)

Le Config Server Spring Cloud centralise la configuration de tous les microservices Java. Chaque service se connecte au démarrage pour récupérer ses paramètres (URL de base de données, secrets, etc.).

**Avantages :**
- Modification de la configuration sans redémarrage des services
- Configuration centralisée et versionnée
- Gestion des profils (dev, prod)

### 4.2 Discovery Server — Eureka (Port 8761)

Eureka permet aux microservices de s'enregistrer et de se découvrir mutuellement sans connaître leurs adresses IP fixes.

**Fonctionnement :**
1. Chaque service démarre et s'enregistre auprès d'Eureka
2. Quand un service a besoin d'en appeler un autre, il demande l'adresse à Eureka
3. L'API Gateway utilise Eureka pour router les requêtes

**Accès :** http://localhost:8761 (tableau de bord des services enregistrés)

### 4.3 API Gateway (Port 8080)

Point d'entrée unique de toute l'application. Il assure :
- Le **routage** des requêtes vers le bon microservice
- La **validation JWT** (filtre d'authentification)
- La gestion du **CORS** pour le frontend React
- L'**équilibrage de charge** entre instances


---

## 5. MICROSERVICES DÉVELOPPÉS

### 5.1 Auth Service (Java/Spring Boot — Port 8081)

**Responsabilité :** Authentification et gestion des sessions utilisateur.

**Endpoints principaux :**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /auth/register | Inscription d'un nouvel utilisateur |
| POST | /auth/login | Connexion et génération du token JWT |
| POST | /auth/refresh | Renouvellement du token |
| GET | /auth/health | Vérification de santé |

**Fonctionnalités :**
- Hashage des mots de passe avec **BCrypt**
- Génération de tokens **JWT** (expiration 15 minutes)
- Refresh tokens (UUID, durée longue)
- Rôles : CLIENT, OPERATOR_ADMIN, OPERATOR_ANALYST, SUPER_ADMIN

**Compte admin créé :** admin@bank.com / admin1234

### 5.2 Customer Service (Java/Spring Boot — Port 8082)

**Responsabilité :** Gestion des profils clients et vérification KYC.

**Endpoints principaux :**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /customers | Créer un profil client |
| GET | /customers | Lister tous les clients (admin) |
| GET | /customers/{id} | Détail d'un client |
| GET | /customers/by-user/{userId} | Client par userId |
| POST | /customers/{id}/verify | Vérifier un client |
| POST | /customers/{id}/suspend | Suspendre un client |

### 5.3 Account Service (Java/Spring Boot — Port 8083)

**Responsabilité :** Gestion des comptes bancaires.

**Types de comptes :** COURANT, EPARGNE, MOBILE_MONEY

**Endpoints principaux :**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /accounts | Ouvrir un compte |
| GET | /accounts | Tous les comptes (admin) |
| GET | /accounts/customer/{id} | Comptes d'un client |
| POST | /accounts/{id}/debit | Débiter un compte |
| POST | /accounts/{id}/credit | Créditer un compte |
| POST | /accounts/{id}/freeze | Bloquer un compte |
| POST | /accounts/{id}/close | Fermer un compte |

**Limites par défaut :**
- Limite journalière : 1 000 000 XOF
- Limite mensuelle : 5 000 000 XOF

### 5.4 Transaction Service (Java/Spring Boot — Port 8084)

**Responsabilité :** Traitement des transactions financières avec publication d'événements Kafka.

**Types de transactions :** DEPOT, RETRAIT, TRANSFERT_INTRA, TRANSFERT_INTER, REMBOURSEMENT_PRET, DECAISSEMENT_PRET

**Flux d'une transaction :**
1. Réception de la requête
2. Vérification du solde (appel à account-service)
3. Débit/crédit des comptes concernés
4. Enregistrement en base de données
5. Publication sur Kafka (`transaction.completed` ou `transaction.failed`)


### 5.5 Loan Service (Python/FastAPI — Port 8086)

**Responsabilité :** Gestion des demandes de prêt avec scoring automatique.

**Endpoints principaux :**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /loans | Soumettre une demande |
| GET | /loans | Toutes les demandes (admin) |
| GET | /loans/customer/{id} | Prêts d'un client |
| PUT | /loans/{id}/approve | Approuver un prêt |
| PUT | /loans/{id}/reject | Rejeter un prêt |

**Algorithme de scoring crédit :**
- Score calculé sur 1000 points
- Critères : montant, durée, historique, revenus déclarés
- Score >= 650 : approbation recommandée
- Score < 650 : révision manuelle requise

**Calcul de la mensualité (formule actuarielle) :**
```
M = C × (r × (1+r)^n) / ((1+r)^n - 1)
où : C = capital, r = taux mensuel, n = durée en mois
```

### 5.6 Document Service (Python/FastAPI — Port 8087)

**Responsabilité :** Analyse OCR des documents et vérification KYC.

**Types de documents supportés :** CNI, PASSEPORT, JUSTIFICATIF_DOMICILE, BULLETIN_SALAIRE, RELEVE_BANCAIRE, CONTRAT_TRAVAIL

**Endpoints :**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /documents/upload | Analyser un document (OCR) |
| POST | /documents/verify-kyc | Vérification KYC avec CNI |

**Résultat retourné :**
- `confidence_score` : score de confiance (0 à 1)
- `verification_status` : VERIFIED, PARTIAL, FAILED
- `extracted_info` : données extraites du document

### 5.7 Notification Service (Node.js/Express — Port 8089)

**Responsabilité :** Envoi de notifications et consommation des événements Kafka.

**Endpoints :**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /notifications/send | Envoyer une notification |
| GET | /notifications/history | Historique des notifications |
| GET | /notifications/health | Vérification de santé |

**Consommateur Kafka :**
- Écoute le topic `transaction.completed` → notification de succès
- Écoute le topic `transaction.failed` → alerte d'échec
- Fonctionne en mode non-bloquant (graceful degradation si Kafka est absent)

---

## 6. INTERFACE UTILISATEUR (FRONTEND)

### 6.1 Technologies

- **React 18** avec hooks (useState, useEffect, useContext)
- **Vite** comme bundler (démarrage rapide, HMR)
- **React Router v6** pour la navigation
- **Recharts** pour les graphiques du tableau de bord
- **Axios** pour les appels API avec intercepteurs JWT

### 6.2 Pages développées

| Page | Route | Accès | Description |
|------|-------|-------|-------------|
| Login | /login | Public | Connexion avec JWT |
| Register | /register | Public | Inscription |
| Dashboard | /dashboard | Tous | Statistiques, graphiques, résumé |
| Comptes | /accounts | Tous | Gestion des comptes bancaires |
| Transactions | /transactions | Tous | Historique et nouvelles transactions |
| Prêts | /loans | Tous | Demandes de prêt |
| Documents | /documents | Tous | Upload OCR + KYC |
| Validation Prêts | /loan-validation | Admin/Opérateur | Approuver/rejeter des prêts |
| Clients | /customers | Admin/Opérateur | Gestion des clients |


### 6.3 Fonctionnalités de l'interface

**Sidebar professionnelle :**
- Navigation collapsible (mode icône ou étendu)
- Affichage du profil utilisateur avec initiales
- Badge de rôle coloré
- Cloche de notifications avec compteur
- Indicateur de statut en temps réel des 7 microservices (healthcheck toutes les 30 secondes)
- Séction Administration visible uniquement pour les rôles admin
- Bouton de déconnexion

**Tableau de bord (Dashboard) :**
- 4 cartes de statistiques : solde total, comptes actifs, transactions, prêts
- Graphique d'évolution du solde (AreaChart)
- Graphique de répartition des comptes (PieChart)
- Histogramme d'activité de la semaine (BarChart)
- Actions rapides vers les autres pages
- Aperçu des comptes bancaires

**Gestion des accès par rôle :**
- CLIENT : voit uniquement ses propres données
- SUPER_ADMIN / OPERATOR_ADMIN / OPERATOR_ANALYST : voient toutes les données de la plateforme

### 6.4 Sécurité frontend

- Token JWT stocké dans le contexte React (AuthContext)
- Intercepteur Axios qui injecte automatiquement le header `Authorization: Bearer <token>`
- Redirection automatique vers /login si token expiré
- Protection des routes avec `ProtectedRoute` (React Router)

---

## 7. COMMUNICATION INTER-SERVICES (KAFKA)

### 7.1 Architecture événementielle

Apache Kafka est utilisé pour la **communication asynchrone** entre les microservices. Cela découple les services et garantit qu'un événement ne sera pas perdu même si le consommateur est temporairement indisponible.

### 7.2 Topics utilisés

| Topic | Producteur | Consommateur | Déclencheur |
|-------|-----------|--------------|-------------|
| transaction.completed | transaction-service | notification-service | Transaction réussie |
| transaction.failed | transaction-service | notification-service | Transaction échouée |

### 7.3 Format des messages

```json
{
  "transactionId": "uuid",
  "type": "DEPOT",
  "amount": 50000,
  "currency": "XOF",
  "sourceAccountId": "uuid",
  "destinationAccountId": "uuid",
  "status": "COMPLETED",
  "timestamp": "2026-06-23T10:00:00Z"
}
```

### 7.4 Résilience

Les services fonctionnent en **mode dégradé** si Kafka n'est pas disponible :
- Le transaction-service continue à traiter les transactions
- La publication Kafka est tentée mais n'est pas bloquante
- Le notification-service retente la connexion automatiquement

---

## 8. CONTENEURISATION (DOCKER)

### 8.1 Dockerfiles

Chaque microservice possède son propre `Dockerfile` optimisé :

**Services Java (multi-stage build) :**
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:resolve
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Services Python :**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8086
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8086"]
```


### 8.2 Docker Compose

Deux fichiers Docker Compose sont fournis :

**`docker-compose.yml`** — Bases de données uniquement (développement local) :
- PostgreSQL 15 (port 5432) avec initialisation automatique des bases
- MongoDB 7 (port 27017)
- Apache Kafka 3.5 + Zookeeper (port 9092)
- Redis 7 (port 6379)

**`docker-compose.full.yml`** — Application complète :
- Tous les services ci-dessus
- Les 7 microservices
- L'API Gateway
- Le frontend React

### 8.3 Initialisation automatique des bases de données

Le fichier `docker/init-databases.sql` crée automatiquement les 6 bases de données au premier démarrage :

```sql
CREATE DATABASE auth_db;
CREATE DATABASE customer_db;
CREATE DATABASE account_db;
CREATE DATABASE transaction_db;
CREATE DATABASE loan_db;
CREATE DATABASE notification_db;
```

---

## 9. ORCHESTRATION (KUBERNETES)

### 9.1 Structure des manifestes

12 fichiers YAML ont été créés dans le dossier `k8s/` :

| Fichier | Contenu |
|---------|---------|
| namespace.yml | Namespace isolé `bankplatform` |
| configmap.yml | Variables de configuration + Secrets |
| postgres.yml | Déploiement PostgreSQL avec volume persistant |
| config-server.yml | Config Server (1 réplica) |
| discovery-server.yml | Eureka (1 réplica) |
| api-gateway.yml | API Gateway (2 réplicas) |
| auth-service.yml | Auth Service (2 réplicas) |
| customer-service.yml | Customer Service (2 réplicas) |
| account-service.yml | Account Service (2 réplicas) |
| transaction-service.yml | Transaction Service (2 réplicas) |
| loan-service.yml | Loan Service (2 réplicas) |
| notification-service.yml | Notification Service (1 réplica) |

### 9.2 Caractéristiques des déploiements

Chaque Deployment Kubernetes inclut :

- **Réplication** : 2 instances pour la haute disponibilité
- **Readiness Probe** : vérifie que le service répond sur `/health` avant de recevoir du trafic
- **Limites de ressources** :
  - Mémoire : 256Mi (request) / 512Mi (limit)
  - CPU : 250m (request) / 500m (limit)
- **Variables d'environnement** injectées depuis ConfigMap et Secrets

### 9.3 Gestion des secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: bankplatform-secrets
  namespace: bankplatform
stringData:
  POSTGRES_PASSWORD: "postgres"
  JWT_SECRET: "bankplatform-secret-key-jwt"
```

### 9.4 Déploiement avec le script

```bash
# Depuis le dossier k8s/
bash deploy-all.sh

# Vérification
kubectl get pods -n bankplatform
kubectl get services -n bankplatform
```

Le script `deploy-all.sh` respecte l'ordre des dépendances en utilisant `kubectl wait` entre chaque étape.

---

## 10. PIPELINE CI/CD (GITHUB ACTIONS)

### 10.1 Déclencheurs

Le pipeline se déclenche automatiquement :
- À chaque **push** sur les branches `main` ou `develop`
- À chaque **pull request** vers `main`

### 10.2 Structure du pipeline (5 jobs)

```
Job 1: Build Java (7 services en parallèle)
    ↓
Job 2: Build Python (loan-service)    Job 3: Build Node.js (notification-service)
    ↓                                      ↓
Job 4: Build & Push Docker Images (si push sur main)
    ↓
Job 5: Deploy to Kubernetes (si push sur main)
```


### 10.3 Détail des jobs

**Job 1 — Build Java (Matrix Strategy) :**
- Java 17 (Temurin) + Maven
- `mvn clean package -DskipTests` pour chaque service
- Upload des JARs comme artefacts

**Job 2 — Build Python :**
- Python 3.12
- Installation des dépendances (`pip install -r requirements.txt`)
- Vérification syntaxique (`python -m py_compile`)

**Job 3 — Build Node.js :**
- Node.js 20 + npm cache
- `npm ci` (installation propre)
- Vérification syntaxique (`node --check`)

**Job 4 — Docker Build & Push :**
- Connexion au Docker Hub avec secrets GitHub
- Build et push de 9 images Docker
- Double tag : `latest` et `sha-commit` (traçabilité)
- Cache GitHub Actions pour accélérer les builds

**Job 5 — Déploiement Kubernetes :**
- Mise à jour des tags d'images dans les manifestes YAML
- `kubectl apply` sur tous les fichiers
- Vérification du rollout avec `kubectl rollout status`
- Affichage final de l'état des pods

### 10.4 Secrets GitHub configurés

| Secret | Usage |
|--------|-------|
| DOCKER_USERNAME | Login Docker Hub |
| DOCKER_PASSWORD | Mot de passe Docker Hub |
| KUBECONFIG | Credentials Kubernetes (base64) |

---

## 11. SÉCURITÉ

### 11.1 Authentification JWT

- Algorithme : **HS256** (HMAC SHA-256)
- Durée de vie : **15 minutes** (access token)
- Refresh token : **UUID** avec durée longue
- Claims : `sub` (userId), `email`, `role`, `iat`, `exp`

### 11.2 Hashage des mots de passe

- Algorithme : **BCrypt** (facteur de coût : 10 rounds)
- Aucun mot de passe en clair stocké en base

### 11.3 CORS (Cross-Origin Resource Sharing)

Configuré sur tous les services Java pour autoriser les requêtes du frontend React :
```java
@CrossOrigin(origins = "*")
// ou via CorsConfig.java dans l'API Gateway
```

### 11.4 Validation des entrées

- Annotations `@Valid`, `@NotNull`, `@NotBlank` sur tous les DTOs Java
- Validation Pydantic sur les services Python FastAPI
- Paramétrage des requêtes SQL via JPA (protection injection SQL)

### 11.5 Filtre JWT dans l'API Gateway

Chaque requête passant par l'API Gateway est interceptée par le `JwtAuthenticationFilter` qui :
1. Extrait le token du header `Authorization: Bearer <token>`
2. Valide la signature et l'expiration
3. Autorise ou rejette la requête (401 si invalide)

---

## 12. TESTS ET DÉMONSTRATION

### 12.1 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| CLIENT | test@bank.com | password123 |
| SUPER_ADMIN | admin@bank.com | admin1234 |

### 12.2 Scénario de démonstration complet

**Étape 1 — Démarrage de l'infrastructure**
```powershell
docker compose up -d
# Démarre : PostgreSQL, MongoDB, Redis, Kafka
```

**Étape 2 — Démarrage des services**
```
Config Server (8888) → Eureka (8761) → Auth (8081) → Customer (8082)
→ Account (8083) → Transaction (8084) → Loan (8086) → Document (8087)
→ Notification (8089) → Frontend (5173)
```

**Étape 3 — Démonstration CLIENT**
1. Inscription d'un nouveau client (Register)
2. Connexion (Login) → réception du JWT
3. Ouverture d'un compte courant
4. Effectuer un dépôt de 100 000 XOF
5. Faire un virement interne
6. Soumettre une demande de prêt de 500 000 XOF
7. Uploader un document CNI (vérification KYC)

**Étape 4 — Démonstration ADMIN**
1. Connexion avec admin@bank.com
2. Visualisation de tous les clients dans "Gestion des Clients"
3. Visualisation de tous les comptes dans "Tous les Comptes"
4. Validation/rejet d'une demande de prêt dans "Validation des Prêts"
5. Vérification du statut des microservices (indicateur sidebar)

### 12.3 Vérification des API (test-api.http)

Un fichier `test-api.http` est fourni avec les requêtes REST prêtes à l'emploi pour tester tous les endpoints depuis VS Code (extension REST Client).


---

## 13. DIFFICULTÉS RENCONTRÉES ET SOLUTIONS

### 13.1 Incompatibilité Java 26 avec Lombok

**Problème :** Java 26 (version installée) n'est pas compatible avec Lombok, ce qui empêchait la compilation de tous les services Java.

**Solution :** Abandon de Lombok. Remplacement par des getters/setters manuels et un Builder pattern implémenté manuellement dans chaque entité. Cela a rendu le code plus verbeux mais totalement fonctionnel et indépendant.

### 13.2 Duplication de clé YAML dans transaction-service

**Problème :** Une clé `spring:` dupliquée dans `application.yml` causait une erreur de démarrage.

**Solution :** Fusion des deux blocs `spring:` en un seul bloc cohérent.

### 13.3 Absence de script npm "dev"

**Problème :** Le frontend ne démarrait pas avec `npm run dev` — le script manquait dans `package.json`.

**Solution :** Ajout du script `"dev": "vite"` dans le `package.json` du frontend.

### 13.4 Scrolling du sidebar

**Problème :** Les éléments en bas du sidebar (statut services, bouton déconnexion) n'étaient plus visibles sur les écrans avec beaucoup d'éléments de menu.

**Solution :** Remplacement de `minHeight: '100vh'` par `height: '100vh'` et ajout de `overflowY: 'auto'` sur le sidebar. Correction également d'une double accolade `}}>` parasite qui causait une erreur de syntaxe JSX.

### 13.5 Communication cross-origin (CORS)

**Problème :** Le frontend React (port 5173) recevait des erreurs CORS en appelant les microservices Java.

**Solution :** Ajout de `@CrossOrigin(origins = "*")` sur tous les contrôleurs et configuration globale du CORS dans l'API Gateway.

### 13.6 Isolation Maven dans des terminaux différents

**Problème :** La commande `mvn` n'était pas reconnue dans les nouveaux terminaux PowerShell car le PATH n'était pas configuré globalement.

**Solution :** Ajout manuel du PATH Maven dans chaque terminal :
```powershell
$env:Path += ";C:\Users\THE EYE INFORMATIQUE\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin"
```

---

## 14. CONCLUSION ET PERSPECTIVES

### 14.1 Bilan du projet

Ce projet a permis de concevoir et implémenter une **plateforme bancaire microservices complète** couvrant l'ensemble des exigences du TP INF462 :

✅ Architecture microservices avec 7 services indépendants  
✅ Approche DDD avec 10 bounded contexts identifiés  
✅ Multi-langages : Java, Python, Node.js  
✅ Communication asynchrone via Apache Kafka  
✅ Interface web professionnelle avec React  
✅ Conteneurisation Docker de tous les services  
✅ Manifestes Kubernetes pour le déploiement cloud  
✅ Pipeline CI/CD automatisé avec GitHub Actions  
✅ Gestion des rôles et sécurité JWT  
✅ Documentation complète (11 livrables)

### 14.2 Métriques du projet

| Indicateur | Valeur |
|-----------|--------|
| Microservices développés | 7 services + 3 infrastructure |
| Langages de programmation | 3 (Java, Python, Node.js) |
| Pages frontend | 9 pages |
| Endpoints API | ~50 endpoints |
| Fichiers Kubernetes | 12 manifestes YAML |
| Jobs CI/CD | 5 jobs GitHub Actions |
| Tables de base de données | ~15 tables PostgreSQL |
| Diagrammes UML | 8 diagrammes PlantUML |

### 14.3 Perspectives d'amélioration

**Court terme :**
- Ajout de tests unitaires et d'intégration (JUnit, Pytest)
- Mise en place d'un circuit breaker (Resilience4j)
- Logs centralisés avec ELK Stack (Elasticsearch, Logstash, Kibana)

**Moyen terme :**
- Service de monitoring avec Prometheus + Grafana
- Authentification OAuth2 / OpenID Connect
- Pagination et filtrage avancé sur toutes les APIs

**Long terme :**
- Déploiement sur cloud public (AWS EKS, GCP GKE, Azure AKS)
- Service mesh (Istio) pour la gestion du trafic
- Ajout d'un service de reporting et d'analytics temps réel
- Application mobile (React Native)

---

## ANNEXES

### Annexe A — Liens utiles

| Ressource | URL |
|-----------|-----|
| Dépôt GitHub | https://github.com/Remise-Tp-INF462-2026/INF462--Groupe9-Zegou-Anthony-Kitio-Ngo-esther-Tafou |
| Eureka Dashboard | http://localhost:8761 |
| API Gateway | http://localhost:8080 |
| Frontend | http://localhost:5173 |
| Config Server | http://localhost:8888/actuator/health |

### Annexe B — Commandes essentielles

```powershell
# Démarrer les bases de données
docker compose up -d

# Vérifier les services Docker
docker compose ps

# Arrêter tout
docker compose down

# Déploiement Kubernetes
cd k8s && bash deploy-all.sh

# Voir les pods K8s
kubectl get pods -n bankplatform
```

### Annexe C — Structure du projet

```
tp 462/
├── infrastructure/
│   ├── api-gateway/          # Spring Cloud Gateway
│   ├── config-server/        # Spring Cloud Config
│   └── discovery-server/     # Eureka
├── services/
│   ├── auth-service/         # Java/Spring Boot
│   ├── customer-service/     # Java/Spring Boot
│   ├── account-service/      # Java/Spring Boot
│   ├── transaction-service/  # Java/Spring Boot + Kafka
│   ├── loan-service/         # Python/FastAPI
│   ├── document-service/     # Python/FastAPI
│   └── notification-service/ # Node.js/Express + Kafka
├── frontend/                 # React/Vite
├── k8s/                      # Manifestes Kubernetes
├── docker/                   # Scripts d'initialisation
├── .github/workflows/        # Pipeline CI/CD
├── docker-compose.yml        # Bases de données
├── docker-compose.full.yml   # Application complète
└── DEMARRAGE.md              # Guide de démarrage
```

---

*Rapport généré dans le cadre du TP INF462 — Architecture Microservices*
*Groupe 9 — Juin 2026*
