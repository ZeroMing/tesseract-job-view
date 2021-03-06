<template>
  <div class="app-container" v-if="$store.getters.buttons.contains('/executor/index/select')">
    <el-row>
      <el-form :inline="true" :model="selectInfo">
        <div style="display: inline">
          <el-form-item label="执行器名称">
            <el-input v-model="selectInfo.name" placeholder="执行器名称"/>
          </el-form-item>
          <el-form-item label="创建人">
            <el-input v-model="selectInfo.creator" placeholder="创建人"/>
          </el-form-item>
          <el-form-item>
            <el-button v-if="$store.getters.buttons.contains('/executor/index/select')" type="primary"
                       @click="getExecutorList">查询
            </el-button>
          </el-form-item>
        </div>
        <el-form-item>
          <el-button v-if="$store.getters.buttons.contains('/executor/index/add')" type="success"
                     @click="addExecutorBtn(null)">新增执行器
          </el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row>
      <el-table v-loading="listLoading"
                :data="executorList" border fit highlight-current-row style="width: 100%">
        <el-table-column align="center" label="ID" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.executor.id }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="名字">
          <template slot-scope="scope">
            <span>{{ scope.row.executor.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="描述">
          <template slot-scope="scope">
            <span>{{ scope.row.executor.description }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="执行器组">
          <template slot-scope="scope">
            <span>{{ scope.row.executor.groupName }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="在线机器">
          <template slot-scope="scope">
            <span v-for="executorDetail in scope.row.executorDetailList" style="color: #67C23A;font-weight: bold">{{ executorDetail.socket }}<br></span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="创建者">
          <template slot-scope="scope">
            <span>{{ scope.row.executor.creator }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" width="180">
          <template slot-scope="scope">
            <span>{{ scope.row.executor.createTime==0 ? '': parseTime(scope.row.executor.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="操作" width="300">
          <template slot-scope="scope">
            <el-button
              v-if="$store.getters.buttons.contains('/executor/index/edit')"
              type="warning"
              size="small"
              icon="el-icon-edit"
              @click="addExecutorBtn(scope.row)"
            >
              修改
            </el-button>

            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="deleteExecutor(scope.row)"
              v-if="$store.getters.buttons.contains('/executor/index/delete')"
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
    <el-dialog v-el-drag-dialog :visible.sync="dialogTableVisible" title="执行器信息" @dragDialog="handleDrag">
      <el-form ref="executorForm" :inline="false" :model="executorInfo" :rules="executorRules" label-width="120px">
        <el-form-item label="触发器名字" prop="name">
          <el-input ref="name" v-model="executorInfo.name" placeholder="触发器名字"/>
        </el-form-item>
        <el-form-item label="执行器组" prop="group">
          <el-select v-model="executorInfo.groupId" placeholder="执行器组">
            <el-option v-for="group in groupList" :label="group.name" :value="group.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="触发器描述" prop="description">
          <el-input ref="name" v-model="executorInfo.description" placeholder="触发器描述"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveExecutor">保存</el-button>
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
    import {getAllExecutor, addExecutor, deleteExecutor} from '@/api/executor'
    import {parseTime} from '@/utils'
    import {getAllGroup} from '@/api/group'
    import constant from './constant'
    import commonUtils from '@/utils/commonUtils'

    export default {
        name: 'Executor',
        directives: {elDragDialog},
        data() {
            return {
                listLoading: true,
                executorRules: {
                    name: [{required: true, message: '输入名字', executor: 'blur'}],
                    description: [{required: true, message: '输入执行器描述', executor: 'blur'}]
                },
                executorList: [],
                selectInfo: {
                    currentPage: 1,
                    pageSize: 10,
                    total: 0
                },
                dialogTableVisible: false,
                executorInfo: {
                    name: null,
                    description: null,
                    groupId: null
                },
                groupList: []
            }
        },
        mounted() {
            this.getExecutorList()
        },
        methods: {
            addExecutorBtn(row) {
                commonUtils.clearObject(this.executorInfo)
                getAllGroup().then(response => {
                    if (response.length == 0) {
                        this.$alert('请先创建组')
                        return
                    }
                    this.groupList.splice(0, this.groupList.length)
                    this.groupList = this.groupList.concat(response)
                    this.groupMap = commonUtils.listToObjectMap(response, 'id')
                    if (row) {
                        this.executorInfo.id = row.executor.id
                        this.executorInfo.name = row.executor.name
                        this.executorInfo.groupId = row.executor.groupId
                        this.executorInfo.description = row.executor.description
                    } else {
                        this.executorInfo.groupId = response[0].id
                    }
                    this.dialogTableVisible = true
                })
            },
            pageChange(currentPage) {
                this.selectInfo.currentPage = currentPage
                this.getExecutorList()
            },
            parseTime: parseTime,
            getExecutorList() {
                getAllExecutor(this.selectInfo).then(response => {
                    this.selectInfo.currentPage = response.pageInfo.currentPage
                    this.selectInfo.pageSize = response.pageInfo.pageSize
                    this.selectInfo.total = response.pageInfo.total
                    this.executorList = response.executorList
                    this.listLoading = false
                })
            },
            // v-el-drag-dialog onDrag callback function
            handleDrag() {
                this.$refs.select.blur()
            },
            saveExecutor() {
                this.$refs.executorForm.validate(valid => {
                    if (valid) {
                        //校验执行器组
                        if (this.executorInfo.groupId == null) {
                            this.$alert('请选择组')
                            return
                        }
                        let groupInfo = this.groupMap.get(this.executorInfo.groupId)
                        this.executorInfo.groupName = groupInfo.name
                        this.executorInfo.mail = groupInfo.mail
                        addExecutor(this.executorInfo).then(() => {
                            this.$alert('保存成功')
                            this.getExecutorList()
                            this.dialogTableVisible = false
                        })
                    } else {
                        this.$alert('表单填写错误')
                        return false
                    }
                })
            },
            deleteExecutor(row) {
                this.$confirm('此操作将永久删除, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    deleteExecutor({executorId: row.executor.id}).then(() => {
                        this.$alert('保存成功')
                        this.getExecutorList()
                        this.dialogTableVisible = false
                    })
                })
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
