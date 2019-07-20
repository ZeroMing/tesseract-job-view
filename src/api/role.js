import request from '@/utils/request'

export function getRoleMenu(params) {
  return request({
    url: '/tesseract-role/getRoleMenu',
    method: 'get',
    params: params
  })
}


export function getRoleByUserId(params) {
  return request({
    url: '/tesseract-role/getRoleByUserId',
    method: 'get',
    params: params
  })
}

export function getAllRole(params) {
  return request({
    url: '/tesseract-role/allRole',
    method: 'get',
    params: params
  })
}

export function roleList(params) {
  return request({
    url: '/tesseract-role/roleList',
    method: 'get',
    params: params
  })
}


export function addRole(data) {
  return request({
    url: '/tesseract-role/saveOrUpdateRole',
    method: 'post',
    data: data
  })
}

export function deleteRole(data) {
  return request({
    url: '/tesseract-role/deleteRole',
    method: 'get',
    params: data
  })
}
