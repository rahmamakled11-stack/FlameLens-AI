from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import json, os, re, html, hashlib, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.abspath(__file__))
HISTORY = []

SUSPICIOUS_WORDS = [
    'urgent','verify','verification','password','otp','login','account suspended',
    'click here','claim','prize','winner','gift','bank','crypto','bitcoin','free',
    'limited time','act now','security alert','confirm your account'
]
SHORTENERS = {'bit.ly','tinyurl.com','t.co','is.gd','ow.ly','cutt.ly','rb.gy'}


def add_history(kind, target, result):
    HISTORY.insert(0, {
        'kind': kind,
        'target': target[:80],
        'status': result['status'],
        'score': result['score'],
        'timestamp': int(time.time())
    })
    del HISTORY[20:]


def analyze_url(raw):
    raw = (raw or '').strip()
    score = 90
    reasons = []
    if not raw:
        return {'status':'error','score':0,'level':'Unknown','reasons':['Enter a URL first.']}
    candidate = raw if re.match(r'^https?://', raw, re.I) else 'https://' + raw
    p = urlparse(candidate)
    host = (p.hostname or '').lower()
    if p.scheme != 'https':
        score -= 20; reasons.append('The link does not use HTTPS.')
    if '@' in p.netloc or '@' in raw:
        score -= 25; reasons.append('The URL contains an @ symbol, which can be used to disguise the destination.')
    if host in SHORTENERS:
        score -= 15; reasons.append('This is a URL-shortening service; the final destination is hidden.')
    if len(raw) > 160:
        score -= 10; reasons.append('The URL is unusually long.')
    if raw.count('-') >= 5:
        score -= 10; reasons.append('The domain/path contains many hyphens.')
    if re.search(r'(login|verify|secure|account|update|wallet|password)', raw, re.I):
        score -= 10; reasons.append('The link contains words commonly used in phishing pages.')
    if re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', host):
        score -= 30; reasons.append('The destination uses a raw IP address instead of a domain name.')
    score = max(0, min(100, score))
    if score >= 75: level, status = 'Low risk', 'Safe'
    elif score >= 45: level, status = 'Medium risk', 'Caution'
    else: level, status = 'High risk', 'Risk'
    reasons.insert(0, f'Domain detected: {host or "unknown"}')
    return {'status':status,'score':score,'level':level,'reasons':reasons,'normalized_url':candidate}


def analyze_message(text):
    text = (text or '').strip()
    if not text:
        return {'status':'error','score':0,'level':'Unknown','reasons':['Paste a message or email first.']}
    lower = text.lower()
    hits = [w for w in SUSPICIOUS_WORDS if w in lower]
    score = max(0, 95 - min(70, len(hits)*9))
    reasons = []
    if hits:
        reasons.append('Suspicious language detected: ' + ', '.join(hits[:6]))
    if re.search(r'https?://|www\.', text, re.I):
        score -= 8; reasons.append('The message contains a link; verify its destination before opening it.')
    if re.search(r'\b\d{4,8}\b', text):
        score -= 8; reasons.append('The message contains a number that may be an OTP or verification code; never share codes with others.')
    if re.search(r'\b(urgent|immediately|now|within)\b', lower):
        score -= 8; reasons.append('Urgency is a common social-engineering tactic.')
    score = max(0, min(100, score))
    if score >= 75: level, status = 'Low risk', 'Safe'
    elif score >= 45: level, status = 'Medium risk', 'Caution'
    else: level, status = 'High risk', 'Risk'
    if not reasons:
        reasons.append('No obvious phishing indicators were found by the local rules.')
    return {'status':status,'score':score,'level':level,'reasons':reasons}


def security_check(payload):
    answers = payload or {}
    score = 100
    issues = []
    checks = [
        ('two_factor', 'Enable two-factor authentication', 20),
        ('updates', 'Keep your operating system and apps updated', 15),
        ('screen_lock', 'Use a screen lock / device PIN', 15),
        ('backup', 'Keep an important-data backup', 10),
        ('password_manager', 'Use unique passwords or a password manager', 15),
        ('public_wifi', 'Avoid sensitive logins on unknown public Wi-Fi', 10),
    ]
    for key, label, penalty in checks:
        if answers.get(key) in [False, 'false', 'no', 0, '0']:
            score -= penalty
            issues.append(label)
    if score >= 85: status='Safe'
    elif score >= 60: status='Caution'
    else: status='Risk'
    return {'status':status,'score':score,'level':status,'reasons':issues or ['No major issues reported in this self-check.']}


