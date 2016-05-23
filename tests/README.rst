Testing JavaScript
------------------
For the tests to be picked they have been added to the `paths.js`:

This automatically picks up every file (plus files in subdirectories) in the test directory. It also adds all the dependencies of the application with the `src` attribute.

To run the tests run `./node_modules/.bin/gulp test`. To set up a test look at the `test-example.js <test-example.js>`_
