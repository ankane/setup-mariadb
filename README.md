# setup-mariadb

The missing action for MariaDB - no need for containers :tada:

Supports Linux and Mac, and many versions

Version | `ubuntu-20.04` | `ubuntu-18.04` | `ubuntu-16.04` | `macos-10.15`
--- | --- | --- | --- | ---
`10.5` | ✓ | ✓ | ✓ | ✓
`10.4` | | ✓ | ✓ | ✓
`10.3` | | ✓ | ✓ |
`10.2` | | ✓ | ✓ |
`10.1` | | | | ✓

[![Build Status](https://github.com/ankane/setup-mariadb/workflows/build/badge.svg?branch=v1)](https://github.com/ankane/setup-mariadb/actions)

## Getting Started

Add it as a step to your workflow

```yml
    - uses: ankane/setup-mariadb@v1
```

Specify a version (defaults to the latest if no version is specified)

```yml
    - uses: ankane/setup-mariadb@v1
      with:
        mariadb-version: 10.5
```

Test against multiple versions

```yml
    strategy:
      matrix:
        mariadb-version: [10.5, 10.4, 10.3, 10.2, 10.1]
    steps:
    - uses: ankane/setup-mariadb@v1
      with:
        mariadb-version: ${{ matrix.mariadb-version }}
```

## Extra Steps

Create a database

```yml
    - run: mysqladmin create testdb
```

Run queries

```yml
    - run: mysql -D testdb -e 'SELECT VERSION()'
```

## Related Actions

- [setup-mysql](https://github.com/ankane/setup-mysql)
- [setup-postgres](https://github.com/ankane/setup-postgres)
- [setup-mongodb](https://github.com/ankane/setup-mongodb)
- [setup-elasticsearch](https://github.com/ankane/setup-elasticsearch)

## Contributing

Everyone is encouraged to help improve this project. Here are a few ways you can help:

- [Report bugs](https://github.com/ankane/setup-mariadb/issues)
- Fix bugs and [submit pull requests](https://github.com/ankane/setup-mariadb/pulls)
- Write, clarify, or fix documentation
- Suggest or add new features