class Handler(SimpleHTTPRequestHandler):
    def end_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin','*')
        self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/history':
            return self.end_json({'history': HISTORY})
        if path == '/api/health':
            return self.end_json({'ok':True,'service':'SecureAI local MVP'})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if not path.startswith('/api/'):
            return self.end_json({'error':'Not found'},404)
        try:
            length = int(self.headers.get('Content-Length','0'))
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode('utf-8') or '{}')
        except Exception:
            return self.end_json({'error':'Invalid JSON'},400)

        if path == '/api/check-url':
            result = analyze_url(payload.get('url'))
            if result['status'] != 'error': add_history('Link scan', payload.get('url',''), result)
            return self.end_json(result)
        if path == '/api/check-message':
            result = analyze_message(payload.get('text'))
            if result['status'] != 'error': add_history('Message scan', payload.get('text',''), result)
            return self.end_json(result)
        if path == '/api/security-check':
            result = security_check(payload)
            add_history('Security check', 'Device self-check', result)
            return self.end_json(result)
        if path == '/api/ask':
            q = (payload.get('question') or '').strip()
            if not q: return self.end_json({'answer':'Ask a security question first.'},400)
            result = {'answer': ask_ai(q)}
            return self.end_json(result)
        if path == '/api/scan-file':
            # Safe demo: only calculates hash and metadata; it does not claim malware detection.
            name = str(payload.get('name') or 'unknown')
            size = int(payload.get('size') or 0)
            sha = str(payload.get('sha256') or '')
            return self.end_json({'status':'Caution','score':70,'level':'Metadata check','reasons':['This MVP only checks file metadata and SHA-256. Connect a malware-analysis service before calling a file clean.'],'name':name,'size':size,'sha256':sha})
        return self.end_json({'error':'Unknown endpoint'},404)

    def log_message(self, format, *args):
        # quieter local server
        pass


def ask_ai(question):
    """Use OpenAI Responses API when OPENAI_API_KEY is configured; otherwise use safe local fallback."""
    api_key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not api_key:
        return local_answer(question)

    model = os.environ.get('OPENAI_MODEL', 'gpt-5.6-luna')
    prompt = (
        "You are SecureAI, a defensive cybersecurity assistant for everyday users. "
        "Give concise, practical, safe guidance. Do not provide instructions for breaking into systems, "
        "stealing credentials, evading security controls, malware deployment, or other harmful activity. "
        "For uncertain cases, say what cannot be verified and recommend trusted official support.\n\n"
        f"User question: {question}"
    )
    body = json.dumps({
        'model': model,
        'input': prompt,
        'max_output_tokens': 500
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.openai.com/v1/responses',
        data=body,
        headers={
            'Authorization': 'Bearer ' + api_key,
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        # Responses API output can contain several content items; collect text safely.
        chunks = []
        for item in data.get('output', []):
            for content in item.get('content', []) if isinstance(item, dict) else []:
                if isinstance(content, dict) and content.get('type') in ('output_text', 'text'):
                    if content.get('text'):
                        chunks.append(content['text'])
        answer = '\n'.join(chunks).strip()
        if answer:
            return answer
        return local_answer(question)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return local_answer(question)


def local_answer(q):
    l = q.lower()
    if 'otp' in l or 'code' in l:
        return 'Never share an OTP or verification code with another person. If a message asks for it, open the official app or website yourself and verify the request.'
    if 'password' in l:
        return 'Use a unique, long password for each important account and turn on two-factor authentication whenever it is available.'
    if 'link' in l or 'url' in l or 'phishing' in l:
        return 'Do not open a suspicious link just to test it. Check the domain carefully, prefer HTTPS, and independently visit the organization’s official website.'
    if 'click' in l and 'suspicious' in l:
        return 'If you clicked a suspicious link, avoid entering passwords or codes, close the page, run your normal security checks, and change a password from the official website if you entered it there.'
    if 'virus' in l or 'malware' in l:
        return 'This MVP cannot prove that a device is malware-free. Use a reputable security product and keep the operating system and apps updated.'
    return 'Start with the Link Check, Message Check, and Security Check tools. SecureAI will flag common warning signs and explain safer next steps.'
