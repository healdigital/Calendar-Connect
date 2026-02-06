import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('EE Removal - Build Success Properties', () => {
  it('Property 6: Build Process Succeeds', { timeout: 1800000 }, async () => {
    // Feature: ee-removal, Property 6: Build Process Succeeds
    // Validates: Requirements 1.5, 3.5, 7.1, 7.2, 7.3
    
    const commands = [
      { cmd: 'yarn type-check:ci --force', name: 'type-check:ci' },
      { cmd: 'yarn workspace @calcom/api-v2 build', name: 'api-v2 build' },
      { cmd: 'yarn workspace @calcom/web type-check', name: 'web type-check' }
    ];
    
    for (const { cmd, name } of commands) {
      try {
        execSync(cmd, { 
          stdio: 'pipe',
          encoding: 'utf-8',
          timeout: 600000 // 10 minute timeout
        });
      } catch (error: any) {
        const stderr = error.stderr?.toString() || '';
        const stdout = error.stdout?.toString() || '';
        throw new Error(
          `Build command "${name}" failed:\n` +
          `Exit code: ${error.status}\n` +
          `Stdout: ${stdout.slice(0, 1000)}\n` +
          `Stderr: ${stderr.slice(0, 1000)}`
        );
      }
    }
  });
});
