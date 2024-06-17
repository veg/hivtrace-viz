import sys
import os
import re
import argparse

# Define the regex pattern
regex = re.escape("self.") + "[a-zA-Z0-9_]+" + re.escape("(")

parser = argparse.ArgumentParser(description='Find function usages in a list of files')
# optional regex pattern
parser.add_argument('--pattern', type=str, help='a regex pattern to search for. expects last character to be an open parenthesis')
parser.add_argument('--no-paranthesis', action='store_true', help='if set, will not expect the last character of the pattern to be an open paranthesis')
parser.add_argument('files', metavar='files', type=str, nargs='+',
                    help='a list of files to search for function usages')

# Parse the arguments
args = parser.parse_args()
if args.pattern:
    regex = args.pattern

# records where a function is used, and which functions are used in a file
function_to_files = {}
files_to_functions = {}

# Iterate over the provided file list
for file in args.files:
    # Check if the file exists
    if os.path.isfile(file):
        # Open the file and search for the regex pattern
        with open(file, 'r') as f:
            content = f.read()
            functions = re.findall(regex, content)
            if not args.no_paranthesis:
                functions = [function[:-1] for function in functions]

            for function in functions:
                if function not in function_to_files:
                    function_to_files[function] = {}
                if file not in function_to_files[function]:
                    function_to_files[function][file] = 1
                else: 
                    function_to_files[function][file] += 1

                if file not in files_to_functions:
                    files_to_functions[file] = {}
                if function not in files_to_functions[file]:
                    files_to_functions[file][function] = 1
                else:
                    files_to_functions[file][function] += 1
    else:
        print(f"File not found: {file}")
        sys.exit(1)

for file in files_to_functions:
    print(f"File {file} exclusively uses: ")
    for function in files_to_functions[file]:
        files_used_in = function_to_files[function].keys()
        if len(files_used_in) == 1:
            print(f"  {function} ({files_to_functions[file][function]} times)")