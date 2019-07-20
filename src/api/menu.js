import request from '@/utils/request'

export function getAllMenu(params) {
  return request({
    url: '/tesseract-menu/allMenu',
    method: 'get',
    params: params
  })
}

export function menuList(params) {
  return request({
    url: '/tesseract-menu/menuList',
    method: 'get',
    params: params
  })
}


export function addMenu(data) {
  return request({
    url: '/tesseract-menu/saveOrUpdateMenu',
    method: 'post',
    data: data
  })
}

export function deleteMenu(data) {
  return request({
    url: '/tesseract-menu/deleteMenu',
    method: 'get',
    params: data
  })
}

