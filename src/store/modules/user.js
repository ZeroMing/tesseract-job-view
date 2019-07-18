import { login, logout, getUserAuthInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import router, { resetRouter } from '@/router'
import Layout from '@/layout'
import chartsRouter from "../../router/modules/charts";
import nestedRouter from "../../router/modules/nested";
import tableRouter from "../../router/modules/table";
import componentsRouter from '../../router/modules/components'

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  introduction: '',
  roles: [],
  userInfo: null,
  userRouters: [],
  buttons: []
}

const mutations = {
  SET_USER_INFO: (state, userInfo) => {
    state.userInfo = userInfo
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_USER_ROUTERS: (state, userRouters) => {
    state.userRouters = userRouters
  },
  SET_BUTTONS: (state, buttons) => {
    state.buttons = buttons
  }
}

const actions = {
  // user login
  login({ commit, state }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password: password }).then(response => {
        const userInfo = response
        commit('SET_TOKEN', userInfo.token)
        commit('SET_USER_INFO', userInfo)
        setToken(userInfo.token)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // 获取用户信息
  // get user info
  getUserAuthInfo({ commit, state }) {

    return new Promise((resolve, reject) => {
      // const userInfo = state.userInfo
      // const { roles, name, avatar, introduction } = userInfo
      // // roles must be a non-empty array
      // if (!roles || roles.length <= 0) {
      //   reject('getInfo: roles must be a non-null array!')
      // }
      // commit('SET_ROLES', roles)
      // commit('SET_NAME', name)
      // commit('SET_AVATAR', avatar)
      // commit('SET_INTRODUCTION', introduction)
      // resolve(userInfo)
      // 从后端获取用的权限列表，扔在storage里
      getUserAuthInfo(state.token).then(response => {
        const userAuthInfo = response

        if (!userAuthInfo) {
          reject('Verification failed, please Login again.')
        }

        const { roles, name, avatar, introduction, menuList, btnList } = userAuthInfo
        // roles must be a non-empty array
        if (!roles || roles.length <= 0) {
          reject('getInfo: roles must be a non-null array!')
        }

        /*
        菜单实体类字段:
          name          菜单名称
          path          路径
          url_parttern  路径匹配模式
          redirect      默认跳转地址
          level         菜单级别
          title         前端显示名称
          icon          图标
          alwaysShow    是否一直显示
         */

        /*
        模拟数据
        const menuRouters = [
          {
            path: '/permission',
            component: Layout,
            redirect: '/permission/page',
            alwaysShow: true, // will always show the root menu
            name: 'Permission12121212',
            meta: {
              title: 'Permission121211212'
              // icon: 'lock'
              // roles: ['admin', 'editor'] // you can set roles in root nav
            },
            children: [
              {
                path: 'page',
                component: () => import('@/views/permission/page'),
                name: 'PagePermission',
                meta: {
                  title: 'PagePermission',
                  fullPath:'/',
                  // roles: ['admin'] // or you can only set roles in sub nav
                }
              },
              {
                path: 'directive',
                component: () => import('@/views/permission/directive'),
                name: 'DirectivePermission',
                meta: {
                  title: 'DirectivePermission'
                  // if do not set roles, means: this page does not require permission
                }
              }
            ]
          },
          // 404 page must be placed at the end !!!
          { path: '*', redirect: '/404', hidden: true }
        ]*/
        function isHaveChild(compareList,targetId) {
          let childFlag = 0
          compareList.forEach((compare, i) => {
            if(targetId === compare.parentId){
              childFlag = 1
              return false
            }
          });
          return childFlag
        }


        // 存放路由数据
        const menuRouters = []
        // 获取一级菜单路由
        menuList.forEach((menu, i) => {
          if (menu.parentId == null || menu.parentId === 0) {
            if(isHaveChild(menuList,menu.id) === 1){
              menu.fullPath = '/' + menu.path
              let alwaysShow = menu.alwaysShowFlag === 1 ? true : false;
              const module = {
                path: '/' + menu.path,
                // 一级路由默认值
                component: Layout,
                // 后端返回，可配置
                redirect: menu.redirect,
                alwaysShow: alwaysShow,
                meta: {
                  id: menu.id ,
                  title: menu.name ,
                  icon: menu.icon ,
                  fullPath: '/' + menu.path ,
                  noCache: true
                }
              }
              menuRouters.push(module)
            }else{
              menu.fullPath = '/' + menu.path
              let alwaysShow = menu.alwaysShowFlag === 1 ? true : false;
              let indexPath = menu.path + "/index";
              const module = {
                path: '/'+ menu.path,
                component: Layout,
                alwaysShow: alwaysShow,
                meta: {
                  id: menu.id ,
                  icon: menu.icon ,
                  fullPath: '/' + menu.path ,
                  noCache: true
                },
                children: [
                  {
                    path: 'index',
                    component: () => import(`@/views/${indexPath}`),
                    meta: {
                      title: menu.name
                    }
                  }
                ]
              }
              menuRouters.push(module)
            }
          }
        })

        // 定义递归方法
        function convertTree(routers) {
          routers.forEach(r => {
            menuList.forEach((m, i) => {
              if (m.parentId && m.parentId === r.meta.id) {
                if (!r.children) r.children = []
                m.fullPath = r.meta.fullPath + '/' + m.path
                const menu = {
                  path: m.path,
                  // 注意: webpack 编译es6 动态引入 import() 时不能传入变量。需要字符串模板。坑
                  component: () => import(`@/views${m.fullPath}`),
                  meta: {
                    id: m.id,
                    title: m.name,
                    icon: m.icon,
                    fullPath: r.meta.fullPath + '/' + m.path,
                    noCache: true
                  }
                }
                r.children.push(menu)
              }
            })
            if (r.children) convertTree(r.children)
          })
        }
        // constantRoutes.forEach(router => {
        //   menuRouters.push(router)
        // })
        // 404 page must be placed at the end !!!
        // const NOTFOUND_ROUTER = { path: '*', redirect: '/404', hidden: true }
        // menuRouters.push(NOTFOUND_ROUTER)
        // 递归填充
        convertTree(menuRouters)
        // console.info(menuRouters)
        commit('SET_USER_ROUTERS', menuRouters);
        commit('SET_BUTTONS', btnList)
        commit('SET_ROLES', roles)
        commit('SET_NAME', name)
        commit('SET_AVATAR', avatar)
        commit('SET_INTRODUCTION', introduction)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  changeRoles({ commit, dispatch }, role) {
    return new Promise(async resolve => {
      const token = role + '-token'

      commit('SET_TOKEN', token)
      setToken(token)

      const { roles } = await dispatch('getInfo')

      resetRouter()

      // generate accessible routes map based on roles
      const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })

      // dynamically add accessible routes
      router.addRoutes(accessRoutes)

      // reset visited views and cached views
      dispatch('tagsView/delAllViews', null, { root: true })

      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
