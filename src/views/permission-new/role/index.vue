<template>
  <div class="app-container">
    <el-row>
      <el-form :inline="true" :model="selectInfo">
        <el-form-item label="角色名">
          <el-input v-model="selectInfo.roleName" placeholder="角色名"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getRoleList">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="addRoleInfo(null)">新增角色</el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row>
      <el-table v-loading="listLoading" :data="roleList" border fit highlight-current-row style="width: 100%">
        <el-table-column align="center" label="ID" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="角色名">
          <template slot-scope="scope">
            <span>{{ scope.row.roleName }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="角色描述">
          <template slot-scope="scope">
            <span>{{ scope.row.roleDesc }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="创建人">
          <template slot-scope="scope">
            <span>{{ scope.row.createUserName }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="更新人">
          <template slot-scope="scope">
            <span>{{ scope.row.updateUserName }}</span>
          </template>
        </el-table-column>


        <!--        <el-table-column align="center" label="创建时间" width="180">-->
        <!--          <template slot-scope="scope">-->
        <!--            <span>{{ !scope.row.createTime || scope.row.createTime==0 ? '': parseTime(scope.row.createTime) }}</span>-->
        <!--          </template>-->
        <!--        </el-table-column>-->

        <el-table-column align="center" label="操作" width="440">
          <template slot-scope="scope">
            <el-button
              type="warning"
              size="small"
              icon="el-icon-edit"
              @click="addRoleInfo(scope.row)"
            >
              修改
            </el-button>

            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="deleteRole(scope.row)"
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
    <el-dialog v-el-drag-dialog :visible.sync="dialogTableVisible" title="角色信息" @dragDialog="handleDrag">
      <el-form ref="roleForm" :inline="false" :model="roleInfo" :rules="roleRules" label-width="120px">
        <el-form-item label="角色名" props="roleName">
          <el-input ref="name" v-model="roleInfo.roleName" placeholder="角色名"/>
        </el-form-item>
        <el-form-item label="菜单">
          <el-tree
            :data="menuTreeData"
            show-checkbox
            node-key="id"
            ref="tree"
            :default-expanded-keys="expandedKeyList"
            :default-checked-keys="checkedKeyList"
            :props="defaultProps">
          </el-tree>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveRole">保存</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import elDragDialog from '@/directive/el-drag-dialog'
  import {
    addRole, deleteRole, roleList, getRoleMenu
  } from '@/api/role'
  import {getAllExecutorNoDetail} from '@/api/executor'
  import {parseTime} from '@/utils'
  import constant from './constant'
  import commonUtils from '@/utils/commonUtils'
  import {getAllMenu} from "@/api/menu";

  export default {
    name: 'Role',
    directives: {elDragDialog},
    data() {
      let data = {
        defaultProps: {
          children: 'children',
          label: 'label'
        },
        menuDataMap: null,
        menuTreeData: [],
        expandedKeyList: [],
        checkedKeyList: [],
        roleRules: {
          roleName: [{required: true, message: '请输入角色名', trigger: 'blur'}],
        },
        roleList: [],
        selectInfo:
          {
            currentPage: 1,
            pageSize:
              10,
            total:
              0,
            status:
              null
          }
        ,
        dialogTableVisible: false,
        roleInfo: {
          roleName: null,
          id: null
        },
        listLoading: false
      }
      return data
    },
    mounted() {
      this.getRoleList()
    },
    methods: {
      pageChange(currentPage) {
        this.selectInfo.currentPage = currentPage
        this.getRoleList()
      },
      parseTime: parseTime,
      getRoleList() {
        roleList(this.selectInfo).then(response => {
          this.selectInfo = response.pageInfo
          this.roleList = response.roleList

        })
      },
      // v-el-drag-dialog onDrag callback function
      handleDrag() {
        this.$refs.select.blur()
      },
      addRoleInfo(row) {
        let $this = this
        this.menuTreeData.splice(0)
        this.roleInfo = {}
        // 获取菜单列表
        getAllMenu().then((response) => {
          let map = this.listToTreeData(response)
          $this.menuDataMap = map
          //把菜单树形放入list
          for (let item of map) {
            this.menuTreeData.push(item[1])
          }
          //获取角色拥有的菜单
          if (row) {
            getRoleMenu({roleId: row.id}).then(response => {
                $this.checkedKeyList = response
                $this.expandedKeyList = response
                if (row) {
                  let roleName = row.roleName;
                  let id = row.id;
                  this.roleInfo.roleId = id
                  this.roleInfo.roleName = roleName
                }
                this.dialogTableVisible = true
              }
            )
          } else {
            this.dialogTableVisible = true
          }
        })
      },
      listToTreeData(list) {
        let treeDataMap = new Map();
        for (let item of list) {
          let id = item.id
          let metaTitle = item.metaTitle
          let parentId = item.parentId;
          //如果为根结点
          if (parentId == 0) {
            let newVar = treeDataMap.get(id);
            //如果对象存在的情况下更新
            if (newVar) {
              newVar.id = id
              newVar.label = metaTitle
            } else {
              newVar = {id: id, label: metaTitle, children: []}
              treeDataMap.set(id, newVar)
            }
            continue
          }
          //如果是非根节点
          let parentValue = treeDataMap.get(parentId);
          if (!parentValue) {
            //如果父节点为空，初始化父节点
            parentValue = {id: parentId, label: null, children: []}
            treeDataMap.set(parentId, parentValue)
          }
          //保存当前节点
          let currentValue = {id: id, label: metaTitle, children: []}
          treeDataMap.set(id, currentValue)
          //将当前节点加入到父节点
          parentValue.children.push(currentValue)
        }
        return treeDataMap
      },
      saveRole() {
        this.$refs.roleForm.validate(valid => {
          if (valid) {
            //将菜单绑定到传输数据中
            let menuInfo = []
            let checkedNodes = this.$refs.tree.getCheckedNodes()
            for (let node of checkedNodes) {
              menuInfo.push({menuId: node.id, menuName: node.label})
            }

            this.roleInfo.menuInfo = menuInfo
            addRole(this.roleInfo).then(() => {
              this.$alert('保存成功')
              this.getRoleList()
              this.dialogTableVisible = false
            })
          } else {
            this.$alert('表单填写错误')
            return false
          }
        })
      },
      deleteRole(row) {
        deleteRole({roleId: row.id}).then(() => {
          this.$alert('删除成功')
          this.getRoleList()
        })
      }
    }
  }
</script>

<style lang="scss" scoped>

</style>
