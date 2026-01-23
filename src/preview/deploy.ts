import { execSync, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface DeployOptions {
  directory: string;
  projectName?: string;
  prod?: boolean;
}

export interface DeployResult {
  url: string;
  projectName: string;
  deployedAt: string;
  success: boolean;
  error?: string;
}

export async function deployToVercel(options: DeployOptions): Promise<DeployResult> {
  const { directory, projectName, prod = false } = options;

  // Verify directory exists
  if (!fs.existsSync(directory)) {
    return {
      url: '',
      projectName: projectName || 'unknown',
      deployedAt: new Date().toISOString(),
      success: false,
      error: `Directory not found: ${directory}`
    };
  }

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch {
    return {
      url: '',
      projectName: projectName || 'unknown',
      deployedAt: new Date().toISOString(),
      success: false,
      error: 'Vercel CLI not installed. Run: npm i -g vercel'
    };
  }

  // Create vercel.json if it doesn't exist
  const vercelConfigPath = path.join(directory, 'vercel.json');
  if (!fs.existsSync(vercelConfigPath)) {
    const vercelConfig = {
      version: 2,
      builds: [
        { src: '**/*.html', use: '@vercel/static' }
      ],
      routes: [
        { src: '/(.*)', dest: '/$1' }
      ]
    };
    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
  }

  try {
    // Build the vercel command
    const args = ['--yes']; // Auto-confirm
    if (projectName) {
      args.push('--name', projectName);
    }
    if (prod) {
      args.push('--prod');
    }

    console.log(`\n🚀 Deploying to Vercel...`);
    console.log(`   Directory: ${directory}`);
    console.log(`   Production: ${prod ? 'Yes' : 'No (preview)'}`);

    // Execute vercel deploy
    const result = execSync(`vercel ${args.join(' ')}`, {
      cwd: directory,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Extract URL from output
    const urlMatch = result.match(/https:\/\/[^\s]+\.vercel\.app/);
    const url = urlMatch ? urlMatch[0] : result.trim().split('\n').pop() || '';

    console.log(`\n✓ Deployed successfully!`);
    console.log(`  URL: ${url}\n`);

    return {
      url,
      projectName: projectName || 'autowebsites',
      deployedAt: new Date().toISOString(),
      success: true
    };
  } catch (err: any) {
    const errorMessage = err.stderr?.toString() || err.message || 'Unknown error';
    console.error(`\n✗ Deployment failed: ${errorMessage}\n`);

    return {
      url: '',
      projectName: projectName || 'unknown',
      deployedAt: new Date().toISOString(),
      success: false,
      error: errorMessage
    };
  }
}

export async function getDeploymentStatus(projectName: string): Promise<any> {
  try {
    const result = execSync(`vercel ls ${projectName} --json`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(result);
  } catch (err: any) {
    return { error: err.message };
  }
}

export function generateDeployScript(directory: string): string {
  return `#!/bin/bash
# Auto-generated deploy script for AutoWebsites

cd "${directory}"

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --yes

echo "Done!"
`;
}

// CLI entry point
if (require.main === module) {
  const directory = process.argv[2] || 'tmp/autowebsites/themes';
  const prod = process.argv.includes('--prod');
  const projectName = process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1];

  deployToVercel({ directory, projectName, prod })
    .then(result => {
      if (result.success) {
        console.log('Deployment result:', JSON.stringify(result, null, 2));
      } else {
        console.error('Deployment failed:', result.error);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}
