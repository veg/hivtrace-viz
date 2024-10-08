# Migration for Clusters of Interest (CoI) / Priority Sets History Tracking

`get-cluster-history.py` is a script that uses Selenium to scrape the history of changes to the Clusters of Interest (CoI) / Priority Sets in the site. It is intended to be used for migration purposes, to generate the previously untracked history of changes to the CoI / Priority Sets.

The script loads the site with a provided network json file and priority set json file, and then downloads the history of changes by clicking the "View history over time" button in the CoI / Priority Sets page.

## Requirements

- Python3
- argparse
- selenium
- Chrome
- ChromeDriver

### Installing ChromeDriver

1. Download the latest version of ChromeDriver from https://googlechromelabs.github.io/chrome-for-testing/
2. For Linux, extract the downloaded file and move the chromedriver binary to /usr/local/bin/chromedriver (or any other directory in your PATH)

## Usage:

Ensure the site is running at http://127.0.0.1:8080/ with `npm run develop` and then run `python get-cluster-json-data.py`. See `python get-cluster-json-data.py --help` for more options. To insert the data into the MongoDB database, run `python mongodb-insert-cluster-json-data.py`. See `python mongodb-insert-cluster-json-data.py --help` for more options.

### Example Usage:

```
python get-cluster-json-data.py --network-file "/ui-tests/data/dummy_data_network.json" --priority-sets-file "/ui-tests/data/dummy_data_coi.json"
```

**Note the file URL here is respective to the html/priority-sets-args.html file, with the root directory (`/`) being the root of the project.**

```
python mongodb-insert-cluster-json-data.py --input-file "output/dummy_data_network/2024-09-10.json" --database "datamonkey-dev"
```
