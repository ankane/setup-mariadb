const execSync = require("child_process").execSync;

function run(command) {
  console.log(command);
  execSync(command, {stdio: 'inherit'});
}

const mariadbVersion = parseFloat(process.env['INPUT_MARIADB-VERSION'] || 10.5);

if (![8].includes(mariadbVersion)) {
  throw 'Invalid MariaDB version: ' + mariadbVersion;
}

if (process.platform == 'darwin') {
  run('brew install mariadb');
  run('mysql.server start');
} else {
  run('sudo systemctl start mariadb');
  run(`sudo mysqladmin -proot password ''`);
  run(`sudo mysql -e "CREATE USER '$USER'@'localhost' IDENTIFIED BY ''"`);
  run(`sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO '$USER'@'localhost'"`);
  run(`sudo mysql -e "FLUSH PRIVILEGES"`);
}
