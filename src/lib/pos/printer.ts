import * as net from 'net';

export interface PrintResult {
  ok: boolean;
  error?: string;
}

/**
 * Send raw bytes to a thermal printer via TCP (ESC/POS port 9100).
 * Never throws — errors are returned in the result object so the
 * order flow is never blocked by a printer being offline.
 */
export function sendToPrinter(
  ip: string,
  port: number,
  data: Buffer,
  timeoutMs = 5000,
): Promise<PrintResult> {
  return new Promise((resolve) => {
    if (!ip || ip.trim() === '') {
      resolve({ ok: false, error: 'Printer IP not configured' });
      return;
    }

    const socket = new net.Socket();
    let settled = false;

    const finish = (result: PrintResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.connect(port, ip.trim(), () => {
      socket.write(data, (err) => {
        if (err) {
          finish({ ok: false, error: err.message });
        } else {
          finish({ ok: true });
        }
      });
    });

    socket.on('error', (err) => finish({ ok: false, error: err.message }));
    socket.on('timeout', () => finish({ ok: false, error: 'Printer connection timed out' }));
  });
}
