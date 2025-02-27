/**
 * @param {import('@octokit/types').ReposListCommitsResponseData} commits
 */
function composeReleaseBody (commits, format, categorize) {
  return Object.values(
    commits.reduce((current, commit) => {
      const category = categorize(commit.commit.message)

      return {
        ...current,
        [category.id]: {
          category,
          changes: [
            ...(current[category.id] || { changes: [] }).changes,
            format(commit)
          ]
        }
      }
    }, {})
  )
    .filter(x => x.category.id !== 'release') // remove release commits
    .sort((a, b) => b.category.weight - a.category.weight)
    .map(({ category, changes }) => `### ${category.heading}\n${changes.join('\n')}`)
    .join('\n\n')
}

function defaultFormatter (commit) {
  const firstLine = commit.commit.message.split('\n')[0]
  const scopeMatch = firstLine.match(/^[\w]+[(](\w+)[)]!?:\s*/)
  let scope = ''
  if (scopeMatch) {
    scope = ` **(${scopeMatch[1]})**`
  }
  const change = firstLine.replace(/^[\w()]+!?:\s*/, '')
  const subject = change.charAt(0).toUpperCase() + change.slice(1)
  const author = commit.author && commit.author.login ? ` @${commit.author.login}`: ''
  return `*${scope} ${subject}${author}`
}

function defaultCategorizer (message) {
  const execs = /^([\w]+)([(](\w+)[)])?!?:*/.exec(message);
  const commitType = execs ? execs[1].toLowerCase() : 'other';
  switch (commitType) {
    case 'feat':
      return { id: 'feat', heading: ':sparkles: Features', weight: 5 }

    case 'fix':
      return { id: 'fix', heading: ':beetle: Bug fixes', weight: 4 }

    case 'refactor':
      return { id: 'refactor', heading: ':hammer_and_wrench: Refactor', weight: 3 }

    case 'chore':
      return { id: 'chore', heading: ':broom: Chore', weight: 2 }

    case 'release':
      return { id: 'release', heading: ':rocket: Release', weight: 1 }

    default:
      return { id: 'other', heading: ':alien: Other', weight: 0 }
  }
}

module.exports.defaultFormatter = defaultFormatter
module.exports.defaultCategorizer = defaultCategorizer
module.exports.composeReleaseBody = composeReleaseBody
