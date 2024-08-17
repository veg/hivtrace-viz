Some scripts to assist / automate the refactoring process.

`function-usages.py`:
Provide a regex expression (optional) and files to search within. The script returns all instances of the regex expression that are used only in one file (and is useful since a function that is only used in one file can just be moved to that file).  

For example, finding `clusternetwork.js` `self` functions that can be refactored from `clusterOI.js`, run: 
`python3 refactor/function-usages.py src/clusternetwork.js src/clustersOI/clusterOI.js`