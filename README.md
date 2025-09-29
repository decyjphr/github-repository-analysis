# GitHub Repository Analysis

### The Challenge

Before any migration starts it is a best practice to understand the distribution of repos that needs to be migrated. We have a tool [repo-stats](https://github.com/mona-actions/gh-repo-stats-plus) that generates a CSV file of repositories in the source system.

But we don't have a tool that can run analytics on the data and help in offering guidance to the customer using this data.


### The Objective

The goal is to build on top of a tool that was generated using Spark and using Copilot to offer analytics for the GH repositories.



### The Approach

We have built a tool using Spark and subsequently modified using Copilot. 
The code is at https://github.com/decyjphr/github-repository-analysis and `PRD.md` has the requirements.

## Phase 1:
Create various analytics on it. Use Python notebooks for quick experimentation and translate the code to NodeJS since the app will be in NodeJS

## Phase 2
We can do some ML work using the large data we have in our Kusto clusters and use that to build models . Using these models we can then predict the time it will take to migrate a particular repo or the entire organization using simple linear regression models.

### Potential Risks or Challenges (optional)

- Lack of good algorithms for guiding customers
- No good way to get data from non-Github systems
- Lack of data for building models
