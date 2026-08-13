import spawn from 'cross-spawn';

function terminateDirectChild(child, signal) {
  try {
    child.kill(signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
}

export function terminateProcessTree(
  child,
  signal,
  platform = process.platform,
  spawnProcess = spawn
) {
  const pid = child.pid;
  if (!Number.isInteger(pid) || pid <= 0) {
    terminateDirectChild(child, signal);
    return Promise.resolve();
  }
  if (platform !== 'win32') {
    try {
      process.kill(-pid, signal);
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error;
      terminateDirectChild(child, signal);
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const killer = spawnProcess('taskkill', ['/pid', String(pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true
    });
    let settled = false;
    const finish = (fallback) => {
      if (settled) return;
      settled = true;
      if (fallback) terminateDirectChild(child, signal);
      resolve(undefined);
    };
    killer.once('error', () => finish(true));
    killer.once('close', (code) => finish(code !== 0));
  });
}
