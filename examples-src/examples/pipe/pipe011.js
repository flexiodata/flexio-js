
const code = `
Flexio.pipe()
  .input('dropbox', 'flexio-dropbox', ['/test_data/names-and-ip-addresses.csv'])
  .convert('delimited', 'json')
  .run(function(err, result) {
    console.log(result)
  })`

const fn = (Flexio, callback) => {
  Flexio.pipe()
    .input('dropbox', 'flexio-dropbox', ['/test_data/names-and-ip-addresses.csv'])
    .convert('delimited', 'json')
    .run(callback)
}

export default {
  title: 'Read a CSV file from Dropbox and convert it to JSON',
  code,
  fn
}
