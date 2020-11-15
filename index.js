const execSync = require("child_process").execSync;
const fs = require('fs');

function run(command) {
  console.log(command);
  execSync(command, {stdio: 'inherit'});
}

function addToPath(newPath) {
  fs.appendFileSync(process.env.GITHUB_PATH, `${newPath}\n`);
}

const mariadbVersion = parseFloat(process.env['INPUT_MARIADB-VERSION'] || '10.5').toFixed(1);

if (!['10.5', '10.4', '10.3', '10.2', '10.1'].includes(mariadbVersion)) {
  throw 'Invalid MariaDB version: ' + mariadbVersion;
}

if (process.platform == 'darwin') {
  // install
  run(`brew install mariadb@${mariadbVersion}`);

  // start
  const bin = `/usr/local/opt/mariadb@${mariadbVersion}/bin`;
  run(`${bin}/mysql.server start`);

  addToPath(bin);

  // add permissions
  if (mariadbVersion == '10.3' || mariadbVersion == '10.2') {
    run(`${bin}/mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO ''@'localhost'"`);
    run(`${bin}/mysql -u root -e "FLUSH PRIVILEGES"`);
  }
} else if (process.platform == 'win32') {
  // install
  const versionMap = {
    '10.5': '10.5.8',
    '10.4': '10.4.17',
    '10.3': '10.3.27',
    '10.2': '10.2.36',
    '10.1': '10.1.48'
  };
  const fullVersion = versionMap[mariadbVersion];
  run(`curl -Ls -o mariadb.msi https://downloads.mariadb.com/MariaDB/mariadb-${fullVersion}/winx64-packages/mariadb-${fullVersion}-winx64.msi`);
  run(`msiexec /i mariadb.msi SERVICENAME=MariaDB /qn`);

  addToPath(`C:\\Program Files\\MariaDB ${mariadbVersion}\\bin`);

  // add user
  run(`mysql -u root -e "CREATE USER 'runneradmin'@'localhost' IDENTIFIED BY ''"`);
  run(`mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'runneradmin'@'localhost'"`);
  run(`mysql -u root -e "FLUSH PRIVILEGES"`);
} else {
  // install
  run(`sudo apt-key adv --recv-keys --keyserver hkp://keyserver.ubuntu.com:80 0xF1656F24C74CD1D8`);
  run(`echo "deb http://downloads.mariadb.com/MariaDB/mariadb-${mariadbVersion}/repo/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) main" | sudo tee /etc/apt/sources.list.d/mariadb.list`);
  run(`sudo apt-get update`);
  run(`sudo apt-get install mariadb-server-${mariadbVersion}`);

  // start
  run(`sudo systemctl start mariadb`);

  // remove root password
  run(`sudo mysqladmin -proot password ''`);

  // add user
  run(`sudo mysql -e "CREATE USER '$USER'@'localhost' IDENTIFIED BY ''"`);
  run(`sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO '$USER'@'localhost'"`);
  run(`sudo mysql -e "FLUSH PRIVILEGES"`);
}
