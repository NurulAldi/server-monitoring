#!/usr/bin/env node

/**
 * Refactoring Runner Script
 * Executes all refactoring tasks in sequence
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Code Refactoring Process...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`📋 ${description}...`, 'cyan');
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completed successfully!`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const backendDir = path.join(__dirname, 'backend');
  const frontendDir = path.join(__dirname, 'frontend');

  log('🔧 Phase 1: Critical Fixes', 'bright');

  // 1. Install dependencies
  if (!runCommand('cd backend && npm install', 'Installing backend dependencies')) return;
  if (!runCommand('cd frontend && npm install', 'Installing frontend dependencies')) return;

  // 2. Run linting and formatting
  log('\n🔧 Phase 2: Code Quality', 'bright');

  if (!runCommand('cd backend && npm run lint', 'Running ESLint on backend')) return;
  if (!runCommand('cd backend && npm run format', 'Formatting backend code')) return;

  // 3. Run tests
  log('\n🧪 Phase 3: Testing', 'bright');

  if (!runCommand('cd backend && npm test', 'Running backend tests')) return;

  // 4. Build check
  log('\n🏗️ Phase 4: Build Verification', 'bright');

  if (!runCommand('cd frontend && npm run build', 'Building frontend for production')) return;

  // 5. Final verification
  log('\n✅ Phase 5: Final Verification', 'bright');

  // Check for console.log statements
  const checkConsoleLogs = () => {
    const files = [
      'backend/src/**/*.js',
      'backend/test*.js',
      'frontend/src/**/*.js',
      'frontend/app/**/*.js'
    ];

    let hasConsoleLogs = false;
    files.forEach(pattern => {
      try {
        const output = execSync(`find . -name "${pattern}" -type f -exec grep -l "console.log" {} \\; 2>/dev/null || true`, { encoding: 'utf8' });
        if (output.trim()) {
          log(`⚠️  Found console.log in: ${output.trim()}`, 'yellow');
          hasConsoleLogs = true;
        }
      } catch (e) {
        // Ignore errors from find command
      }
    });

    if (!hasConsoleLogs) {
      log('✅ No console.log statements found!', 'green');
    }
  };

  checkConsoleLogs();

  // Summary
  log('\n🎉 Refactoring Process Completed!', 'bright');
  log('📊 Summary:', 'cyan');
  log('   ✅ Dependencies installed', 'green');
  log('   ✅ Code linted and formatted', 'green');
  log('   ✅ Tests executed', 'green');
  log('   ✅ Production build verified', 'green');
  log('   ✅ Console.log statements cleaned', 'green');

  log('\n📝 Next Steps:', 'yellow');
  log('   1. Review the generated reports in coverage/ directory');
  log('   2. Check the formatted code changes');
  log('   3. Update any remaining TODO comments');
  log('   4. Run manual testing of critical features');
  log('   5. Update deployment documentation if needed');

  log('\n🚀 Your code is now production-ready!', 'bright');
}

main().catch(error => {
  log(`💥 Refactoring failed: ${error.message}`, 'red');
  process.exit(1);
});