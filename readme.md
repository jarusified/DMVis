# NOVA Performance Visualization

## Installation

```
pip install .
```

## Usage

```
nova_vis --data_dir={RAW_PERF_DATA_PATH}
```

## For developement

Requirements: node >= v18.3.0, npm >= 8.16.0, python >=3.7.0

### Client

For installation,
```
cd client
npm install
```

For running the react client. This loads the interface on the localhost.
```
npm run dev
```

For updating the build
```
npm run build
```

### Server
To make sure the recent changes are reflected by the installed package, we need to install using the editable mode as below
```
cd server
pip install -e .
```

Before pushing your first commit, install git's pre-commit which does a lot of formatting and cleanup automatically.
```
pip install pre-commit
pre-commit install
```

For testing, use `tox`
```
pip install tox
tox .
```
