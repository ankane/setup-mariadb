const execSync = require("child_process").execSync;

function run(command) {
  console.log(command);
  execSync(command, {stdio: 'inherit'});
}

const mariadbVersion = parseFloat(process.env['INPUT_MARIADB-VERSION'] || 10.5);

if (![10.5, 10.4, 10.3, 10.2, 10.1].includes(mariadbVersion)) {
  throw 'Invalid MariaDB version: ' + mariadbVersion;
}

if (process.platform == 'darwin') {
  // install
  run(`brew install mariadb@${mariadbVersion}`);

  // start
  const bin = `/usr/local/opt/mariadb@${mariadbVersion}/bin`;
  run(`${bin}/mysql.server start`);

  // set path
  run(`echo "${bin}" >> $GITHUB_PATH`);
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
