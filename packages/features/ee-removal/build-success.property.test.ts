import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('EE Removal - Build Success Properties', () => {
  it('Property 6: Build Process Succeeds', { timeout: 1800000 }, async () => {
    // Feature: ee-removal, Property 6: Build Process Succeeds
    // Validates: Requirements 1.5, 3.5, 7.1, 7.2, 7.3
    
    const commands = [
      // Covers web + api-v2 + shared packages through the monorepo pipeline.
      { cmd: 'yarn type-check:ci --force', name: 'type-check:ci' }
    ];
    
    for (const { cmd, name } of commands) {
      try {
        execSync(cmd, { 
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 600000 // 10 minute timeout
        });
      } catch (error: unknown) {
        const execError = error as {
          status?: number;
          stderr?: string | Buffer;
          stdout?: string | Buffer;
        };
        const stderr = execError.stderr?.toString() || '';
        const stdout = execError.stdout?.toString() || '';
        throw new Error(
          `Build command "${name}" failed:\n` +
          `Exit code: ${execError.status}\n` +
          `Stdout: ${stdout.slice(0, 1000)}\n` +
          `Stderr: ${stderr.slice(0, 1000)}`
        );
      }
    }
  });
});
