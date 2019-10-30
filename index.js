const path = require('path');

module.exports = function (source) {
  if (this.cacheable) this.cacheable()
  const callback = this.async()

  let assets = findAssetPaths(source)
  let gltfOut = generateGltfModule(source, assets)

  let resolutions = assets.map((item) => (
    resolveDependency(this, path.dirname(this.resource), `./${item}`)
  ))

  Promise.all(resolutions).then((dependencies) => {
    dependencies.forEach((dependency) => {
      this.addDependency(dependency)
    })
    callback(null, gltfOut)
  }).catch((err) => {
    callback(err)
  })
}

// Match all occurences of various texture/image formats
function findAssetPaths (source) {
  let pattern = /\s*"uri"\s*:\s*"([\w\.-_]+)"/g
  let matches = []
  let match

  while ((match = pattern.exec(source)) !== null) {
    let matchName = match[1]
    if (matches.indexOf(matchName) === -1) {
      matches.push(matchName)
    }
  }

  return matches
}

function resolveDependency (loader, context, chunkPath) {
  return new Promise((resolve, reject) => {
    loader.resolve(context, chunkPath, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

function generateGltfModule (source, assets) {
  let result = '/***** glTF Module *****/'
  let gltfString = source.replace(/(\n|\r|\t| )/gm, '')

  assets.forEach((asset, i) => {
    result += `var __asset${i}__ = require('./${asset}');\n`
    gltfString = gltfString.replace(
      new RegExp(asset, 'g'), `' + __asset${i}__ + '`)
  })

  result += `module.exports = '${gltfString}';\n`

  return result
}
