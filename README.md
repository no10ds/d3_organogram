# D3 Organogarm
An Interactive and Searchable organogram in d3 - adapted from the code [here](https://gist.github.com/bumbeishvili/dbc0beff4baf64674b0f05b94cb4462e)

## Usage

### Setup

Run `npm install` to install the node dependencies to run the application.

Run `pip install -r requirements` to install the python dependencies, needed to generate the data.

### Running the app

Run `node index.js`, which will launch the application at `http://localhost:3000`

### Changing the data

Currently the underlying data is randomly generated with [parser.py](./parser.py). To run the application with data from your organisation, change this file to read from a csv that matches the schema produced within the `generate_current_grade_level` function.
