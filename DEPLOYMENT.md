# PDF Service

Standalone PDF generation microservice extracted from EasyManage.

## Project Structure

```
pdf-service/
├── src/
│   ├── server.js          # Express server with API endpoints
│   ├── pdf.js             # Core PDF generation logic
│   └── templates/         # HTML templates (optional)
├── package.json           # Dependencies and scripts
├── Dockerfile             # Docker configuration
├── render.yaml            # Render.com deployment config
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── README.md              # Full documentation
└── test-service.js        # Test suite
```

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   # Edit .env and set your API_KEY
   ```

3. **Start the service:**
   ```bash
   npm start
   ```

4. **Test the service:**
   ```bash
   node test-service.js
   ```

## Deployment

See full [README.md](README.md) for detailed deployment instructions.

### Render.com Quick Deploy

1. Push to GitHub/GitLab
2. Connect to Render.com
3. Deploy with `render.yaml` configuration
4. Set environment variables
5. Done!

## API Endpoints

- `GET /health` - Health check
- `POST /generate` - Generate PDF from HTML (requires API key)

See [README.md](README.md) for full API documentation and examples.

## License

MIT
