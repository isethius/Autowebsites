import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

export interface ServerOptions {
  port?: number;
  host?: string;
  directory: string;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

export function createServer(options: ServerOptions): http.Server {
  const { port = 3000, host = 'localhost', directory } = options;

  const server = http.createServer((req, res) => {
    const url = req.url || '/';
    let filePath = path.join(directory, url === '/' ? 'index.html' : url);

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.resolve(directory))) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    // Check if file exists
    fs.stat(normalizedPath, (err, stats) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>404 Not Found</title></head>
            <body style="font-family: system-ui; text-align: center; padding: 60px;">
              <h1>404 Not Found</h1>
              <p>The requested file was not found.</p>
              <p><a href="/">Back to Gallery</a></p>
            </body>
          </html>
        `);
        return;
      }

      // If it's a directory, serve index.html
      if (stats.isDirectory()) {
        filePath = path.join(normalizedPath, 'index.html');
      }

      // Read and serve the file
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      });
    });
  });

  return server;
}

export function startServer(options: ServerOptions): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve, reject) => {
    const { port = 3000, host = 'localhost', directory } = options;

    // Verify directory exists
    if (!fs.existsSync(directory)) {
      reject(new Error(`Directory not found: ${directory}`));
      return;
    }

    const server = createServer(options);

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });

    server.listen(port, host, () => {
      const url = `http://${host}:${port}`;
      console.log(`\n🚀 Preview server running at ${url}`);
      console.log(`   Serving: ${directory}`);
      console.log(`   Press Ctrl+C to stop\n`);
      resolve({ server, url });
    });
  });
}

export function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('Server stopped');
      resolve();
    });
  });
}

// CLI entry point
if (require.main === module) {
  const directory = process.argv[2] || 'tmp/autowebsites/themes';
  const port = parseInt(process.argv[3] || '3000', 10);

  startServer({ directory, port })
    .then(({ url }) => {
      console.log(`Open ${url} in your browser to view the gallery`);
    })
    .catch(err => {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    });
}
