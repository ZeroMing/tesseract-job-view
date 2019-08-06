<template>
  <div class="app-container">
    <el-row>
      <el-form :inline="true" :model="selectInfo">
        <el-form-item label="菜单名">
          <el-input v-model="selectInfo.metaTitle" placeholder="菜单名"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getMenuList">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="addMenuInfo(null)">新增菜单</el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row>
      <el-table v-loading="listLoading" :data="menuList" border fit highlight-current-row style="width: 100%">
        <el-table-column align="center" label="ID" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="菜单名" width="100">
          <template slot-scope="scope">
            <span>{{ scope.row.metaTitle }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="父菜单">
          <template slot-scope="scope">
            <span>{{ scope.row.parentName }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="资源路径" width="150">
          <template slot-scope="scope">
            <span>{{ scope.row.fullPath }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="路由名">
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="路由路径">
          <template slot-scope="scope">
            <span>{{ scope.row.path }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="是否缓存">
          <template slot-scope="scope">
            <span>{{ cacheMap.get(scope.row.metaCache)}}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="创建人">
          <template slot-scope="scope">
            <span>{{ scope.row.createUserName }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="创建时间" width="180">
          <template slot-scope="scope">
            <span>{{ !scope.row.createTime || scope.row.createTime==0 ? '': parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="操作" width="200">
          <template slot-scope="scope">
            <el-button
              type="warning"
              size="small"
              icon="el-icon-edit"
              @click="addMenuInfo(scope.row)"
            >
              修改
            </el-button>

            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="deleteMenu(scope.row)"
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

    <el-dialog v-el-drag-dialog :visible.sync="dialogTableVisible" title="菜单信息" @dragDialog="handleDrag">
      <el-form ref="menuForm" :inline="false" :model="menuInfo" :rules="menuRules" label-width="120px">

        <el-form-item label="路由路径" prop="path">
          <el-input ref="path" v-model="menuInfo.path" placeholder="路由路径"/>
        </el-form-item>

        <el-form-item label="路由名" prop="path">
          <el-input ref="path" v-model="menuInfo.name" placeholder="路由名"/>
        </el-form-item>

        <el-form-item label="资源路径" prop="path">
          <el-input ref="fullPath" v-model="menuInfo.fullPath" placeholder="资源路径"/>
        </el-form-item>

        <el-form-item label="展示标题" prop="metaTitle">
          <el-input ref="metaTitle" v-model="menuInfo.metaTitle" placeholder="展示标题"/>
        </el-form-item>

        <el-form-item label="重定向路径" prop="redirect">
          <el-input ref="path" v-model="menuInfo.redirect" placeholder="重定向路径"/>
        </el-form-item>

        <el-form-item label="父菜单">
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

        <el-form-item label="是否缓存" prop="metaCache">
          <el-radio-group v-model="menuInfo.metaCache">
            <el-radio :label="0">不缓存</el-radio>
            <el-radio :label="1">缓存</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单编码" prop="code" v-if="showCode">
          <el-input ref="code" v-model="menuInfo.code" placeholder="菜单编码,设置后不可修改"/>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input v-model="menuInfo.description" type="textarea"/>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveMenu">保存</el-button>
        </el-form-item>

      </el-form>
    </el-dialog>
  </div>
</template>

<script>
    import elDragDialog from '@/directive/el-drag-dialog'
    import {
        getAllMenu, addMenu, deleteMenu, menuList
    } from '@/api/menu'
    import {parseTime} from '@/utils'
    import constant from './constant'
    import commonUtils from '@/utils/commonUtils'

    export default {
        name: 'Menu',
        directives: {elDragDialog},
        data() {
            let validateCache = (rule, value, callback) => {
                if (data.menuInfo.metaCache || data.menuInfo.metaCache == 0) {
                    callback()
                } else {
                    callback(new Error('请选择是否缓存'));
                }
            };
            let data = {
                menuRules: {
                    code: [{required: true, message: '请输入菜单编码', trigger: 'blur'}],
                    name: [{required: true, message: '请输入路由名', trigger: 'blur'}],
                    path: [{required: true, message: '请输入路由路径', trigger: 'blur'}],
                    fullPath: [{required: true, message: '请输入资源路径', trigger: 'blur'}],
                    description: [{required: true, message: '输入菜单描述', trigger: 'blur'}],
                    metaTitle: [{required: true, message: '请输入菜单显示名字', trigger: 'blur'}],
                    metaCache: [{validator: validateCache, trigger: 'blur'}]
                },
                menuList: [],
                defaultProps: {
                    children: 'children',
                    label: 'label'
                },
                menuDataMap: null,
                menuTreeData: [],
                expandedKeyList: [],
                checkedKeyList: [1, 2, 3],
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
                menuInfo: {
                    id: null,
                    code: null,
                    name: null,
                    path: null,
                    metaTitle: null,
                    metaCache: null,
                    menuDesc: null
                },
                listLoading: false,
                allMenuList:
                    [{"key": null, "value": "无"}],
                cacheList: constant.cacheList,
                cacheMap: constant.cacheMap,
                menuDataMap: null,
                showCode: false,
            }
            return data
        },
        mounted() {
            this.getMenuList()
        },
        methods: {
            pageChange(currentPage) {
                this.selectInfo.currentPage = currentPage
                this.getMenuList()
            },
            parseTime: parseTime,
            getMenuList() {
                menuList(this.selectInfo).then(response => {
                    this.selectInfo.currentPage = response.pageInfo.currentPage
                    this.selectInfo.pageSize = response.pageInfo.pageSize
                    this.selectInfo.total = response.pageInfo.total
                    this.menuList = response.menuList
                })
            },
            // v-el-drag-dialog onDrag callback function
            handleDrag() {
                this.$refs.select.blur()
            },
            addMenuInfo(row) {
                let $this = this
                if (row) {
                    $this.showCode = false;
                    row.code = null;
                } else {
                    $this.showCode = true;
                }

                // 获取菜单列表
                getAllMenu().then((response) => {
                    let {treeDataMap, treeList} = commonUtils.listToTreeData(response)
                    $this.menuDataMap = treeDataMap
                    //把菜单树形放入list
                    this.menuTreeData = treeList
                    commonUtils.clearObject(this.menuInfo)
                    this.checkedKeyList = []
                    this.expandedKeyList = []
                    if (row) {
                        this.menuInfo.id = row.id
                        this.menuInfo.code = row.code
                        this.menuInfo.name = row.name
                        this.menuInfo.path = row.path
                        this.menuInfo.fullPath = row.path
                        this.menuInfo.metaTitle = row.metaTitle
                        this.menuInfo.metaCache = row.metaCache
                        this.menuInfo.menuDesc = row.menuDesc
                        if (row.parentId != 0) {
                            this.checkedKeyList.push(row.parentId)
                            this.expandedKeyList.push(row.parentId)
                        }
                    }
                    this.dialogTableVisible = true
                })
            },
            saveMenu() {
                this.$refs.menuForm.validate(valid => {
                    let checkedNodes = this.$refs.tree.getCheckedNodes()
                    if (checkedNodes.length > 1) {
                        this.$alert("父菜单只能选择一个")
                        return
                    }
                    if (valid) {
                        let menuData = this.menuDataMap.get(checkedNodes[0].id)
                        if (menuData) {
                            this.menuInfo.parentId = menuData.id
                            this.menuInfo.parentName = menuData.label
                        }
                        addMenu(this.menuInfo).then(() => {
                            this.$message({
                                message: '保存成功',
                                type: 'success'
                            });
                            this.getMenuList()
                            this.dialogTableVisible = false
                        })
                    } else {
                        this.$message.error('表单填写错误')
                        return false
                    }
                })
            },
            deleteMenu(row) {
                this.$confirm('此操作将永久删除, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    deleteMenu({menuId: row.id}).then(() => {
                        this.$message({
                            message: '删除成功',
                            type: 'success'
                        });
                        this.getMenuList()
                    })
                })
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
