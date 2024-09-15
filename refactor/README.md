Some scripts to assist / automate the refactoring process.

`function-usages.py`:
Provide a regex expression (optional) and files to search within. The script returns all instances of the regex expression that are used only in one of the files (and is useful since a function that is only used in one file can just be moved to that file).

Default pattern: `self\.[a-zA-Z0-9_]+\(` (i.e. `self` followed by a function name)

For example, finding `clusternetwork.js` `self` functions that can be refactored from `clusterOI.js`, run: 
`python3 refactor/function-usages.py src/clusternetwork.js src/clustersOI/clusterOI.js`

Run `python3 refactor/function-usages.py --help` for more details.