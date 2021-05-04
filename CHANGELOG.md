# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
It is maintained in [Markdown](https://www.markdownguide.org/).

## [Unreleased]
- implement (or ensure implemented) CORS for Express
- POST /events/ accepts array of multiple records
- POST or other method to replace all records with array of records

## [0.3.0] - 2021-05-04
### Added
- new test suite via API/frisby that uses a real database

### Changed
- authentication now includes Bearer for operation after authenticating using Basic
- improved authtoken handling; removed from Controller::handleRequest()
- fixed database opener: now opens separate database for each service
- ensure ReauthenticationRequiredError is thrown when appropriate
- PUT event now accepts the event ID given as parameter

## [0.2.3] - 2021-04-08
### Added
- Hashword lib added for authentication
- added ParameterTypeError for Services to complain with TypeError
- atob() added as a dependency for Heroku

### Changed
- debugging control given to process.env
- Express now uses "trust proxy"
- various bug fixes in handling of passwords and authentication

## [0.2.2] - 2021-04-01
### Changed
- forgot to update changelog

## [0.2.1] - 2021-04-01
### Changed
- tweak to work on Heroku host/system

## [0.2.0] - 2021-03-31
### Added
- handle bad routes on the /api/ root route
- implemented a Route class for defining routes

### Changed
- updated planning diagrams to reflect changes in previous versions
- update some JSDoc

## [0.1.1] - 2021-03-19
### Changed
- CHANGELOG, LICENSE, and README updated

## [0.1.0] - 2021-03-19
### Added
- the API is working; it begins!