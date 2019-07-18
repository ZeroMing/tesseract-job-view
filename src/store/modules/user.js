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
        // 获取一级菜单路由
        menuList.forEach((menu, i) => {
          if (menu.parentId == null || menu.parentId === 0) {
            let alwaysShow = menu.alwaysShowFlag === 1 ? true : false;
            const module = {
              path: menu.path,
              component: Layout,
              children: [
                {
                  path: menu.path,
                  component: () => import(`@/views${menu.path}`),
                  name: menu.name,
                  meta: {title: menu.metaTitle, icon: menu.metaIcon}
                }
              ]
            }
            menuRouters.push(module)
          }
        })
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
  },

  // dynamically modify permissions
  changeRoles({commit, dispatch}, role) {
    return new Promise(async resolve => {
      const token = role + '-token'

      commit('SET_TOKEN', token)
      setToken(token)

      const {roles} = await dispatch('getInfo')

      resetRouter()

      // generate accessible routes map based on roles
      const accessRoutes = await dispatch('permission/generateRoutes', roles, {root: true})

      // dynamically add accessible routes
      router.addRoutes(accessRoutes)

      // reset visited views and cached views
      dispatch('tagsView/delAllViews', null, {root: true})

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
