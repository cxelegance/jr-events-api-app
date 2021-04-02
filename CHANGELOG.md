# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
It is maintained in [Markdown](https://www.markdownguide.org/).

## [Unreleased]
- implement (or ensure implemented) CORS for Express
- POST /events/ accepts array of multiple records
- POST or other method to replace all records with array of records
- remove authToken from Controller::handleRequest()

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