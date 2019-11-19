<template>
  <div class="app-container" v-if="$store.getters.buttons.contains('/trigger/index/select')">
    <el-row>
      <el-form :inline="true" :model="selectInfo">
        <div>
          <el-form-item label="触发器名">
            <el-input v-model="selectInfo.name" placeholder="触发器名"/>
          </el-form-item>
          <el-form-item label="执行器名">
            <el-input v-model="selectInfo.executorName" placeholder="执行器名"/>
          </el-form-item>
          <el-form-item label="所属组">
            <el-input v-model="selectInfo.groupName" placeholder="所属组"/>
          </el-form-item>
          <el-form-item label="任务描述">
            <el-input v-model="selectInfo.description" placeholder="任务描述"/>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="selectInfo.status" placeholder="请选择状态">
              <el-option v-for="status in statusList" :label="status.value" :value="status.key"/>
            </el-select>
          </el-form-item>
          <el-form-item label="创建人">
            <el-input v-model="selectInfo.creator" placeholder="创建人"/>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getTriggerList">查询</el-button>
          </el-form-item>
        </div>
        <el-form-item>
          <el-button type="success" @click="addTriggerInfo(null)"
                     v-if="$store.getters.buttons.contains('/trigger/index/add')">新增触发器
          </el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row>
      <el-table v-loading="listLoading"
                :data="triggerList" border fit highlight-current-row style="width: 100%">
        <el-table-column align="center" label="ID" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="名字">
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="执行器">
          <template slot-scope="scope">
            <span>{{ scope.row.executorName }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="下一次调度时间" width="180">
          <template slot-scope="scope">
            <span>{{ scope.row.nextTriggerTime==0 ? '': parseTime(scope.row.nextTriggerTime) }}</span>
          </template>
        </el-table-column>
        <!--<el-table-column align="center" label="上一次调度时间" width="180">-->
        <!--<template slot-scope="scope">-->
        <!--<span>{{ scope.row.prevTriggerTime==0 ? '': parseTime(scope.row.nextTriggerTime) }}</span>-->
        <!--</template>-->
        <!--</el-table-column>-->
        <el-table-column align="center" label="cron表达式" width="120">
          <template slot-scope="scope">
            <span>{{ scope.row.cron }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="调度策略">
          <template slot-scope="scope">
            <span>{{ strategyMap.get(scope.row.strategy) }}</span>
          </template>

        </el-table-column>
        <el-table-column align="center" label="分片数">
          <template slot-scope="scope">
            <span>{{ scope.row.shardingNum }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="重试次数">
          <template slot-scope="scope">
            <span>{{ scope.row.retryCount }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态">
          <template slot-scope="scope">
            <span v-if="scope.row.status==1||scope.row.status==2" style="color: #67C23A;font-weight: bold">{{ statusMap.get(scope.row.status) }}</span>
            <span v-else style="color: #F56C6C;font-weight: bold">{{ statusMap.get(scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建者">
          <template slot-scope="scope">
            <span>{{ scope.row.creator }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" width="180">
          <template slot-scope="scope">
            <span>{{ scope.row.createTime==0 ? '': parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="所属组">
          <template slot-scope="scope">
            <span>{{ scope.row.groupName }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" width="440"
                         v-if="$store.getters.buttons.contains('/trigger/index/edit') || $store.getters.buttons.contains('/trigger/index/delete') ">
          <template slot-scope="scope">
            <el-button
              type="warning"
              size="small"
              icon="el-icon-edit"
              @click="addTriggerInfo(scope.row)"
              v-if="$store.getters.buttons.contains('/trigger/index/edit')"
            >
              修改
            </el-button>
            <el-button
              type="primary"
              size="small"
              icon="el-icon-edit"
              @click="execute(scope.row)"
              v-if="$store.getters.buttons.contains('/trigger/index/edit')"
            >
              执行
            </el-button>
            <el-button
              v-if="scope.row.status==0 && $store.getters.buttons.contains('/trigger/index/edit')"
              type="success"
              size="small"
              icon="el-icon-edit"
              @click="start(scope.row)"

            >
              启动
            </el-button>
            <el-button
              v-if="scope.row.status==1 && $store.getters.buttons.contains('/trigger/index/edit')"
              type="info"
              size="small"
              icon="el-icon-edit"
              @click="stop(scope.row)"
            >
              停止
            </el-button>
            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="deleteTrigger(scope.row)"
              v-if="$store.getters.buttons.contains('/trigger/index/delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-row>
    <el-row>
      <el-pagination
        :total="selectInfo.total"
        :current-page="selectInfo.currentPage"
        :page-size="selectInfo.pageSize"
        align="center"
        background
        layout="prev, pager, next"
        @current-change="pageChange"
      />
    </el-row>
    <el-dialog v-el-drag-dialog :visible.sync="dialogTableVisible" title="触发器信息" @dragDialog="handleDrag">
      <el-form ref="triggerForm" :inline="false" :model="triggerInfo" :rules="triggerRules" label-width="120px">
        <el-form-item label="触发器名字" prop="name">
          <el-input ref="name" v-model="triggerInfo.name" placeholder="触发器名字"/>
        </el-form-item>
        <el-form-item label="cron表达式" prop="cron">
          <el-input ref="cron" v-model="triggerInfo.cron" placeholder="cron表达式"/>
        </el-form-item>
        <el-form-item label="分片数" prop="shardingNum">
          <el-input ref="shardingNum" v-model.number="triggerInfo.shardingNum" placeholder="分片数"/>
        </el-form-item>
        <el-form-item label="失败重试数" prop="retryCount">
          <el-input ref="retryCount" v-model.number="triggerInfo.retryCount" placeholder="分片数"/>
        </el-form-item>
        <el-form-item label="调度策略" prop="strategy">
          <el-select v-model="triggerInfo.strategy" placeholder="调度策略">
            <el-option v-for="strategy in strategyList" :label="strategy.value" :value="strategy.key"/>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="triggerInfo.description" type="textarea"/>
        </el-form-item>
        <el-form-item label="执行参数">
          <el-input v-model="triggerInfo.executeParam" type="textarea"/>
        </el-form-item>
        <el-form-item label="所属组" prop="groupId">
          <el-select v-model="triggerInfo.groupId" placeholder="所属组" @change="groupSelectChange">
            <el-option v-for="group in groupList" :label="group.name" :value="group.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="执行器">
          <el-select v-model="triggerInfo.executorId" placeholder="请选择执行器">
            <el-option v-for="e in executorList" :label="e.name" :value="e.id"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveTrigger">保存</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
  <div class="app-container" v-else>
    <p style="color: red;">您当前没有权限</p>
  </div>
</template>

<script>
    import elDragDialog from '@/directive/el-drag-dialog'
    import {
        getAllTrigger, addTrigger, deleteTrigger, executeTrigger, startTrigger, stopTrigger
    } from '@/api/trigger'
    import {getAllExecutorNoDetail} from '@/api/executor'
    import {getAllGroup} from '@/api/group'
    import {parseTime} from '@/utils'
    import constant from './constant'
    import commonUtils from '@/utils/commonUtils'

    export default {
        name: 'Trigger',
        directives: {elDragDialog},
        data() {
            return {
                triggerRules: {
                    name: [{required: true, message: '输入触发器名字', trigger: 'blur'}],
                    description: [{required: true, message: '输入触发器描述信息', trigger: 'blur'}],
                    cron: [{required: true, message: '输入cron表达式', trigger: 'blur'}],
                    shardingNum: [{required: true, message: '输入分片数', trigger: 'blur'}, {
                        type: 'number',
                        message: '分片数必须为数字值'
                    }],
                    retryCount: [{required: true, message: '输入重试次数', trigger: 'blur'}, {
                        type: 'number',
                        message: '重试次数必须为数字值'
                    }],
                    strategy: [{required: true, message: '请选择策略', trigger: 'blur'}],
                    executor: [{required: false, message: '请选择执行器', trigger: 'blur'}]
                },
                groupList: [],
                triggerList: [],
                selectInfo: {
                    currentPage: 1,
                    pageSize: 10,
                    total: 0,
                    status: null
                },
                dialogTableVisible: false,
                triggerInfo: {
                    name: null,
                    cron: null,
                    strategy: 0,
                    shardingNum: 0,
                    executeParam: null,
                    retryCount: 0,
                    description: null,
                    executorName: null,
                    executorId: null,
                    groupId: null
                },
                listLoading: false,
                executorList: [],
                executorMap: null,
                groupMap: null,
                strategyList: constant.strategyList,
                strategyMap: constant.strategyMap,
                statusMap: constant.statusMap,
                statusList: constant.statusList
            }
        },
        mounted() {
            this.getTriggerList()
        },
        methods: {
            groupSelectChange(groupId) {
                /**
                 * 按组获取执行器
                 */
                getAllExecutorNoDetail({groupId: groupId}).then((executorList) => {
                    this.executorList = executorList
                    this.executorMap = commonUtils.listToMap(this.executorList, 'id', 'name')
                    if (executorList.length != 0) {
                        this.triggerInfo.executorId = executorList[0].id
                    } else {
                        this.triggerInfo.executorId = null
                    }

                })
            },
            pageChange(currentPage) {
                this.selectInfo.currentPage = currentPage
                this.getTriggerList()
            },
            parseTime: parseTime,
            getTriggerList() {
                getAllTrigger(this.selectInfo).then(response => {
                    this.selectInfo.currentPage = response.pageInfo.currentPage
                    this.selectInfo.pageSize = response.pageInfo.pageSize
                    this.selectInfo.total = response.pageInfo.total
                    this.triggerList = response.triggerList
                })
            },
            // v-el-drag-dialog onDrag callback function
            handleDrag() {
                this.$refs.select.blur()
            },
            addTriggerInfo(row) {
                commonUtils.clearObject(this.triggerInfo)
                if (row) {
                    Object.assign(this.triggerInfo, row)
                }
                // 获取组列表
                getAllGroup().then(allGroup => {
                    this.groupList = allGroup
                    this.groupMap = commonUtils.listToMap(this.groupList, 'id', 'name')
                    //初始化默认值
                    if (!row && this.groupList && this.groupList.length != 0) {
                        this.triggerInfo.groupId = this.groupList[0].id
                    }
                    if (this.triggerInfo.groupId) {
                        this.groupSelectChange(this.triggerInfo.groupId, row)
                    }
                    this.dialogTableVisible = true
                })
            },
            saveTrigger() {
                this.$refs.triggerForm.validate(valid => {
                    //校验执行器
                    if (this.triggerInfo.executorId == null) {
                        this.$alert('请选择执行器')
                        return
                    }
                    //校验组
                    if (this.triggerInfo.groupId == null) {
                        this.$alert('请选择组')
                        return
                    }
                    if (valid) {
                        this.triggerInfo.executorName = this.executorMap.get(this.triggerInfo.executorId)
                        this.triggerInfo.groupName = this.groupMap.get(this.triggerInfo.groupId)
                        addTrigger(this.triggerInfo).then(() => {
                            this.$alert('保存成功')
                            this.getTriggerList()
                            this.dialogTableVisible = false
                        })
                    } else {
                        this.$alert('表单填写错误')
                        return false
                    }
                })
            },
            execute(row) {
                executeTrigger({groupId: row.groupId, triggerId: row.id}).then(() => {
                    this.$alert('执行成功')
                })
            },
            start(row) {
                startTrigger({triggerId: row.id}).then(() => {
                    this.$alert('开启成功')
                    this.getTriggerList()
                })
            },
            stop(row) {
                stopTrigger({triggerId: row.id}).then(() => {
                    this.$alert('停止成功')
                    this.getTriggerList()
                })
            },
            deleteTrigger(row) {
                this.$confirm('此操作将永久删除, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    deleteTrigger({triggerId: row.id}).then(() => {
                        this.$alert('删除成功')
                        this.getTriggerList()
                    })
                })
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
