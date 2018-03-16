var _ = require('../lodash-local')                               // import _ from 'lodash'
var util = require('../util')                           // import util from '../util'
var taskOps = require('../constants/task-op')           // import * as taskOps from '../constants/task-op'

// token delimiters; other types of delimiters are allowed as well
const DELIMITER_NONE              = '{none}'
const DELIMITER_COMMA             = '{comma}'
const DELIMITER_SEMICOLON         = '{semicolon}'
const DELIMITER_PIPE              = '{pipe}'
const DELIMITER_TAB               = '{tab}'
const DELIMITER_SPACE             = '{space}'

// token text qualifiers
const TEXT_QUALIFIER_NONE         = '{none}'
const TEXT_QUALIFIER_SINGLE_QUOTE = '{single-quote}'
const TEXT_QUALIFIER_DOUBLE_QUOTE = '{double-quote}'

// conversion formats
const FORMAT_DELIMITED_TEXT = 'delimited'
const FORMAT_FIXED_LENGTH   = 'fixed'
const FORMAT_JSON           = 'json'
const FORMAT_RSS            = 'rss'
const FORMAT_PDF            = 'pdf'
const FORMAT_TABLE          = 'table'

// shorthand conversion strings (auto-configure)
const SHORTHAND_CSV = 'csv'
const SHORTHAND_TSV = 'tsv'

const FORMAT_CSV = {
  format: FORMAT_DELIMITED_TEXT,
  delimiter: DELIMITER_COMMA,
  header: true,
  qualifier: TEXT_QUALIFIER_DOUBLE_QUOTE
}

const FORMAT_TSV = {
  format: FORMAT_DELIMITED_TEXT,
  delimiter: DELIMITER_TAB,
  header: true,
  qualifier: TEXT_QUALIFIER_NONE
}

function isEquivalent(a, b) {
  var aprops = Object.getOwnPropertyNames(a)
  var bprops = Object.getOwnPropertyNames(b)
  if (aprops.length != bprops.length) {
    return false
  }
  for (var i = 0; i < aprops.length; i++) {
    var prop = aprops[i]
    if (a[prop] !== b[prop]) {
      return false
    }
  }
  return true
}

// task definition function
var convert = function(input, output) {

  var task = {
    op: taskOps.TASK_OP_CONVERT,
    params: {}
  }

  // convert input

  if (_.isString(input))
  {
    if (input == SHORTHAND_CSV)
      _.set(task, 'params.input', FORMAT_CSV)
       else if (input == SHORTHAND_TSV)
      _.set(task, 'params.input', FORMAT_TSV)
       else
      _.set(task, 'params.input.format', input)
  }
   else if (_.isPlainObject(input))
  {
    _.set(task, 'params.input', input)
  }

  // convert output

  if (_.isString(output))
  {
    if (output == SHORTHAND_CSV)
      _.set(task, 'params.output', FORMAT_CSV)
       else if (output == SHORTHAND_TSV)
      _.set(task, 'params.output', FORMAT_TSV)
       else
      _.set(task, 'params.output.format', output)
  }
   else if (_.isPlainObject(output))
  {
    _.set(task, 'params.output', output)
  }

  return task
}

convert.toCode = function(json, Flexio) {
  var params = _.get(json, 'params', {})
  var input = _.get(params, 'input', {})
  var output = _.get(params, 'output', {})

  var p1
  var p2

  // we can use the 'csv' shorthand string as the parameter
  if (isEquivalent(input, FORMAT_CSV))
    p1 = SHORTHAND_CSV
  if (isEquivalent(output, FORMAT_CSV))
    p2 = SHORTHAND_CSV

  // we can use the 'tsv' shorthand string as the parameter
  if (isEquivalent(input, FORMAT_TSV))
    p1 = SHORTHAND_TSV
  if (isEquivalent(output, FORMAT_TSV))
    p2 = SHORTHAND_TSV

  // we can use the format string as the parameter
  if (Object.keys(_.omit(input, ['format'])).length == 0)
    p1 = _.get(input, 'format', '')
  if (Object.keys(_.omit(output, ['format'])).length == 0)
    p2 = _.get(output, 'format', '')

  // use the raw object as a fallback
  if (!p1)
    p1 = input
  if (!p2)
    p2 = output

  return 'convert(' + JSON.stringify(p1) + ', ' + JSON.stringify(p2) + ')'
}

module.exports = convert  // export default convert
