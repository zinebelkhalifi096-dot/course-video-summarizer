\# Course Video Summarizer



Colle un lien YouTube : l'application récupère la transcription, génère un résumé structuré et te permet de poser des questions sur la vidéo (RAG), avec des timestamps cliquables. Tout tourne en local grâce à Ollama.



!\[Démo](docs/demo.gif)



\## Fonctionnalités



\- \*\*Transcription\*\* : sous-titres YouTube en priorité, Whisper (faster-whisper) en secours

\- \*\*Résumé structuré\*\* : titre, résumé, points clés et définitions, avec une longueur au choix

\- \*\*Chat sur la vidéo\*\* : RAG avec embeddings `nomic-embed-text`, réponses avec références `\[mm:ss]` cliquables

\- \*\*Bibliothèque de cours\*\* enregistrée côté serveur, suivi « terminé », export des notes en Markdown

\- \*\*Présentateur animé\*\* qui lit le résumé à voix haute (synthèse vocale du navigateur)

\- \*\*Interface StudyFlow\*\* : accueil, bibliothèque, assistant de chat, paramètres



\## Comment ça marche



1\. Le lien est analysé avec `yt-dlp` (titre et durée) sans téléchargement.

2\. Les sous-titres sont lus avec `youtube-transcript-api`. S'il n'y en a pas, l'audio est téléchargé puis transcrit par Whisper.

3\. La transcription est découpée en passages et résumée par un LLM local (map-reduce pour les vidéos longues).

4\. Pour le chat, les passages sont transformés en embeddings. Les plus proches de la question (similarité cosinus) sont envoyés au LLM, qui répond en citant les moments de la vidéo.



\## Stack



\- \*\*Backend\*\* : Python, FastAPI, yt-dlp, youtube-transcript-api, faster-whisper, NumPy

\- \*\*IA locale\*\* : Ollama avec `qwen2.5` (résumé et chat) et `nomic-embed-text` (embeddings)

\- \*\*Frontend\*\* : React, Vite, react-markdown

\- \*\*Qualité\*\* : pytest, GitHub Actions



\## Prérequis



\- Python 3.12+ et Node.js 22+

\- \[FFmpeg](https://ffmpeg.org/download.html)

\- \[Ollama](https://ollama.com) avec les deux modèles :



```bash

ollama pull qwen2.5

ollama pull nomic-embed-text

```



\## Installation



\### Backend



```bash

cd backend

python -m venv venv

venv\\Scripts\\activate        # Linux / macOS : source venv/bin/activate

pip install -r requirements.txt

copy .env.example .env       # Linux / macOS : cp .env.example .env

uvicorn app.main:app --reload

```



Dans `.env`, renseigne `FFMPEG\_DIR` (dossier contenant `ffmpeg`) si FFmpeg n'est pas dans le PATH. `LLM\_MODEL` et `EMBED\_MODEL` permettent de changer de modèle.



\### Frontend



```bash

cd frontend

npm install

npm run dev

```



Ouvre l'adresse affichée (par défaut http://localhost:5173). Le backend écoute sur http://localhost:8000.



\## API



| Méthode | Route | Rôle |

|---|---|---|

| POST | `/videos` | Analyse une vidéo (`url`, `summary\_length`) |

| GET | `/videos` | Liste les cours enregistrés |

| GET | `/videos/{id}` | Résumé, transcription et segments d'un cours |

| PATCH | `/videos/{id}` | Marque un cours comme terminé (`done`) |

| DELETE | `/videos/{id}` | Supprime un cours et ses fichiers |

| POST | `/chat` | Pose une question sur un cours (`video\_id`, `question`) |

| GET | `/health` | Vérifie que le serveur répond |



La documentation interactive est disponible sur `/docs`.



\## Tests



```bash

cd backend

pip install -r requirements-dev.txt

pytest

```



Les tests n'ont besoin ni d'Ollama ni d'accès à YouTube : ces services sont simulés. Ils sont lancés automatiquement par GitHub Actions à chaque push.



\## Limites connues



\- Les LLM locaux sont lents sur CPU : compter une à deux minutes pour une vidéo sans sous-titres.

\- La qualité des résumés et des réponses dépend du modèle utilisé.

\- YouTube peut bloquer `yt-dlp` sur les serveurs cloud : le téléchargement d'audio fonctionne surtout en local.

\- Les vidéos très longues sont résumées par morceaux, ce qui peut faire perdre des détails.

\- Développé et testé sous Windows.



\## Pistes d'amélioration



\- Réponses du chat en streaming

\- Résumé structuré en JSON

\- Quiz et flashcards générés depuis la vidéo

\- Docker Compose



\## Auteure



Zineb El Khalifi, étudiante ingénieure en Systèmes d'Information et de Communication (ENSA El Jadida).

\[LinkedIn](https://www.linkedin.com/in/zineb-e-865826288/) · \[GitHub](https://github.com/zinebelkhalifi096-dot)

