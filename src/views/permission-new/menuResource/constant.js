import commonUtils from '@/utils/commonUtils'

const cacheList = [{key: 0, value: '不缓存'}, {key: 1, value: '缓存'}]
export default {
  cacheList: cacheList,
  cacheMap: commonUtils.listToMap(cacheList)
}
