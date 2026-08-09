import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const base = 'C:\\Users\\User\\Documents\\MY APP\\hostbooks-ke\\src\\app\\api\\pos';

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.name === 'route.ts') files.push(full);
  }
  return files;
}

const routes = walk(base).filter(
  (f) => !f.includes('verify-pin') && !f.includes('setup-device')
);

const SESSION_BLOCK = new RegExp(
  "    const supabase = await createClient\\(\\);\n" +
  "    const \\{ data: \\{ session \\} \\} = await supabase\\.auth\\.getSession\\(\\);\n" +
  "    if \\(!session\\?\\.user\\) return NextResponse\\.json\\(\\{ error: 'Unauthorized' \\}, \\{ status: 401 \\}\\);",
  'g'
);

const NEW_BLOCK =
  "    const posAuth = await getPosAuth(request);\n" +
  "    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n" +
  "    const { host_user_id, supabase } = posAuth;";

const GET_AUTH_IMPORT = `import { getPosAuth } from '@/lib/pos/device-auth';`;

for (const f of routes) {
  let c = readFileSync(f, 'utf8');

  // Normalise CRLF -> LF so regex works uniformly
  c = c.replace(/\r\n/g, '\n');

  // 1. Remove createClient import line
  c = c.replace(/import \{ createClient \} from '@\/lib\/supabase\/server';\n/, '');

  // 2. Add getPosAuth import after next/server import (avoid duplicate)
  if (!c.includes(GET_AUTH_IMPORT)) {
    c = c.replace(
      /(import \{ Next(?:Request|Response)[^}]*\} from 'next\/server';)/,
      `$1\n${GET_AUTH_IMPORT}`
    );
  }

  // 3. Normalise `req` param name -> `request`
  c = c.replace(/\breq: NextRequest\b/g, 'request: NextRequest');
  c = c.replace(/\b_req: NextRequest\b/g, '_request: NextRequest');
  c = c.replace(/\breq\.json\(\)/g, 'request.json()');
  c = c.replace(/\breq\.url\b/g, 'request.url');
  c = c.replace(/\breq\.cookies\b/g, 'request.cookies');
  c = c.replace(/\breq\.headers\b/g, 'request.headers');

  // 4. Add `request: NextRequest` to bare function signatures that need it
  c = c.replace(/export async function GET\(\)/g, 'export async function GET(request: NextRequest)');
  c = c.replace(/export async function DELETE\(\)/g, 'export async function DELETE(request: NextRequest)');
  c = c.replace(/export async function PUT\(\)/g, 'export async function PUT(request: NextRequest)');

  // 5. Replace the 3-line session check block
  c = c.replace(SESSION_BLOCK, NEW_BLOCK);

  // 6. Replace session.user.id -> host_user_id
  c = c.replace(/session\.user\.id/g, 'host_user_id');

  writeFileSync(f, c, 'utf8');
  console.log('Updated:', relative(base, f));
}

console.log(`\nDone — ${routes.length} files processed.`);
