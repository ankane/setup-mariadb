const execSync = require("child_process").execSync;
const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const spawnSync = require('child_process').spawnSync;

function run() {
  const args = Array.from(arguments);
  console.log(args.map(v => v.toString().includes(' ') ? `"${v}"` : v).join(' '));
  const command = args.shift();
  let env = Object.assign({}, process.env);
  env.HOMEBREW_NO_AUTO_UPDATE = '1';
  env.HOMEBREW_NO_INSTALL_CLEANUP = '1';
  // spawn is safer and more lightweight than exec
  const ret = spawnSync(command, args, {stdio: 'inherit', env: env});
  if (ret.status !== 0) {
    throw ret.error;
  }
}

function runUnsafe(command) {
  console.log(command);
  execSync(command, {stdio: 'inherit'});
}

function addToPath(newPath) {
  fs.appendFileSync(process.env.GITHUB_PATH, `${newPath}\n`);
}

function isMac() {
  return process.platform == 'darwin';
}

function isWindows() {
  return process.platform == 'win32';
}

function formulaPresent(formula) {
  const tapPrefix = process.arch == 'arm64' ? '/opt/homebrew' : '/usr/local/Homebrew';
  const tap = `${tapPrefix}/Library/Taps/homebrew/homebrew-core`;
  return fs.existsSync(`${tap}/Formula/${formula[0]}/${formula}.rb`) || fs.existsSync(`${tap}/Aliases/${formula}`);
}

const defaultVersion = '11.8';
const mariadbVersion = process.env['INPUT_MARIADB-VERSION'] || defaultVersion;

// only LTS releases
if (!['11.8', '11.4', '10.11', '10.6', '10.5'].includes(mariadbVersion)) {
  throw 'Invalid MariaDB version: ' + mariadbVersion;
}

const database = process.env['INPUT_DATABASE'];
const user = isWindows() ? 'runneradmin' : (isMac() ? null : process.env['USER']);

const prog = parseFloat(mariadbVersion) >= 11 ? 'mariadb' : 'mysql';
const adminProg = parseFloat(mariadbVersion) >= 11 ? 'mariadb-admin' : 'mysqladmin';

let bin;

if (isMac()) {
  const formula = `mariadb@${mariadbVersion}`;
  if (!formulaPresent(formula)) {
    run(`brew`, `update`);
  }

  // install
  run(`brew`, `install`, formula);

  // start
  const prefix = process.arch == 'arm64' ? '/opt/homebrew' : '/usr/local';
  bin = `${prefix}/opt/${formula}/bin`;
  run(`${bin}/mysql.server`, `start`);

  addToPath(bin);

  cmdPrefix = [`${bin}/${prog}`];
} else if (isWindows()) {
  // install
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mariadb-'));
  process.chdir(tmpDir);
  const versionMap = {
    '11.8': '11.8.2',
    '11.4': '11.4.7',
    '10.11': '10.11.13',
    '10.6': '10.6.22',
    '10.5': '10.5.29'
  };
  const fullVersion = versionMap[mariadbVersion];
  run(`curl`, `-Ls`, `-o`, `mariadb.msi`, `https://dlm.mariadb.com/MariaDB/mariadb-${fullVersion}/winx64-packages/mariadb-${fullVersion}-winx64.msi`);
  run(`msiexec`, `/i`, `mariadb.msi`, `SERVICENAME=MariaDB`, `/qn`);

  bin = `C:\\Program Files\\MariaDB ${mariadbVersion}\\bin`;
  addToPath(bin);

  cmdPrefix = [`${bin}\\${prog}`, `-u`, `root`];
} else {
  if (process.arch != 'arm64') {
    // clear previous data
    run(`sudo`, `systemctl`, `stop`, `mysql.service`);
    run(`sudo`, `rm`, `-rf`, `/var/lib/mysql`);
  }

  // install
  run(`sudo`, `apt-key`, `adv`, `--recv-keys`, `--keyserver`, `hkp://keyserver.ubuntu.com:80`, `0xF1656F24C74CD1D8`);
  runUnsafe(`echo "deb [arch=amd64,arm64] https://dlm.mariadb.com/repo/mariadb-server/${mariadbVersion}/repo/ubuntu $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/mariadb.list`);
  run(`sudo`, `apt-get`, `update`, `-o`, `Dir::Etc::sourcelist=sources.list.d/mariadb.list`, `-o`, `Dir::Etc::sourceparts=-`, `-o`, `APT::Get::List-Cleanup=0`);
  run(`sudo`, `apt-get`, `install`, `mariadb-server`);

  // start
  run(`sudo`, `systemctl`, `start`, `mariadb`);

  // remove root password
  run(`sudo`, adminProg, `-proot`, `password`, ``);

  bin = `/usr/bin`;
  cmdPrefix = [`sudo`, prog];
}

if (user) {
  if (user != 'runner' && user != 'runneradmin') {
    // TODO fix
    throw `Unsupported user: ${user}`;
  }
  run(...cmdPrefix, `-e`, `CREATE USER '${user}'@'localhost' IDENTIFIED BY ''`);
  run(...cmdPrefix, `-e`, `GRANT ALL PRIVILEGES ON *.* TO '${user}'@'localhost'`);
  run(...cmdPrefix, `-e`, `FLUSH PRIVILEGES`);
}

if (database) {
  run(path.join(bin, adminProg), 'create', database);
}
