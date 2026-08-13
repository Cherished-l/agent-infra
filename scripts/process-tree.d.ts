import type { ChildProcess } from 'node:child_process';

type SpawnProcess = (
  command: string,
  args: string[],
  options: { stdio: 'ignore'; windowsHide: true }
) => ChildProcess;

export function terminateProcessTree(
  child: ChildProcess,
  signal: NodeJS.Signals,
  platform?: NodeJS.Platform,
  spawnProcess?: SpawnProcess
): Promise<void>;
