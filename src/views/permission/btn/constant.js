import commonUtils from '@/utils/commonUtils'

const btnList = [
  {key: 'select', value: '查询'},
  {key: 'add', value: '增加'},
  {key: 'delete', value: '删除'},
  {key: 'edit', value: '编辑'}
]
export default {
  btnList: btnList,
  btnMap: commonUtils.listToMap(btnList),
}
