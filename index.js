const fs = require("fs");
const os = require("os");
const path = require("path");
const process = require("process");
const https = require("https");
const execSync = require("child_process").execSync;
const spawnSync = require("child_process").spawnSync;

function run(command) {
  console.log(command);
  let env = Object.assign({}, process.env);
  delete env.CI; // for Homebrew
  env.HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK = "1";
  execSync(command, { stdio: "inherit", env: env });
}

function runSafe() {
  const args = Array.from(arguments);
  console.log(args.join(" "));
  const command = args.shift();
  // spawn is safer and more lightweight than exec
  const ret = spawnSync(command, args, { stdio: "inherit" });
  if (ret.status !== 0) {
    throw ret.error;
  }
}

function addToPath(newPath) {
  fs.appendFileSync(process.env.GITHUB_PATH, `${newPath}\n`);
}

function isMac() {
  return process.platform == "darwin";
}

function isWindows() {
  return process.platform == "win32";
}

function formulaPresent(formula) {
  const tapPrefix =
    process.arch == "arm64" ? "/opt/homebrew" : "/usr/local/Homebrew";
  const tap = `${tapPrefix}/Library/Taps/homebrew/homebrew-core`;
  return (
    fs.existsSync(`${tap}/Formula/${formula[0]}/${formula}.rb`) ||
    fs.existsSync(`${tap}/Aliases/${formula}`)
  );
}

// latest LTS release
const defaultVersion = "11.4";
const mariadbVersion = process.env["INPUT_MARIADB-VERSION"] || defaultVersion;

// only add LTS releases going forward
if (
  !["11.4", "11.2", "11.1", "10.11", "10.6", "10.5"].includes(mariadbVersion)
) {
  throw "Invalid MariaDB version: " + mariadbVersion;
}

const database = process.env["INPUT_DATABASE"];

const input_downloaddir = process.env["INPUT_DOWNLOADDIR"];
const input_mirror = process.env["INPUT_MIRROR"]; // Defaults to https://dlm.mariadb.com
// Get options added at the end fo the url ("...?<OPTIONS>)
const input_download_getopt = process.env["INPUT_DOWNLOAD_GETOPT"];

// Final value for mirror
const mirror = input_mirror;

if (input_download_getopt !== "") {
  get_opt = `?${input_download_getopt}`;
} else {
  get_opt = "";
}

// Convert downloaddir to a System Path (e.g., '/' to '\\' on windows
const downloadDirPath = path.parse(input_downloaddir);
const dirParts = downloadDirPath.dir.split(/[\\/]/);
downloadDirPath.dir = dirParts.length > 0 ? path.join(...dirParts) : ".";
const downloaddir = path.format(downloadDirPath);

let bin;

if (isMac()) {
  const formula = `mariadb@${mariadbVersion}`;
  if (!formulaPresent(formula)) {
    run("brew update");
  }

  // install
  run(`brew install ${formula}`);

  // start
  const prefix = process.arch == "arm64" ? "/opt/homebrew" : "/usr/local";
  bin = `${prefix}/opt/${formula}/bin`;
  run(`${bin}/mysql.server start`);

  addToPath(bin);
} else if (isWindows()) {
  // install
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mariadb-"));
  process.chdir(tmpDir);
  const versionMap = {
    11.4: "11.4.3",
    11.2: "11.2.2",
    11.1: "11.1.2",
    "11.0": "11.0.4",
    10.11: "10.11.6",
    10.6: "10.6.16",
    10.5: "10.5.23",
  };
  const fullVersion = versionMap[mariadbVersion];
  const targetPath = path.join(downloaddir, `mariadb-${fullVersion}.msi`);

  // Ensure that '$downloaddir' exists
  if (!fs.existsSync(downloaddir)) {
    fs.mkdirSync(downloaddir, { recursive: true });
  }
  bin = `${downloaddir}\\mariadb-${fullVersion}.msi`;
  if (!fs.existsSync(targetPath)) {
    // run(
    //   `curl -Ls --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0" -o "${targetPath}" ${mirror}/MariaDB/mariadb-${fullVersion}/winx64-packages/mariadb-${fullVersion}-winx64.msi${get_opt}`,
    // );
    // Download file via JS
    const url = `${mirror}/MariaDB/mariadb-${fullVersion}/winx64-packages/mariadb-${fullVersion}-winx64.msi`;
    const file = fs.createWriteStream(targetPath);
    https.get(url, function(response) {
      response.pipe(file);
    });
  }
  // run(`msiexec /i mariadb.msi SERVICENAME=MariaDB /qn`);
  run(`msiexec /i "${targetPath}" SERVICENAME=MariaDB /qn`);

  bin = `C:\\Program Files\\MariaDB ${mariadbVersion}\\bin`;
  addToPath(bin);

  // add user
  run(
    `"${bin}\\mysql" -u root -e "CREATE USER 'runneradmin'@'localhost' IDENTIFIED BY ''"`,
  );
  run(
    `"${bin}\\mysql" -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'runneradmin'@'localhost'"`,
  );
  run(`"${bin}\\mysql" -u root -e "FLUSH PRIVILEGES"`);
} else {
  const image = process.env["ImageOS"];
  if (image == "ubuntu20" || image == "ubuntu22" || image == "ubuntu24") {
    // clear previous data
    run(`sudo systemctl stop mysql.service`);
    run(`sudo rm -rf /var/lib/mysql`);
  }

  // install
  run(
    `sudo apt-key adv --recv-keys --keyserver hkp://keyserver.ubuntu.com:80 0xF1656F24C74CD1D8`,
  );
  run(
    `echo "deb [arch=amd64,arm64] ${mirror}/repo/mariadb-server/${mariadbVersion}/repo/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) main" | sudo tee /etc/apt/sources.list.d/mariadb.list`,
  );
  run(
    `sudo apt-get update -o Dir::Etc::sourcelist="sources.list.d/mariadb.list" -o Dir::Etc::sourceparts="-" -o APT::Get::List-Cleanup="0"`,
  );
  run(`sudo apt-get install mariadb-server`);

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
  runSafe(path.join(bin, "mysqladmin"), "create", database);
}
