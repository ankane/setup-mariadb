# setup-mariadb

The missing action for MariaDB :tada:

- Simpler than containers
- Works on Linux, Mac, and Windows
- Supports different versions

[![Build Status](https://github.com/ankane/setup-mariadb/actions/workflows/build.yml/badge.svg)](https://github.com/ankane/setup-mariadb/actions)

## Options

### No options

Add it as a step to your workflow

```yaml
- uses: ankane/setup-mariadb@v1
```

### Specify a version: `mariadb-version`

The MariaDB version to download (if necessary) and use.

```yaml
- uses: ankane/setup-mariadb@v1
  with:
    mariadb-version: "11.4"
```

Currently supports

| Version        | `11.4`  | `10.11` | `10.6` | `10.5` |
| -------------- | ------- | ------- | ------ | ------ |
| `ubuntu-24.04` | default | ✓       |        |        |
| `ubuntu-22.04` | default | ✓       | ✓      |        |
| `ubuntu-20.04` | default | ✓       | ✓      | ✓      |
| `macos-14`     | default | ✓       | ✓      | ✓      |
| `macos-13`     | default | ✓       | ✓      | ✓      |
| `macos-12`     | default | ✓       | ✓      | ✓      |
| `windows-2022` | default | ✓       | ✓      | ✓      |
| `windows-2019` | default | ✓       | ✓      | ✓      |

Test against multiple versions

```yaml
strategy:
  matrix:
    mariadb-version: ["11.4", "10.11", "10.6"]
steps:
  - uses: ankane/setup-mariadb@v1
    with:
      mariadb-version: ${{ matrix.mariadb-version }}
```

### `database`

The database to create, example

```yaml
- uses: ankane/setup-mariadb@v1
  with:
    database: testdb
```

### `downloaddir`

Directory to cache MariaDB data. Defaults to `".cache/mariadb"`. The downloaded file will be saved in this directory, allowing you to cache the download using the GitHub `actions/cache` action for instance.

### `mirror`

Server URL to download from. Defaults to `"https://dlm.mariadb.com"`. This replaces the default download server URL.

This helps to be independent of rate-limiting from the original server.

### `download_getopt`

Get options added to the download URL. Defaults to an empty string. By setting `download_getopt` to `"KEY=TOKEN"`, `?KEY=TOKEN` is appended to the download URL, allowing you to block non-authorized downloads from your server.

### Basic usage

```yaml
steps:
  - name: Setup MariaDB
    uses: arkane/setup-mariadb@v1
    with:
      mariadb-version: "10.6"
      database: "my_database"
```

In this basic example, MariaDB version 10.6 is used, and a database named 'my_database' is created. The other parameters are set to their default values.

### Usage with cache

```yaml
steps:
  - name: Cache Files accross workflow sessions
    uses: actions/cache@v4
    with:
      path: .cache/mariadb
      # Example of a key, use a more appropriate one.
      key: ${{ runner.os }}-mariadb-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-mariadb-

  - name: Setup MariaDB
    uses: arkane/setup-mariadb@v1
    with:
      mariadb-version: "10.6"
      database: "my_database"
      downloaddir: ".cache/mariadb"
```

## Extra Steps

Run queries

```yaml
- run: mysql -D testdb -e 'SELECT VERSION()'
```

## Related Actions

- [setup-mysql](https://github.com/ankane/setup-mysql)
- [setup-postgres](https://github.com/ankane/setup-postgres)
- [setup-mongodb](https://github.com/ankane/setup-mongodb)
- [setup-elasticsearch](https://github.com/ankane/setup-elasticsearch)
- [setup-opensearch](https://github.com/ankane/setup-opensearch)
- [setup-sqlserver](https://github.com/ankane/setup-sqlserver)

## Contributing

Everyone is encouraged to help improve this project. Here are a few ways you can help:

- [Report bugs](https://github.com/ankane/setup-mariadb/issues)
- Fix bugs and [submit pull requests](https://github.com/ankane/setup-mariadb/pulls)
- Write, clarify, or fix documentation
- Suggest or add new features
