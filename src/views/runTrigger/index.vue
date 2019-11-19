<template>
  <div v-if="$store.getters.buttons.contains('/runTrigger/index/select')" class="app-container">
    <el-row>
      <el-form :inline="true" :model="selectInfo">
        <div style="display: inline">
          <el-form-item label="触发器名称">
            <el-input v-model="selectInfo.triggerName" placeholder="执行器名称"/>
          </el-form-item>
          <el-form-item label="创建人">
            <el-input v-model="selectInfo.creator" placeholder="创建人"/>
          </el-form-item>
          <el-form-item>
            <el-button v-if="$store.getters.buttons.contains('/runTrigger/index/select')" type="primary"
                       @click="getAllFiredTrigger">查询
            </el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-row>
    <el-row>
      <el-table v-loading="listLoading"
                :data="firedTriggerList" border fit highlight-current-row style="width: 100%">
        <el-table-column align="center" label="ID" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="触发器名">
          <template slot-scope="scope">
            <span>{{ scope.row.triggerName }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="执行类名">
          <template slot-scope="scope">
            <span>{{ scope.row.className }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="执行机器">
          <template slot-scope="scope">
            <span>{{ scope.row.socket }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="执行器组">
          <template slot-scope="scope">
            <span>{{ scope.row.groupName }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="重复次数">
          <template slot-scope="scope">
            <span>{{ scope.row.retryCount }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="分片索引">
          <template slot-scope="scope">
            <span>{{ scope.row.shardingIndex }}</span>
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

        <el-table-column align="center" label="操作" width="300">
          <template slot-scope="scope">
            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="stopExecutor(scope.row)"
              v-if="$store.getters.buttons.contains('/runTrigger/index/delete')"
            >
              停止并删除
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

  </div>
  <div class="app-container" v-else>
    <p style="color: red;">您当前没有权限</p>
  </div>
</template>

<script>
    import elDragDialog from '@/directive/el-drag-dialog'
    import {getAllFiredTrigger, stopFiredTrigger} from '@/api/trigger'
    import {parseTime} from '@/utils'

    export default {
        name: 'RunTrigger',
        directives: {elDragDialog},
        data() {
            return {
                listLoading: true,
                firedTriggerList: [],
                selectInfo: {
                    currentPage: 1,
                    pageSize: 10,
                    total: 0
                },
                firedTriggerInfo: {
                    name: null,
                    description: null
                }
            }
        },
        mounted() {
            this.getAllFiredTrigger()
        },
        methods: {
            pageChange(currentPage) {
                this.selectInfo.currentPage = currentPage
                this.getAllFiredTrigger()
            },
            parseTime: parseTime,
            getAllFiredTrigger() {
                getAllFiredTrigger(this.selectInfo).then(response => {
                    this.selectInfo.currentPage = response.pageInfo.currentPage
                    this.selectInfo.pageSize = response.pageInfo.pageSize
                    this.selectInfo.total = response.pageInfo.total
                    this.firedTriggerList = response.firedTriggerList
                    this.listLoading = false
                })
            },
            // v-el-drag-dialog onDrag callback function
            handleDrag() {
                this.$refs.select.blur()
            },
            stopExecutor(row) {
                this.$confirm('此操作将永久删除并且停止当前任务, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    stopFiredTrigger({firedTriggerId: row.id}).then(() => {
                        this.$alert('停止成功')
                        this.getAllFiredTrigger()
                    })
                })
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
