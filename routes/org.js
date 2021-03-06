const db = require('../lib/db/')
const scan = require('../lib/scan/org')
const colors = require('../lib/colors.json')

const sortingMethods = ['asc', 'desc', 'oldest', 'newest']

exports.index = async function getOrganization(req, res) {
  const { org } = req.params
  const page = parseInt(req.query.page - 1 || 0, 10)
  const sortingMethod = (sortingMethods.includes(req.query.sorting_method))
    ? req.query.sorting_method
    : sortingMethods[0]

  const orderBy = (sortingMethod === 'asc' || sortingMethod === 'desc')
    ? 'name'
    : 'updated'
  const desc = (sortingMethod === 'desc' || sortingMethod === 'newest')

  const installations = req.user.installations.map(installation => installation.account.login)

  // validate this user is a member of this org
  if (!installations.includes(org)) {
   res.render('org/404', { org })
   return
  }

  const limit = 10

  const { rows } = await db.repository.list(org, orderBy, desc, limit, page * limit)

  if (rows.length === 0) {
   res.render('org/404', { org })
   return
  }

  const total = rows[0] ? rows[0].total : 0
  const pages = Math.ceil(total / limit)

  res.render('org/index', { colors, org, repositories: rows, total, pages, page: page + 1, sortingMethod })
}

exports.scan = async function orgScan(req, res) {
  const { org } = req.params

  const installations = req.user.installations.map(installation => installation.account.login)

  // validate this user is a member of this org
  if (!installations.includes(org)) {
   res.redirect('/dashboard')
   return
  }

  const { rows: [installation] } = await db.installation.get(org)

  // TODO check for existence

  scan(installation.id, installation.name, installation.type)

  // TODO add intermediary page

  res.redirect(`/${org}`)
}
