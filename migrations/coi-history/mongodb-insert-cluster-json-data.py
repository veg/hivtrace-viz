import argparse
import json
from pymongo import MongoClient

arg_parser = argparse.ArgumentParser()
arg_parser.add_argument(
    "--input-file",
    help="Path to exported cluster of interest (COI) file (json)",
    required=True,
)
arg_parser.add_argument(
    "--uri",
    help="MongoDB URI (DEFAULT: mongodb://localhost:27017/)",
    default="mongodb://localhost:27017/",
)
arg_parser.add_argument(
    "--database",
    help="MongoDB database name",
    required=True,
)
arg_parser.add_argument(
    "--collection",
    help="MongoDB collection name (DEFAULT: prioritysets)",
    default="prioritysets",
)

args = arg_parser.parse_args()

client = MongoClient(args.uri)
db = client[args.database]
collection = db[args.collection]

with open(args.input_file, "r") as f:
    data = json.load(f)

count = None

if isinstance(data, list):
    count = len(data)
    collection.insert_many(data)
else:
    count = 1
    collection.insert_one(data)

print(f"Inserted {count} document(s) into {args.database}.{args.collection}, from {args.input_file}")