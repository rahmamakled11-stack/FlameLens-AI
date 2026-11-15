# SecureAI — working MVP

A small local prototype of the SecureAI website with a Python backend and working security tools.

## Run

1. Install Python 3.9+.
2. Open a terminal in this folder.
3. Run:

```bash
python server.py
```

4. Open `http://127.0.0.1:8000`.

## Working now

- Link checker: local phishing-risk heuristics
- Message checker: local scam/phishing heuristics
- File metadata scanner: file name, size, SHA-256 (not malware detection)
- Security self-check: calculates a device hygiene score from user answers
- Security assistant: safe rule-based guidance
- Session activity history
- Responsive dark/light UI

## Production roadmap

This MVP is intentionally safe and local. Before selling it as a real security product, add authentication, a real database, rate limits, billing, HTTPS, server-side file scanning, threat-intelligence feeds, logging/monitoring, and a properly audited AI/analysis layer. Never claim that a local heuristic scan guarantees a device or file is clean.


## AI Questions
The Ask Security AI section uses `/api/ask`. Without an API key it uses the built-in defensive fallback. To enable live AI answers, set `OPENAI_API_KEY` in the environment before starting the server. Optionally set `OPENAI_MODEL` (default: `gpt-5.6-luna`). The server keeps the key on the backend; it is never placed in the browser code.

Premium pricing is set to **20 EGP/month** (about $0.39 at the displayed exchange rate).
