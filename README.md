# setup-mariadb

The missing action for MariaDB :tada:

- Simpler than containers
- Works on Linux, Mac, and Windows
- Supports different versions

[![Build Status](https://github.com/ankane/setup-mariadb/workflows/build/badge.svg?branch=v1)](https://github.com/ankane/setup-mariadb/actions)

## Getting Started

Add it as a step to your workflow

```yml
      - uses: ankane/setup-mariadb@v1
```

## Versions

Specify a version

```yml
      - uses: ankane/setup-mariadb@v1
        with:
          mariadb-version: "10.11"
```

Currently supports

Version | `11.2` | `11.1` | `11.0` | `10.11` | `10.6` | `10.5`
--- | ---| --- | --- | --- | --- | ---
`ubuntu-22.04` | ✓ | ✓ | ✓ | default | |
`ubuntu-20.04` | ✓ | ✓ | ✓ | default | ✓ | ✓
`macos-14` | ✓ | ✓ | ✓ | default | ✓ | ✓
`macos-13` | ✓ | ✓ | ✓ | default | ✓ | ✓
`macos-12` | ✓ | ✓ | ✓ | default | ✓ | ✓
`windows-2022` | ✓ | ✓ | ✓ | default | ✓ | ✓
`windows-2019` | ✓ | ✓ | ✓ | default | ✓ | ✓

Test against multiple versions

```yml
    strategy:
      matrix:
        mariadb-version: ["11.2", "11.1", "11.0", "10.11"]
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

Set MySQL's `root` user password:

```yml
      - uses: ankane/setup-mariadb@v1
        with:
          root-user-password: SuperSecretPassword
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


## Notes

- A database user named `runneradmin` is created, with no password, who has all privleges. 
- MySQL's `root` user has no password by default. A password can be added by using the action input `root-user-password`.
