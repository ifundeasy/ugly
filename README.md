# Ugly
for uglify a file, recursively.

## Feature
  - uglifying .js extension
  - uglifying .css extension

## Installation
```sh
$ sudo npm install
```

## How to use
```sh
$ node index.js your/project/path [is]
```
[is] : you can change this with 'true' (for force minify, this will replace your output path)


## Example
```sh
$ node index.js your/project/path true
```

or

```sh
$ sh test.sh
```

## Result
look at your your/project/path.ugly

## Avoid / Ignoring
put your .ugly on your input path, its look like your/project/path/.ugly

## License
ISC