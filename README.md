<div align="center">
  <img width="900px" src="https://github.com/NextFightNetwork/OutlineToDiscord/assets/114857048/d64574ac-b583-4b8d-b9a4-184949b2d75c">
</div>

# Installation

1. Create the `.env` file with the following content (If you are not using Docker)
  ```
  DISCORD_WEBHOOK=""
  PORT="3123"
  ```
2. Run `npm install`
3. Run `npm run start`

# Build & publish docker image

Build
```
docker build -t outlinewebhookbridge:latest -t ghcr.io/nextfightnetwork/outlinewebhookbridge:latest .
```

Publish
```
docker push ghcr.io/nextfightnetwork/outlinewebhookbridge:latest
```
