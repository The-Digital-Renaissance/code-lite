import http, { RequestListener } from 'http';
import Cookies from 'cookies';

const getID = () =>
  `0x${[...Array(40)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')}`;

async function getResult(
  url: string,
  cookies: Cookies,
  body?: { email?: string; password?: string }
): Promise<Object> {
  const user = cookies.get('user', { signed: true });

  if (url.indexOf('/authenticate') === 0) {
    if (!body?.email || !body?.password) return null;

    const user = getID();

    cookies.set(`user`, user, {
      signed: true,
      expires: new Date(2050, 1, 1),
    });

    return { user };
  }

  if (url.indexOf('/tasks') === 0) {
    return [
      { description: 'Authenticate', done: false },
      { description: 'Display Authenticated User ID', done: false },
    ];
  }

  if (!user) return null;

  return null;
}

const httpHandler: RequestListener = async function httpHandler(
  request,
  response
) {
  let chunks = '';

  request.on('data', (chunk: Buffer | string) => {
    chunks += chunk;
  });

  request.on('end', async () => {
    const cookies = new Cookies(request, response, {
      keys: ['very', 'secure', 'cookies'],
    });

    let body: Object = null;

    try {
      body = chunks.length ? JSON.parse(chunks) : null;

      const { headers, method, url } = request;

      response.setHeader('Content-Type', 'application/json');

      if (headers.origin) {
        response.setHeader('Access-Control-Allow-Credentials', 'true');

        response.setHeader('Access-Control-Allow-Origin', headers.origin);

        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        response.setHeader(
          'Access-Control-Allow-Methods',
          'POST, GET, OPTIONS'
        );
      }

      const result =
        method === 'OPTIONS'
          ? { ok: 1 }
          : await getResult(url || '', cookies, body);

      response.writeHead(result ? 200 : 401);

      response.end(JSON.stringify(result));
    } catch (error) {
      console.log(error);

      response.writeHead(500);

      response.end();
    }
  });
};

http.createServer(httpHandler).listen(8080);

console.log('Server running on http://localhost:8080');