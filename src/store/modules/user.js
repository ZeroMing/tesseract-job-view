import {login, logout, getUserAuthInfo} from '@/api/user'
import {getToken, setToken, removeToken} from '@/utils/auth'
import {router, constantRoutes, resetRouter} from '@/router'
import Layout from '@/layout'

import commonUtils from '@/utils/commonUtils'

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
  login({commit, state}, userInfo) {
    const {username, password} = userInfo
    return new Promise((resolve, reject) => {
      login({username: username.trim(), password: password}).then(response => {
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
  getUserAuthInfo({commit, state}) {

    return new Promise((resolve, reject) => {
      // 从后端获取用的权限列表，扔在storage里
      getUserAuthInfo(state.token).then(response => {
        const userAuthInfo = response

        if (!userAuthInfo) {
          reject('Verification failed, please Login again.')
        }

        const {roles, name, avatar, introduction, menuList, btnList} = userAuthInfo
        // roles must be a non-empty array
        if (!roles || roles.length <= 0) {
          reject('getInfo: roles must be a non-null array!')
        }

        // 存放路由数据
        const menuRouters = []
        // 获取一级菜单路由，占时先支持二级菜单
        let menuMap = new Map()
        menuList.forEach((menu, i) => {
          let parentId = menu.parentId;
          let menuModel = {
            path: menu.path,
            component: Layout,
            redirect: menu.redirect,
            hidden: menu.hidden === 1,
            children: [{
              meta: {title: menu.metaTitle, icon: menu.metaIcon},
              path: menu.path,
              name: menu.name,
              component: () => import(`@/views${menu.path}`),
            }]
          }
          //根结点
          if (parentId === 0) {
            menuMap.set(menu.id, menuModel)
          } else {
            //二级菜单
            let parentData = menuMap.get(parentId);
            //如果父节点存在
            if (parentData) {
              parentData.alwaysShow = true
              parentData.path = menuModel.path
              parentData.name = menuModel.name
              parentData.meta = menuModel.meta
              parentData.children.splice(0)
              parentData.children.push(menuModel)
            } else {
              menuMap.set(parentId, {
                path: null,
                alwaysShow: true,
                component: Layout,
                meta: {},
                name: {},
                children: [menuModel]
              })
            }
          }
          //二级菜单
        })
        for (let item of menuMap) {
          menuRouters.push(item[1])
        }
        commit('SET_USER_ROUTERS', menuRouters.concat(constantRoutes));
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
  logout({commit, state}) {
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
  resetToken({commit}) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
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
