<div align="center">
  <img width="900px" src="https://github.com/NextFightNetwork/OutlineToDiscord/assets/114857048/d64574ac-b583-4b8d-b9a4-184949b2d75c">
</div>

# Installation

1. Create `.env` file with the following content
  ```
  DISCORD_WEBHOOK=""
  PORT="3123"
  ```
2. Run `npm install`
3. Run `npm run start`

# Build & publish docker image

`docker build -t outlinewebhookbridge:latest -t ghcr.io/nextfightnetwork/outlinewebhookbridge:latest .`
`docker push ghcr.io/nextfightnetwork/outlinewebhookbridge:latest`