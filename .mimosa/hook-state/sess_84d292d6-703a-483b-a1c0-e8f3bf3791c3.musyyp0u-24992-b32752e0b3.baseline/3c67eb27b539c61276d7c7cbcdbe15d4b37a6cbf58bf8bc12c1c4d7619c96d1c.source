// @ts-nocheck
export const config = {
  matcher: [
    '/((?!api|_vercel|.*\\..*).*)',
  ],
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // Public product entry points. Authentication inside Trade and Recovery is
  // handled by each application; the legacy whole-site password gate must not
  // hide the shared landing page or either product.
  if (
    url.pathname === '/' ||
    url.pathname === '/trade' ||
    url.pathname.startsWith('/trade/') ||
    url.pathname === '/recovery' ||
    url.pathname.startsWith('/recovery/')
  ) {
    return;
  }

  const gateCookie = request.headers.get('cookie')?.includes('site_gate_passed=1');
  const SITE_PASSWORD = process.env.SITE_PASSWORD || '';

  if (gateCookie) {
    if (url.pathname === '/gate') {
      return Response.redirect(new URL('/login', request.url), 302);
    }
    return; // Pass through to normal routing
  }

  if (url.pathname === '/gate') {
    let error = false;
    let errorMessage = '';

    if (request.method === 'POST') {
      errorMessage = 'Incorrect password. Please try again.';
      try {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const password = params.get('password') || '';

        // Safely check password, allowing for accidental trailing spaces in env var
        const envPass = process.env.SITE_PASSWORD || '';
        if (password === envPass || password.trim() === envPass.trim()) {
          return new Response(null, {
            status: 302,
            headers: {
              'Location': new URL('/login', request.url).toString(),
              'Set-Cookie': 'site_gate_passed=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000'
            }
          });
        } else {
          error = true;
          if (envPass.trim() === '') {
            errorMessage = 'System configuration error: SITE_PASSWORD environment variable is not set in Vercel.';
          } else {
            errorMessage = 'Incorrect password. Please try again.';
          }
        }
      } catch (e) {
        error = true;
        errorMessage = 'System error while checking password. ' + String(e);
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Gate</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #f8fafc;
    }
    .gate-container {
      background-color: #1e293b;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 400px;
      border: 1px solid #334155;
    }
    h1 {
      margin-top: 0;
      font-size: 1.5rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 1.5rem;
      color: #e2e8f0;
    }
    .error {
      background-color: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      text-align: center;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .input-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #94a3b8;
    }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      color: #f8fafc;
      font-size: 1rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s ease-in-out;
    }
    input:focus {
      border-color: #3b82f6;
    }
    button {
      width: 100%;
      padding: 0.875rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
    }
    button:hover {
      background-color: #2563eb;
    }
    button:active {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="gate-container">
    <h1>Access Restricted</h1>
    ${error ? `<div class="error">${errorMessage}</div>` : ''}
    <form method="POST" action="/gate">
      <div class="input-group">
        <label for="password">Enter Site Password</label>
        <input type="password" id="password" name="password" required autofocus />
      </div>
      <button type="submit">Enter Site</button>
    </form>
  </div>
</body>
</html>
`;

    return new Response(html, {
      status: error ? 401 : 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Not /gate and no cookie, so redirect to /gate
  return Response.redirect(new URL('/gate', request.url), 302);
}
