## Transcription Tool

### Usage
- Clone the project.
- Create a file called `.env.local` at the project base with the environment variables.
- `npm install`
- `npm run dev`

### Structure

#### Frontend
- This is a NextJS React project. It is deployed on **AWS Amplify** which automatically pulls the main and dev branches for builds.
- The `components/ui` folder contains the ShadCN UI components used to ease development.

#### Backend
- The project uses NextJS backend located in `app/api` to make calls to various services (Supabase, Oracle Cloud Instance).  
- The `backend` folder is placed in the oracle cloud instance running Whisper.
- The `backend/app/main.py` file runs the FastAPI server to create a public endpoint for the /transcribe api route to transcribe audio.
- The `backend` folder also contains docker scripts to run traefik to open the port via HTTPS to allow to be accessible from the frontend.

#### Known Issues
- Large files: When processing large files, the API call can time out. It can be fixed by returning the API call immediately, and continue transcribing in the background.
