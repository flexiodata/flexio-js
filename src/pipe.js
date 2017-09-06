import axios from 'axios'

// individual lodash includes
import assign from 'lodash.assign'
import pick from 'lodash.pick'
import last from 'lodash.last'
import tail from 'lodash.tail'
import get from 'lodash.get'
import set from 'lodash.set'
import map from 'lodash.map'
import defaultTo from 'lodash.defaultto'
import isNil from 'lodash.isnil'
import isString from 'lodash.isstring'
import isObject from 'lodash.isobject'

import * as ttypes from './constants/task-type'
import * as ctypes from './constants/connection-type'

var base_params = {
  name: 'New JS SDK Pipe',
  description: '',
  task: []
}

export default (auth_token) => {
  return assign({}, {
    pipe: assign({}, base_params),
    processes: [],

    // axios instance with base url and auth token factored into it
    http: axios.create({
      baseURL: 'https://test.flex.io/api/v1',
      headers: { 'Authorization': 'Bearer ' + auth_token }
    }),

    // -- state --

    saving: false,
    running: false,

    // -- debug --

    debug(msg) {
      if (!window)
        return

      // TODO: add flag for 'debug' mode

      var msg = 'Flex.io Javascript SDK: ' + msg
      return window.console ? console.log(msg) : alert(msg)
    },

    // -- methods --

    getJson() {
      return assign({}, this.pipe)
    },

    getProcesses() {
      return [].concat(this.processes)
    },

    getLastProcess() {
      return last(this.processes)
    },

    addTask(task) {
      this.pipe.task.push(task)
      return this
    },

    clearTasks() {
      this.pipe.task = []
      return this
    },

    save() {
      var args = Array.from(arguments)
      var params = get(args, '[0]')
      var successCb
      var errorCb

      if (this.saving === true || this.running === true)
      {
        setTimeout(() => { this.save.apply(this, arguments) }, 50)
        return this
      }

      if (isObject(params))
      {
        assign(this.pipe, pick(params, ['name', 'description', 'ename']))
        successCb = get(args, '[1]')
        errorCb = get(args, '[2]')
      }
       else
      {
        successCb = get(args, '[0]')
        errorCb = get(args, '[1]')
      }

      this.saving = true
      this.debug('Saving Pipe `' + get(this.pipe, 'name', 'Untitled Pipe') + '`...')

      this.http
        .post('/pipes', this.pipe)
        .then(response => {
          assign(this.pipe, get(response, 'data', {}))
          this.saving = false
          this.debug('Pipe Saved.')

          if (typeof successCb == 'function')
            successCb(response)
        })
        .catch(error => {
          this.saving = false
          this.debug('Pipe Save Failed.')

          if (typeof errorCb == 'function')
            errorCb(error)
        })

      return this
    },

    run() {
      var args = Array.from(arguments)
      var successCb = get(args, '[0]')
      var errorCb = get(args, '[1]')

      if (this.saving === true || this.running === true)
      {
        setTimeout(() => { this.run.apply(this, arguments) }, 50)
        return this
      }

      this.running = true
      this.debug('Running Pipe `' + get(this.pipe, 'name', 'Untitled Pipe') + '`...')

      var run_params = assign({}, this.pipe)

      // if we have saved this pipe, use the pipe's eid as the parent eid
      var parent_eid = get(this.pipe, 'eid', '')
      if (parent_eid.length > 0)
        run_params = { parent_eid }

      // set the process to run mode and auto-run it
      assign(run_params, {
        process_mode: 'R',
        run: true
      })

      this.http
        .post('/processes', run_params)
        .then(response => {
          this.processes.push(get(response, 'data', {}))
          this.debug('Process Running.')
          this.running = false

          if (typeof successCb == 'function')
            successCb(response)
        })
        .catch(error => {
          this.debug('Process Failed.')
          this.running = false

          if (typeof errorCb == 'function')
            errorCb(error)
        })

      return this
    },

    // -- tasks --

    input() {
      var type = ttypes.TASK_TYPE_INPUT
      var args = Array.from(arguments)
      var connection_type = get(args, '[0]', '')
      var connection = undefined
      var items = undefined

      if (args.length == 0)
      {
        this.debug('Input task requires at least 1 parameter')
        return this
      }

      switch (connection_type)
      {
        default:
          connection_type = ctypes.CONNECTION_TYPE_HTTP
          items = [].concat(args)
          break

        case ctypes.CONNECTION_TYPE_AMAZONS3:
        case ctypes.CONNECTION_TYPE_DROPBOX:
        case ctypes.CONNECTION_TYPE_ELASTICSEARCH:
        case ctypes.CONNECTION_TYPE_GOOGLEDRIVE:
        case ctypes.CONNECTION_TYPE_GOOGLESHEETS:
        case ctypes.CONNECTION_TYPE_HTTP:
        case ctypes.CONNECTION_TYPE_MYSQL:
        case ctypes.CONNECTION_TYPE_POSTGRES:
        case ctypes.CONNECTION_TYPE_SFTP:
          connection = get(args, '[1]', '')
          items = get(args, '[2]', [])
          break

        case ctypes.CONNECTION_TYPE_RSS:
          connection = connection_type
          items = get(args, '[1]', [])
          break
      }

      items = map(items, (item) => {
        return {
          path: item
        }
      })

      return this.addTask({
        type,
        metadata: { connection_type },
        params: {
          connection,
          items
        }
      })
    },

    output() {
      var type = ttypes.TASK_TYPE_OUTPUT
      var args = Array.from(arguments)
      var connection_type = get(args, '[0]', '')
      var connection = undefined
      var location = undefined

      if (args.length == 0)
      {
        this.debug('Output task requires at least 1 parameter')
        return this
      }

      switch (connection_type)
      {
        case ctypes.CONNECTION_TYPE_AMAZONS3:
        case ctypes.CONNECTION_TYPE_ELASTICSEARCH:
        case ctypes.CONNECTION_TYPE_GOOGLESHEETS:
        case ctypes.CONNECTION_TYPE_MYSQL:
        case ctypes.CONNECTION_TYPE_POSTGRES:
          connection = get(args, '[1]', '')
          break

        case ctypes.CONNECTION_TYPE_DROPBOX:
        case ctypes.CONNECTION_TYPE_GOOGLEDRIVE:
        case ctypes.CONNECTION_TYPE_SFTP:
          connection = get(args, '[1]', '')
          location = get(args, '[2]', '/')
          break
      }

      return this.addTask({
        type,
        metadata: { connection_type },
        params: {
          connection,
          location
        }
      })
    },

    convert(input, output) {
      var type = ttypes.TASK_TYPE_CONVERT

      var task = {
        type,
        params: {}
      }

      if (isString(input))
        set(task, 'params.input.format', input)
         else if (isObject(input))
        set(task, 'params.input', input)

      if (isString(output))
        set(task, 'params.output.format', output)
         else if (isObject(output))
        set(task, 'params.output', output)

      return this.addTask(task)
    },

    limit(value) {
      var type = ttypes.TASK_TYPE_LIMIT
      value = defaultTo(value, 10)

      return this.addTask({
        type,
        params: {
          value
        }
      })
    },

    select() {
      var type = ttypes.TASK_TYPE_SELECT
      var columns = Array.from(arguments)

      return this.addTask({
        type,
        params: {
          columns
        }
      })
    },

    sleep(value) {
      var type = ttypes.TASK_TYPE_SLEEP
      value = defaultTo(value, 10)

      return this.addTask({
        type,
        params: {
          value
        }
      })
    }
  })
}