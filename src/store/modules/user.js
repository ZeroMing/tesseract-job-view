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
        let menuMap = new Map()
        menuList.forEach((menu, i) => {
          let parentId = menu.parentId;
          let menuModel = {
            path: menu.path,
            component: Layout,
            metaTitle: menu.metaTitle,
            metaIcon: menu.metaIcon,
            name: menu.name,
            redirect: menu.redirect,
            hidden: menu.hidden === 1,
            children: [{
              meta: {title: menu.metaTitle, icon: menu.metaIcon},
              path: menu.path,
              name: menu.name,
              component: () => import(`@/views${menu.fullPath}`),
            }]
          }
          //根结点
          if (parentId === 0) {
            let currentMenu = menuMap.get(menu.id)
            //如果节点不存在
            if (!currentMenu) {
              currentMenu = menuModel
              menuMap.set(menu.id, currentMenu)
            } else {
              //如果节点存在则更新
              currentMenu.path = menu.path
              currentMenu.meta.title = menu.metaTitle
              currentMenu.meta.icon = menu.metaIcon
              currentMenu.name = menu.name
              currentMenu.redirect = menu.redirect
            }
          } else {
            //修改model为子菜单
            menuModel = {
              meta: {title: menu.metaTitle, icon: menu.metaIcon},
              path: menu.path,
              name: menu.name,
              component: () => import(`@/views${menu.fullPath}`),
            }
            //二级菜单
            let parentData = menuMap.get(parentId);
            //如果父节点存在
            if (parentData) {
              //修改父节点
              if (!parentData.alwaysShow) {
                parentData.alwaysShow = true
                let meta = {title: parentData.metaTitle, icon: parentData.metaIcon}
                parentData.meta = meta
                parentData.children = []
              }
              parentData.children.push(menuModel)
            } else {
              menuMap.set(parentId, {
                path: null,
                redirect: null,
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
        console.log(JSON.stringify(menuRouters))
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
