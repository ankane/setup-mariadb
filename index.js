const execSync = require("child_process").execSync;
const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const spawnSync = require('child_process').spawnSync;

function run(command) {
  console.log(command);
  let env = Object.assign({}, process.env);
  delete env.CI; // for Homebrew
  execSync(command, {stdio: 'inherit', env: env});
}

function runSafe() {
  const args = Array.from(arguments);
  console.log(args.join(' '));
  const command = args.shift();
  // spawn is safer and more lightweight than exec
  const ret = spawnSync(command, args, {stdio: 'inherit'});
  if (ret.status !== 0) {
    throw ret.error;
  }
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
  const tap = `/usr/local/Homebrew/Library/Taps/homebrew/homebrew-core`;
  return fs.existsSync(`${tap}/Formula/${formula}.rb`) || fs.existsSync(`${tap}/Aliases/${formula}`);
}

const defaultVersion = '10.10';
const mariadbVersion = process.env['INPUT_MARIADB-VERSION'] || defaultVersion;

if (!['10.10', '10.9', '10.8', '10.7', '10.6', '10.5', '10.4', '10.3'].includes(mariadbVersion)) {
  throw 'Invalid MariaDB version: ' + mariadbVersion;
}

const database = process.env['INPUT_DATABASE'];
const rootPassword = process.env['INPUT_ROOT-USER-PASSWORD'] || '';

let bin;

if (isMac()) {
  const formula = `mariadb@${mariadbVersion}`;
  if (!formulaPresent(formula)) {
    run('brew update');
  }

  // install
  run(`brew install ${formula}`);

  // start
  bin = `/usr/local/opt/${formula}/bin`;
  run(`${bin}/mysql.server start`);

  addToPath(bin);

  // add permissions
  if (mariadbVersion == '10.3') {
    run(`${bin}/mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO ''@'localhost'"`);
    run(`${bin}/mysql -u root -e "FLUSH PRIVILEGES"`);
  }

} else if (isWindows()) {
  // install
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mariadb-'));
  process.chdir(tmpDir);
  const versionMap = {
    '10.10': '10.10.2',
    '10.9': '10.9.4',
    '10.8': '10.8.6',
    '10.7': '10.7.7',
    '10.6': '10.6.11',
    '10.5': '10.5.18',
    '10.4': '10.4.27',
    '10.3': '10.3.37'
  };
  const fullVersion = versionMap[mariadbVersion];
  run(`curl -Ls -o mariadb.msi https://downloads.mariadb.com/MariaDB/mariadb-${fullVersion}/winx64-packages/mariadb-${fullVersion}-winx64.msi`);
  run(`msiexec /i mariadb.msi SERVICENAME=MariaDB /qn`);

  bin = `C:\\Program Files\\MariaDB ${mariadbVersion}\\bin`;
  addToPath(bin);

  // add user
  run(`"${bin}\\mysql" -u root -e "CREATE USER 'runneradmin'@'localhost' IDENTIFIED BY ''"`);
  run(`"${bin}\\mysql" -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'runneradmin'@'localhost'"`);
  run(`"${bin}\\mysql" -u root -e "FLUSH PRIVILEGES"`);

} else {
  const image = process.env['ImageOS'];
  if (image == 'ubuntu20' || image == 'ubuntu22') {
    // clear previous data
    run(`sudo systemctl stop mysql.service`);
    run(`sudo rm -rf /var/lib/mysql`);
  }

  // install
  run(`sudo apt-key adv --recv-keys --keyserver hkp://keyserver.ubuntu.com:80 0xF1656F24C74CD1D8`);
  run(`echo "deb https://downloads.mariadb.com/MariaDB/mariadb-${mariadbVersion}/repo/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) main" | sudo tee /etc/apt/sources.list.d/mariadb.list`);
  run(`sudo apt-get update -o Dir::Etc::sourcelist="sources.list.d/mariadb.list" -o Dir::Etc::sourceparts="-" -o APT::Get::List-Cleanup="0"`);
  run(`sudo apt-get install mariadb-server-${mariadbVersion}`);

  // start
  run(`sudo systemctl start mariadb`);

  // remove root password
  run(`sudo mysqladmin -proot password ''`);

  // add user
  run(`sudo mysql -e "CREATE USER '$USER'@'localhost' IDENTIFIED BY ''"`);
  run(`sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO '$USER'@'localhost'"`);
  run(`sudo mysql -e "FLUSH PRIVILEGES"`);


  bin = `/usr/bin`;
}

if (database) {
  runSafe(path.join(bin, 'mysqladmin'), 'create', database);
}

// set root password if specified
if (rootPassword) {
  runSafe(path.join(bin, 'mysqladmin'), '-uroot', 'password', rootPassword);
}
