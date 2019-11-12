<template>
  <div class="app-container">
    <el-row>
      <el-form :inline="true" :model="selectInfo">
        <div style="display: inline">
          <el-form-item label="用户名">
            <el-input v-model="selectInfo.name" placeholder="用户名"/>
          </el-form-item>
          <el-form-item label="用户状态">
            <el-select placeholder="请选择状态">
              <el-option v-for="status in statusList" :label="status.value" :value="status.key"/>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getUserList">
              查询
            </el-button>
          </el-form-item>
        </div>
        <el-form-item>
          <el-button type="success" @click="addUserBtn(null)">
            新增用户
          </el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row>
      <el-table v-loading="listLoading" :data="userList" border fit highlight-current-row style="width: 100%">
        <el-table-column align="center" label="ID" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="用户名">
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="用户组">
          <template slot-scope="scope">
            <span>{{ scope.row.groupName }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态">
          <template slot-scope="scope">
            <span v-if="scope.row.status==1" style="color: #67C23A;font-weight: bold">{{ statusMap.get(scope.row.status) }}</span>
            <span v-else style="color: #F56C6C;font-weight: bold">{{ statusMap.get(scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" width="180">
          <template slot-scope="scope">
            <span>{{ scope.row.createTime==0 ? '': parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="更新时间" width="180">
          <template slot-scope="scope">
            <span>{{ scope.row.updateTime==0 ? '': parseTime(scope.row.updateTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="操作" width="400">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="small"
              icon="el-icon-edit"
              @click="addUserBtn(scope.row)"
            >
              修改
            </el-button>
            <el-button
              type="success"
              size="small"
              icon="el-icon-edit"
              @click="passwordRevert(scope.row.id)"
            >
              密码重置
            </el-button>

            <el-button
              v-if="scope.row.status==1"
              type="warning"
              size="small"
              icon="el-icon-delete"
              @click="invalid(scope.row.id)"
            >
              停用
            </el-button>

            <el-button
              v-else
              type="success"
              size="small"
              icon="el-icon-edit"
              @click="valid(scope.row.id)"
            >
              启用
            </el-button>

            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="deleteUser(scope.row.id)"
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
    <el-dialog v-el-drag-dialog :visible.sync="dialogTableVisible" title="用户信息" @dragDialog="handleDrag">
      <el-form ref="userForm" :inline="false" :model="userInfo" :rules="userRules" label-width="120px">
        <el-form-item label="用户名" prop="name">
          <el-input ref="name" v-model="userInfo.name" placeholder="用户名"/>
        </el-form-item>
        <el-form-item label="用户组" prop="group">
          <el-select v-model="userInfo.groupId" placeholder="用户组">
            <el-option v-for="group in groupList" :label="group.name" :value="group.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">

          <el-checkbox-group v-model="checkRoleList">
            <el-checkbox v-for="role in roleList" :label="role.roleName"></el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveUser">保存</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import elDragDialog from '@/directive/el-drag-dialog'
  import {getAllUser, addUser, passwordRevert, validUser, invalidUser, deleteUser} from '@/api/user'
  import {getAllGroup} from '@/api/group'
  import constant from './constant'
  import {parseTime} from '@/utils'
  import commonUtils from '@/utils/commonUtils'
  import {getAllRole, getRoleByUserId} from '@/api/role'

  export default {
    name: 'User',
    directives: {elDragDialog},
    data() {
      return {
        userRules: {
          name: [{required: true, message: '输入用户名', user: 'blur'}],
          group: [{required: false, message: '请选择用户组', trigger: 'blur'}],
          role: [{required: false, message: '请选择角色', trigger: 'blur'}]
        },
        userList: [],
        selectInfo: {
          currentPage: 1,
          pageSize: 10,
          total: 0,
          status: null
        },
        dialogTableVisible: false,
        userInfo: {
          name: null,
          roleId: null,
          groupId: null
        },
        statusMap: constant.statusMap,
        statusList: constant.statusList,
        listLoading: false,
        groupList: null,
        groupMap: null,
        roleList: null,
        roleNameIdMap: null,
        checkRoleList: []

      }
    },
    mounted() {
      this.getUserList()
    },
    methods: {
      parseTime: parseTime,
      addUserBtn(row) {
        let promiseList
        if (row) {
          promiseList = [getAllGroup(), getAllRole(), getRoleByUserId({userId: row.id})]
        } else {
          promiseList = [getAllGroup(), getAllRole()]
        }
        Promise.all(promiseList).then(reponseList => {
          this.groupList = reponseList[0]
          this.groupMap = commonUtils.listToMap(reponseList[0], 'id', 'name')
          this.roleList = reponseList[1]
          this.roleNameIdMap = commonUtils.listToMap(reponseList[1], 'roleName', 'id')
          if (row) {
            this.userInfo.id = row.id
            this.userInfo.name = row.name
            this.userInfo.groupId = row.groupId
            for (let role of  reponseList[2]) {
              this.checkRoleList.push(role.roleName)
            }
          } else {
            this.userInfo.id = null
            this.userInfo.name = null
            this.userInfo.groupId = reponseList[0][0].id
            this.userInfo.roleId = reponseList[1][0].id
          }
          this.dialogTableVisible = true
        })
      },
      pageChange(currentPage) {
        this.selectInfo.currentPage = currentPage
        this.getUserList()
      },
      getUserList() {
        getAllUser(this.selectInfo).then(response => {
          this.selectInfo = response.pageInfo
          this.userList = response.userList
        })
      },
      // v-el-drag-dialog onDrag callback function
      handleDrag() {
        this.$refs.select.blur()
      },
      saveUser() {
        this.$refs.userForm.validate(valid => {
          //校验用户组
          if (this.userInfo.groupId == null) {
            this.$alert('请选择组')
            return
          }
          //所选角色
          let roleIdList = []
          for (let roleName of this.checkRoleList) {
            roleIdList.push(this.roleNameIdMap.get(roleName))
          }
          this.userInfo.roleIdList = roleIdList
          this.userInfo.groupName = this.groupMap.get(this.userInfo.groupId)
          if (valid) {
            addUser(this.userInfo).then(() => {
              this.$alert('保存成功')
              this.getUserList()
              this.dialogTableVisible = false
            })
          } else {
            this.$alert('表单填写错误')
            return false
          }
        })
      },
      passwordRevert(userId) {
        passwordRevert({userId: userId}).then(() => {
          this.$alert('重置成功')
        })
      },
      valid(userId) {
        validUser({userId: userId}).then(() => {
          this.$alert('启用成功')
          this.getUserList()
        })
      },
      invalid(userId) {
        invalidUser({userId: userId}).then(() => {
          this.$alert('停用成功')
          this.getUserList()
        })
      },
      deleteUser(userId) {
        this.$confirm('此操作将永久删除, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteUser({userId: userId}).then(() => {
            this.$alert('删除成功')
            this.getUserList()
          })
        })
      }
    }
  }
</script>

<style lang="scss" scoped>

</style>
