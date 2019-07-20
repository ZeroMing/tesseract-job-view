<template>
  <div class="app-container">
    <el-row>
      <el-form :inline="true" :model="selectInfo">
        <el-form-item label="菜单名">
          <el-input v-model="selectInfo.name" placeholder="菜单名"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getMenuList">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="addMenuInfo">新增菜单</el-button>
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
        <el-table-column align="center" label="菜单名">
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="父菜单">
          <template slot-scope="scope">
            <span>{{ scope.row.parentName }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="路径">
          <template slot-scope="scope">
            <span>{{ scope.row.path }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="展示名称">
          <template slot-scope="scope">
            <span>{{ scope.row.metaTitle }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="是否缓存">
          <template slot-scope="scope">
            <span>{{ cacheMap.get(scope.row.metaNoCache)}}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="创建人">
          <template slot-scope="scope">
            <span>{{ scope.row.createUserName }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="创建时间" width="180">
          <template slot-scope="scope">
            <!--            <span>{{ !scope.row.createTime || scope.row.createTime==0 ? '': parseTime(scope.row.createTime) }}</span>-->
          </template>
        </el-table-column>

        <el-table-column align="center" label="操作" width="440">
          <template slot-scope="scope">
            <el-button
              type="warning"
              size="small"
              icon="el-icon-edit"
              @click="modify(scope.row)"
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

        <el-form-item label="菜单名" prop="name">
          <el-input ref="name" v-model="menuInfo.name" placeholder="菜单名"/>
        </el-form-item>

        <el-form-item label="父菜单" prop="parentMenu">
          <el-select v-model="menuInfo.parentId" placeholder="父菜单">
            <el-option v-for="menu in allMenuList" :label="menu.value" :value="menu.key"/>
          </el-select>
        </el-form-item>

        <el-form-item label="路径" prop="path">
          <el-input ref="path" v-model="menuInfo.path" placeholder="路径"/>
        </el-form-item>

        <el-form-item label="菜单标题" prop="metaTitle">
          <el-input ref="metaTitle" v-model="menuInfo.metaTitle" placeholder="菜单标题"/>
        </el-form-item>

        <el-form-item label="是否缓存" prop="metaNoCache">
          <el-radio-group v-model="menuInfo.metaNoCache">
            <el-radio :label="0">不缓存</el-radio>
            <el-radio :label="1">缓存</el-radio>
          </el-radio-group>
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
    getAllMenu, addMenu, deleteMenu, executeMenu, startMenu, stopMenu, menuList
  } from '@/api/menu'
  import {getAllExecutorNoDetail} from '@/api/executor'
  import {parseTime} from '@/utils'
  import constant from './constant'
  import commonUtils from '@/utils/commonUtils'

  export default {
    name: 'Menu',
    directives: {elDragDialog},
    data() {
      let validateCache = (rule, value, callback) => {
        if (data.menuInfo.metaNoCache) {
          callback()
        } else {
          callback(new Error('请选择是否缓存'));
        }
      };
      let validateParent = (rule, value, callback) => {
        if (data.menuInfo.parentId) {
          callback()
        } else {
          callback(new Error('请选择父菜单'));
        }
      };
      let data = {
        menuRules: {
          name: [{required: true, message: '请输入菜单名', trigger: 'blur'}],
          path: [{required: true, message: '请输入路径', trigger: 'blur'}],
          description: [{required: true, message: '输入菜单描述', trigger: 'blur'}],
          metaTitle: [{required: true, message: '请输入菜单标题', trigger: 'blur'}],
          metaNoCache: [{validator: validateCache, trigger: 'blur'}],
          parentMenu: [{validator: validateParent, trigger: 'blur'}]
        },
        menuList: [],
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
          parentId: null
        },
        listLoading: false,
        allMenuList:
          [{"key": null, "value": "无"}],
        cacheList: constant.cacheList,
        cacheMap: constant.cacheMap
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
          this.selectInfo = response.pageInfo
          this.menuList = response.menuList
        })
      },
      // v-el-drag-dialog onDrag callback function
      handleDrag() {
        this.$refs.select.blur()
      },
      addMenuInfo() {
        this.menuInfo = {}
        // 获取执行器列表
        getAllMenu().then((response) => {
          this.menuMap = commonUtils.listToMap(response, 'id', 'metaTitle');
          this.allMenuList.splice(1)
          for (let menu of response) {
            this.allMenuList.push({"key": menu.id, "value": menu.metaTitle})
          }
          this.dialogTableVisible = true
        })
      },
      saveMenu() {
        this.$refs.menuForm.validate(valid => {
          if (valid) {
            this.menuInfo.parentName = this.menuMap.get(this.menuInfo.parentId)
            addMenu(this.menuInfo).then(() => {
              this.$alert('保存成功')
              this.getMenuList()
              this.dialogTableVisible = false
            })
          } else {
            this.$alert('表单填写错误')
            return false
          }
        })
      },
      modify(row) {
        this.menuInfo = row
        // 获取执行器列表
        getAllExecutorNoDetail().then((response) => {
          this.executorList = response
          if (this.executorList.length == 0) {
            this.$alert('请先添加执行器')
            return
          }
          this.executorMap = commonUtils.listToMap(this.executorList, 'id', 'name')
          this.dialogTableVisible = true
        })
      },
      deleteMenu(row) {
        deleteMenu({menuId: row.id}).then(() => {
          this.$alert('删除成功')
          this.getMenuList()
        })
      }
    }
  }
</script>

<style lang="scss" scoped>

</style>
