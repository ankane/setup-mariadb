# setup-mariadb

The missing action for MariaDB :tada:

- Simpler than containers
- Works on Linux, Mac, and Windows
- Supports different versions

[![Build Status](https://github.com/ankane/setup-mariadb/actions/workflows/build.yml/badge.svg)](https://github.com/ankane/setup-mariadb/actions)

## Getting Started

Add it as a step to your workflow

```yml
      - uses: ankane/setup-mariadb@v1
```

The default credentials are:

- user: the OS user (`runner` on Linux and Mac, `runneradmin` on Windows)
- password: none
- host: `localhost` or socket
- port: `3306`

## Versions

Specify a version

```yml
      - uses: ankane/setup-mariadb@v1
        with:
          mariadb-version: 12.3
```

Currently supports

Version | `12.3` | `11.8` | `11.4` | `10.11` | `10.6`
--- | --- | --- | --- | --- | ---
`ubuntu-26.04` | default | ✓ | | |
`ubuntu-26.04-arm` | default | ✓ | | |
`ubuntu-24.04` | default | ✓ | ✓ | ✓ |
`ubuntu-24.04-arm` | default | ✓ | ✓ | ✓ |
`ubuntu-22.04` | default | ✓ | ✓ | ✓ |
`ubuntu-22.04-arm` | default | ✓ | ✓ | ✓ |
`macos-26` | default | ✓ | ✓ | ✓ | ✓
`macos-15` | default | ✓ | ✓ | ✓ | ✓
`macos-15-intel` | default | ✓ | ✓ | ✓ | ✓
`macos-14` | default | ✓ | ✓ | ✓ | ✓
`windows-2025` | default | ✓ | ✓ | ✓ | ✓
`windows-2022` | default | ✓ | ✓ | ✓ | ✓

Test against multiple versions

```yml
    strategy:
      matrix:
        mariadb-version: [12.3, 11.8, 11.4, 10.11, 10.6]
    steps:
      - uses: ankane/setup-mariadb@v1
        with:
          mariadb-version: ${{ matrix.mariadb-version }}
```

## Options

Create a database

```yml
      - uses: ankane/setup-mariadb@v1
        with:
          database: testdb
```

Specify a user

```yml
      - uses: ankane/setup-mariadb@v1
        with:
          user: testuser
```

## Extra Steps

Run queries

```yml
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
