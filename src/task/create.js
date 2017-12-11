var _ = require('lodash')                               // import _ from 'lodash'
var util = require('../util')                           // import util from '../util'
var taskTypes = require('../constants/task-type')       // import * as taskTypes from '../constants/task-type'




// .create(columns_array)
// .create(vfs_file, [mime_type])
// .create(vfs_file, columns_array)


// task definition function
var create = function(p0, p1) {

  if (Array.isArray(p0)) {
    return {
      type: taskTypes.TASK_TYPE_CREATE,
      params: {
        content_type: "application/vnd.flexio.table",
        columns: p0
      }
    }
  } else {
    var ret =  {
      type: taskTypes.TASK_TYPE_CREATE,
      params: {
        path: p0
      }
    }

    if (p1 !== undefined) {
      if (Array.isArray(p1)) {
        ret.params.columns = p1
      } else {
        ret.params.content_type = p1
      }
    }

    return ret
  }
}

create.toCode = function(json) {
  var params = _.get(json, 'params', {})
  var path = JSON.stringify(params.path) || undefined
  var content_type = JSON.stringify(params.content_type) || undefined
  var columns = JSON.stringify(params.columns) || undefined

  if (path !== undefined) {

    if (columns !== undefined) {
      return 'create(' + path + ', ' + columns + ')'
    } else if (content_type !== undefined) {
      return 'create(' + path + ', ' + content_type + ')'
    } else {
      return 'create(' + path + ')'
    }

  } else {

    if (columns !== undefined) {
      return 'create(' + columns + ')'
    } else if (content_type !== undefined) {
      return ''
    }
  }

}

module.exports = create  // export default create