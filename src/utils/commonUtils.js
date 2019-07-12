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
    list.foreach((obj) => {
      map.set(obj['keyName'], obj)
    })
    return map
  },
  //定义一个递归方法
  convertTree: (routers, menuList) => {
    routers.forEach(r => {
      menuList.forEach((m, i) => {
        if (m.parentId && m.parentId == r.meta.id) {
          if (!r.children) r.children = []
          m.fullPath = r.meta.fullPath + '/' + m.path
          let menu = {
            path: m.path,
            component: () => import('@/views' + r.meta.fullPath + '/' + m.path),
            meta: {id: m.id, title: m.title, fullPath: r.meta.fullPath + '/' + m.path}
          }
          r.children.push(menu)
        }
      })
      if (r.children) convertTree(r.children, menuList)
    })
  }
}


