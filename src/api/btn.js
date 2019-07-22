import request from '@/utils/request'

export function getAllBtn(params) {
  return request({
    url: '/tesseract-btn-resource/allBtn',
    method: 'get',
    params: params
  })
}

export function btnList(params) {
  return request({
    url: '/tesseract-btn-resource/btnList',
    method: 'get',
    params: params
  })
}
export function btnListByMenuIdAndRoleId(params) {
  return request({
    url: '/tesseract-btn-resource/btnListByMenuIdAndRoleId',
    method: 'get',
    params: params
  })
}

export function addBtn(data) {
  return request({
    url: '/tesseract-btn-resource/saveOrUpdateBtn',
    method: 'post',
    data: data
  })
}

export function deleteBtn(data) {
  return request({
    url: '/tesseract-btn-resource/deleteBtn',
    method: 'get',
    params: data
  })
}

