# Ghost Inspector Testing
https://hosgitesting.github.io/

## Purpose
- Provide easier access to front-end regression tests written in Ghost Inspector
- Allow for faster full regression testing
- Provide testing results after tests are run
- Allow for custom test options (environment URL, testing in sequence, etc.)

## Instructions for Use
### Starting from default URL
1. Navigate to the following URL: https://hosgitesting.github.io/

2. Access options by clicking the “Options” button in the page header

3. Input the API key for the Ghost Inspector account being used

4. (Optional) Input an “Environment URL” in which tests will be run
    - All tests use this environment URL along with relative references for navigation 
    - A local URL should work here as well
    - Please note, the environment URL should be the default homepage (ex. index.html)

5. Click “Save” to save options

6. Click “Get Tests” to retrieve all tests from Ghost Inspector using the API Key entered
    - Tests will be loaded, organized by suite. 

7. Run tests as needed (test options will be applied for any and all tests run)
    - To run an individual test, click “Run Test” beside the desired test
    - To run an entire suite of tests, click “Run Suite” beside the desired suite name
    - To run all tests, click “Run All Test” in the page header

8. Test results will be displayed after each test is finished
    - Tests that pass are denoted with a green checkmark
    - Tests that fail are denoted with the test “Failed” in red
    - More specific test results will be added to the expandable section of each individual test after it is finished executing



### Starting with API key in url
- Navigate to the following URL: https://hosgitesting.github.io/?apiKey=APIKEY 
  - Adding the API key for Ghost Inspector into the query string of the URL will load the page and automatically load any tests in that account. 

### Starting with API key, running all tests
- Navigate to the following URL: https://hosgitesting.github.io/?apiKey=APIKEY&runall=true 
  - Adding the property “runall=true” to the query string in addition to the API key for Ghost Inspector will load the page, automatically load any tests in that account, then begin running all available tests. Test results will be displayed normally.

### Starting with API key and custom environment URL
- Navigate to the following URL: https://hosgitesting.github.io/?apiKey=APIKEY&urlStart=NEWURL
  - Adding the property “urlStart=<newURL>” to the query string in addition to the API key for Ghost Inspector will load the page, automatically load any tests in that account, then apply the test option “Environment URL” based on the URL entered
  - Replace “<newURL>” with the desired environment URL
    - For example: …&urlStart=google.com


## Options
Within the “Options” menu,  you can set or change a few settings related to running tests:

- API Key
  - Enter the API key from Ghost Inspector for the project in question

- Environment URL
  - Enter a different URL in which to run tests, in place of the default URL
  - Environment URL should be the base URL for the environment (ex. “index.html”)

- Testing Method
  - When running multiple tests at a time, allows for running tests simultaneously, or sequentially.
    - Running tests Simultaneously (synchronously)
      - Tests will all begin running immediately, and are not dependent on other tests completing. This method is fastest, but does not allow for cancelling tests in progress. 
    - Running tests Sequentially (asynchronously)
      - Tests will be queued up, and run one at a time. This method is far slower than running in parallel, but gives the option to cancel pending tests if needed. 
    

- Get Latest Test Results
  - Clicking this button will load the most recent test results into each test listed.
    - Will display whether the test passed or failed beside the “Run Test” button of each test
    - Will display individual test steps in the expanded section of each test
      - Includes a link to the screenshot and video of the test being performed
      - Test steps that passed are highlighted in green, steps that failed are highlighted in red. 
