var Flexio = require('../sdk-test-config')


test('Flexio.task.dump; code to object', () => {
  expect(
    Flexio.task.dump('hello')
  ).toEqual(
    { op: 'dump', params: { msg: 'hello' }}
  )
})


test('Flexio.task.dump; object to code', () => {
  var obj = { op: 'dump', params: { msg: 'hello' }}

  expect(
    Flexio.task.dump.toCode(obj)
  ).toEqual(
    `dump("hello")`
  )
})
