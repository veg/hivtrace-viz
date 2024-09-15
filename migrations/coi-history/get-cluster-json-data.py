from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import os
import argparse

arg_parser = argparse.ArgumentParser()
arg_parser.add_argument(
    "--download-dir",
    help="Path to download directory (DEFAULT: ./output/)",
    default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "output"),
)
arg_parser.add_argument(
    "--network-file",
    help="Path to cluster network file (json)",
    required=True
)
arg_parser.add_argument(
    "--priority-sets-file",
    help="Path to priority sets file (json)",
    required=True
)
arg_parser.add_argument(
    "--download_wait_duration",
    help="Time (seconds) to wait for the download to complete (DEFAULT: 2)", 
    default=2
)
args = arg_parser.parse_args()

options = Options()

network_dirname = os.path.basename(args.network_file).split(".")[0]
network_dir = os.path.join(args.download_dir, network_dirname)

if not os.path.exists(network_dir):
    os.makedirs(network_dir)

options.add_experimental_option(
    "prefs",
    {
        "download.default_directory": network_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
    },
)

driver = webdriver.Chrome(options=options)

driver.get(
    f"http://127.0.0.1:8080/html/priority-sets-args.html?network={args.network_file}&PG={args.priority_sets_file}"
)

driver.find_element(By.ID, "priority-set-tab").click()
driver.find_element(By.XPATH, "//*[text()='Export to JSON']").click()
time.sleep(args.download_wait_duration)
driver.quit()
