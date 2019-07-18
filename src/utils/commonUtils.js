export default {
  listToMap: (list, keyName, valueName) => {
    const map = new Map()
    for (const item of list) {
      if (!keyName) {
        keyName = "key"
      }
      if (!valueName) {
        valueName = "value"
      }
      map.set(item[keyName], item[valueName])
    }
    console.log(map)
    return map
  },
  listToObjectMap: (list, keyName) => {
    const map = new Map()
    console.log("list", list)
    list.foreach((obj) => {
      map.set(obj[keyName], obj)
    })
    return map
  }
}


