# Smart Plant Pot 🌿

A full-stack IoT solution for plant care monitoring and automation.

---

## 📦 Services Overview

| Service         | Tech Stack            | Description                                       | Deployment             |
|-----------------|-----------------------|---------------------------------------------------|------------------------|
| **User Server** | Python FastAPI        | Backend for managing users and devices            | Cloud Run              |
| **Device Server** | .NET                | Handles MQTT and device control                   | GCE VM                 |
| **Admin Panel** | Next.js               | Web admin interface                               | Cloud Run              |
| **Mobile App**  | Expo / React Native   | User-facing mobile app                            | Manual / Expo Go       |

---

## I. ✅ Prerequisites

### Google Cloud Platform
- [ ] Create/select a GCP project
- [ ] Enable billing
- [ ] Note the **Project ID**

### Installations
- [ ] [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
  ```bash
  gcloud auth login
  gcloud config set project <PROJECT_ID>
  ```
- [ ] Enable Required APIs:
  ```bash
  gcloud services enable \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    compute.googleapis.com \
    secretmanager.googleapis.com \
    iam.googleapis.com
  ```

- [ ] Install:
  - [Git](https://git-scm.com/)
  - [Docker](https://www.docker.com/) (optional but recommended)

### External Services

#### Authentication (e.g., [Clerk.dev](https://clerk.dev))
- [ ] Create app
- [ ] Note:
  - Publishable Key
  - Secret Key
  - JWKS URL
  - Audience
  - Webhook Secret

#### PostgreSQL
- [ ] Set up hosted DB
- [ ] Note connection string & credentials

#### MQTT Broker (e.g., EMQX)
- [ ] Note:
  - Broker address
  - Port
  - Username
  - Password

---

## II. ☁️ GCP One-Time Setup

- [ ] Create **Artifact Registry** repositories
- [ ] Provision **GCE VM** for the Device Server

---

## III. 🛠️ Code Configuration

### 🔁 Clone the repository
```bash
git clone <repo_url>
cd smart_plant_pot
```

### 📦 User Server (FastAPI)
Update `.env` or settings file:
```env
DATABASE_URL=<your_postgresql_url>
CLERK_SECRET_KEY=<your_clerk_secret>
JWKS_URL=<your_clerk_jwks_url>
CLERK_AUDIENCE=<your_clerk_audience>
CLERK_WEBHOOK_SECRET=<your_webhook_secret>
```

### 🔌 Device Server (.NET)
Update `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "<your_postgresql_url>"
},
"MqttSettings": {
  "BrokerAddress": "<broker_url>",
  "Port": <port>,
  "Username": "<mqtt_user>",
  "Password": "<mqtt_pass>"
}
```

### 🖥️ Admin Panel (Next.js)
Update `bh-admin-panel/cloudbuild.yaml`:
```yaml
substitutions:
  _NEXT_PUBLIC_API_URL: <User Server URL>
  _NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: <Clerk Publishable Key>
  _CLERK_SECRET_KEY: <Clerk Secret Key>
```

### 📱 Mobile App (Expo)
Update `.env` in `mobile-app`:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<your_key>
```
Update `api.ts`:
```ts
export const API_BASE_URL = "<User Server URL>";
```

---

## IV. 🚀 Cloud Build Triggers

### Backend Trigger
- For: User & Device Servers
- Trigger on: Push to `main`
- Config file: `cloudbuild.yaml`

### Frontend Trigger
- For: Admin Panel
- Trigger on: Push to `bh-admin-panel/`
- Config file: `bh-admin-panel/cloudbuild.yaml`

---

## V. 🚢 Initial Deployment

- [ ] Commit and push code
- [ ] Monitor build:
  - GCP Console → **Cloud Build > History**
- [ ] Confirm deployments:
  - **Cloud Run** (User Server & Admin Panel)
  - **GCE VM** (Device Server)

---

## VI. 📲 Mobile App Setup

```bash
cd bh-app
# Ensure correct .env values and API URL
npx expo start
```

---

## 🎉 Done!
You're now set up to run the Smart Plant Pot ecosystem 🌱
