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


        <el-table-column align="center" label="创建时间" width="180">
          <template slot-scope="scope">
            <span>{{ !scope.row.createTime || scope.row.createTime==0 ? '': parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>

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
          <el-col :span="12">
            <el-tree
              @check="nodeCheck"
              :check-strictly="true"
              :data="menuTreeData"
              show-checkbox
              :highlight-current="true"
              node-key="id"
              ref="tree"
              @node-click="nodeClick"
              :default-expanded-keys="expandedKeyList"
              :default-checked-keys="checkedKeyList"
              :props="defaultProps">
            </el-tree>
          </el-col>
          <el-col :span="12">
            <el-checkbox-group v-model="btnCheckList" v-bind:style="styleObject">
              <el-checkbox v-for="btn in btnList" :label="btn.btnName"></el-checkbox>
            </el-checkbox-group>
          </el-col>
        </el-form-item>
        <el-form-item label="角色描述" props="roleDesc">
          <el-input ref="roleDesc" v-model="roleInfo.roleDesc" placeholder="角色描述"/>
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
  import {btnListByMenuIdAndRoleId, getAllBtn} from "@/api/btn";

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
          roleDesc: [{required: true, message: '请输入角色描述', trigger: 'blur'}],
        },
        roleList: [],
        btnCheckList: [],
        btnList: [],
        btnMap: null,
        selectInfo: {
          currentPage: 1,
          pageSize:
            10,
          total:
            0,
          status:
            null
        },
        styleObject: {
          display: 'none'
        },
        dialogTableVisible: false,
        roleInfo: {
          roleName: null,
          roleDesc: null,
          id: null
        },
        listLoading: false,
        prevNode: null,
        menuBtnMap: null
      }
      return data
    },
    mounted() {
      this.getRoleList()
    },
    methods: {
      nodeCheck(menu, menuNode) {
        //如果选择节点拥有父节点则默认选中父节点
        // alert(JSON.stringify(menu))
        // let node = menuNode
        // console.log(node)
        // console.log(menu)
        // while (node.isLeaf) {
        //   this.$refs.tree.setCheckedKeys([node.parent.id]);
        //   node = menuNode.parent
        // }
      },
      nodeClick(menu, menuNode) {
        //保存上一次按钮选择状态
        if (this.prevNode) {
          this.menuBtnMap.set(this.prevNode.id, this.btnCheckList)
        }
        //获取当前点击的节点下checkedList
        let menuBtnCheckList = this.menuBtnMap.get(menu.id)
        if (!menuBtnCheckList) {
          //根据点击的菜单和当前编辑角色获取角色拥有按钮
          btnListByMenuIdAndRoleId({menuId: menu.id, roleId: this.roleInfo.roleId}).then(response => {
            this.btnCheckList = []
            //放入已拥有按钮
            for (let btn of response) {
              this.btnCheckList.push(btn.btnName)
            }
            //将当前点击节点放入map
            this.menuBtnMap.set(menu.id, this.btnCheckList)
            //保存当前点击节点
            this.prevNode = menu
            this.styleObject.display = 'block'
          })
        } else {
          //如果已经获取过直接赋值
          this.btnCheckList = menuBtnCheckList
          //保存当前点击节点
          this.prevNode = menu
          this.btnVisible = 'block'
        }
      },
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
        this.styleObject.display = 'none'
        this.menuBtnMap = new Map()
        this.prevNode = null
        this.btnCheckList = []
        this.checkedKeyList = []
        let $this = this
        commonUtils.clearObject(this.roleInfo)
        Promise.all([getAllMenu(), getAllBtn()]).then((response) => {
          let {treeDataMap, treeList} = commonUtils.listToTreeData(response[0])
          $this.menuDataMap = treeDataMap
          //把菜单树形放入list
          this.menuTreeData = treeList
          //把按钮放入tmpBtnList
          $this.btnList = response[1]
          $this.btnMap = commonUtils.listToMap(response[1], 'btnName', 'id')
          //获取角色拥有的菜单
          if (row) {
            getRoleMenu({roleId: row.id}).then(response => {
                $this.checkedKeyList = response
                $this.expandedKeyList = response
                if (row) {
                  this.roleInfo.roleId = row.id
                  this.roleInfo.roleName = row.roleName
                  this.roleInfo.roleDesc = row.roleDesc
                }
                this.dialogTableVisible = true
              }
            )
          } else {
            this.dialogTableVisible = true
          }
        })
      },
      saveRole() {
        this.$refs.roleForm.validate(valid => {
          if (valid) {
            //检查prevNode
            if (this.prevNode) {
              this.menuBtnMap.set(this.prevNode.id, this.btnCheckList)
            }
            //将菜单绑定到传输数据中
            let menuInfo = []
            //获取所有点击节点，只更新点击过的节点按钮权限
            let checkedNodes = this.$refs.tree.getCheckedNodes()
            for (let node of checkedNodes) {
              //获取菜单下选择的按钮
              let checkedBtnNameList = this.menuBtnMap.get(node.id)
              let btnList = null
              if (checkedBtnNameList) {
                //如果不为空证明点击过，将按钮放入列表后端更新
                btnList = []
                for (let btnName of checkedBtnNameList) {
                  btnList.push({id: this.btnMap.get(btnName), name: btnName})
                }
              }
              menuInfo.push({menuId: node.id, menuName: node.label, btnList: btnList})
            }
            this.roleInfo.menuInfo = menuInfo
            //return
            addRole(this.roleInfo).then(() => {
              this.$message({
                message: '保存成功',
                type: 'success'
              });
              this.getRoleList()
              this.dialogTableVisible = false
            })
          } else {
            this.$message.error('表单填写错误')
            return false
          }
        })
      },
      deleteRole(row) {
        this.$confirm('此操作将永久删除, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteRole({roleId: row.id}).then(() => {
            this.$message({
              message: '删除成功',
              type: 'success'
            });
            this.getRoleList()
          })
        })

      }
    }
  }
</script>

<style scoped>
  .hide {
    display: none;
  }
</style>
