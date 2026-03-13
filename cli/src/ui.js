import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { createInterface } from 'readline';
import { t } from './i18n.js';

// Global flag for --no-color
let colorsEnabled = true;
export function setColors(enabled) { colorsEnabled = enabled; }

function c(fn, text) {
  return colorsEnabled ? fn(text) : text;
}

/**
 * Show the app banner with system info.
 * @param {object} systemInfo - { os, cpu, ram, disk }
 */
export function banner(systemInfo = {}) {
  const ascii = [
    '  ____   ____      ____       _              ',
    ' |  _ \\ / ___|    |  _ \\  ___| |_ _____  __  ',
    ' | |_) | |   _____| | | |/ _ \\ __/ _ \\ \\/ /  ',
    ' |  __/| |__|_____| |_| |  __/ || (_) >  <   ',
    ' |_|    \\____|    |____/ \\___|\\__\\___/_/\\_\\   ',
  ];

  process.stdout.write('\n');
  const gradient = [chalk.cyan, chalk.cyanBright, chalk.blueBright, chalk.blue, chalk.magentaBright];
  for (let i = 0; i < ascii.length; i++) {
    process.stdout.write(c(gradient[i].bold, ascii[i]) + '\n');
  }
  process.stdout.write('\n');
  process.stdout.write(c(chalk.dim, '  \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501') + '\n');
  process.stdout.write(c(chalk.whiteBright.bold, '  \u{1F9F9} Detox your PC. Instant speed boost.') + '\n');
  process.stdout.write(c(chalk.dim, '  \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501') + '\n');

  if (systemInfo.os) {
    process.stdout.write('\n');
    process.stdout.write(`  \u{1F4BB} ${c(chalk.white, systemInfo.os)}`);
    if (systemInfo.cpu) process.stdout.write(c(chalk.dim, ' \u2502 ') + c(chalk.cyan, '\u{1F4A1} ' + systemInfo.cpu));
    if (systemInfo.ram) process.stdout.write(c(chalk.dim, ' \u2502 ') + c(chalk.green, '\u{1F9E0} ' + systemInfo.ram + ' RAM'));
    if (systemInfo.disk) process.stdout.write(c(chalk.dim, ' \u2502 ') + c(chalk.yellow, '\u{1F4BE} ' + systemInfo.disk));
    process.stdout.write('\n');
  }
}

/**
 * Show a numbered menu and get user selection via readline.
 * @param {Array<{key: string, label: string, desc: string, icon?: string}>} choices
 * @returns {Promise<string>} - The selected key
 */
export async function menu(choices) {
  process.stdout.write('\n');
  const menuColors = [chalk.cyanBright, chalk.greenBright, chalk.magentaBright, chalk.yellowBright, chalk.dim];
  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i];
    const icon = choice.icon || '';
    const color = menuColors[i] || chalk.white;
    const num = c(color.bold, choice.key.padStart(2));
    const label = c(chalk.white.bold, choice.label);
    const desc = choice.desc ? c(chalk.gray, ` — ${choice.desc}`) : '';
    process.stdout.write(`  ${num}. ${icon} ${label}${desc}\n`);
  }
  process.stdout.write('\n');

  const safeMode = c(chalk.bgGreen.black, ' SAFE MODE ON ');
  process.stdout.write(`  ${safeMode} ${c(chalk.gray, 'Every action requires your confirmation')}\n\n`);

  const answer = await prompt(t('promptChoice'));
  return answer.trim();
}

/**
 * Prompt user for input via readline.
 * @param {string} question
 * @returns {Promise<string>}
 */
export function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`  ${c(chalk.cyan, '>')} ${question} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Show a confirmation prompt.
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export async function confirm(message) {
  const answer = await prompt(`${message} [y/N]`);
  return answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes';
}

/**
 * Success message.
 */
export function success(msg) {
  process.stdout.write(`  ${c(chalk.green, '✓')} ${msg}\n`);
}

/**
 * Warning message.
 */
export function warn(msg) {
  process.stdout.write(`  ${c(chalk.yellow, '⚠')} ${msg}\n`);
}

/**
 * Error message.
 */
export function error(msg) {
  process.stdout.write(`  ${c(chalk.red, '✗')} ${msg}\n`);
}

/**
 * Info message.
 */
export function info(msg) {
  process.stdout.write(`  ${c(chalk.blue, 'ℹ')} ${msg}\n`);
}

/**
 * Section header.
 */
export function heading(msg) {
  process.stdout.write(`\n  ${c(chalk.bold.underline.cyan, msg)}\n\n`);
}

/**
 * Create and return a spinner.
 * @param {string} label
 * @returns {ora.Ora}
 */
export function progress(label) {
  return ora({
    text: label,
    indent: 2,
    color: 'cyan',
  });
}

/**
 * Render a simple table.
 * @param {string[]} headers
 * @param {string[][]} rows
 */
export function table(headers, rows) {
  const tbl = new Table({
    head: headers.map(h => c(chalk.cyan.bold, h)),
    style: { 'padding-left': 1, 'padding-right': 1, head: [], border: [] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│',
    },
  });

  for (const row of rows) {
    tbl.push(row);
  }

  process.stdout.write('  ' + tbl.toString().split('\n').join('\n  ') + '\n');
}

/**
 * Color-coded risk level label.
 * @param {'safe'|'low'|'high'|'critical'} level
 * @returns {string}
 */
export function riskLevel(level) {
  switch (level) {
    case 'safe':
      return c(chalk.bgGreen.black, ' SAFE ');
    case 'low':
      return c(chalk.bgYellow.black, ' LOW RISK ');
    case 'high':
      return c(chalk.bgRed.white, ' HIGH RISK ');
    case 'critical':
      return c(chalk.bgRed.white.bold, ' ⚠ CRITICAL ');
    default:
      return c(chalk.bgGray.white, ` ${level.toUpperCase()} `);
  }
}

/**
 * Format bytes to human readable.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Print a blank line.
 */
export function newline() {
  process.stdout.write('\n');
}

/**
 * Press any key to continue.
 */
export async function pressAnyKey() {
  await prompt(c(chalk.dim, 'Press Enter to continue...'));
}
