import {
  TEMP_PATH
} from '../constants'

import {
  invoke
} from '../../bridge'

import {
  warpPlusErrorCallback,
  getFileName
} from '../util'

import {
  t
} from 'uni-core/helpers/i18n'

export function chooseVideo ({
  sourceType,
  compressed,
  maxDuration,
  camera
} = {}, callbackId) {
  const errorCallback = warpPlusErrorCallback(callbackId, 'chooseVideo', 'cancel')

  function successCallback (tempFilePath = '') {
    const filename = `${TEMP_PATH}/compressed/${Date.now()}_${getFileName(tempFilePath)}`
    const compressVideo = compressed ? new Promise((resolve) => {
      plus.zip.compressVideo({
        src: tempFilePath,
        filename
      }, ({ tempFilePath }) => {
        resolve(tempFilePath)
      }, () => {
        resolve(tempFilePath)
      })
    }) : Promise.resolve(tempFilePath)
    if (compressed) {
      plus.nativeUI.showWaiting()
    }
    compressVideo.then(tempFilePath => {
      if (compressed) {
        plus.nativeUI.closeWaiting()
      }
      plus.io.getVideoInfo({
        filePath: tempFilePath,
        success (videoInfo) {
          const result = {
            errMsg: 'chooseVideo:ok',
            tempFilePath: tempFilePath
          }
          result.size = videoInfo.size
          result.duration = videoInfo.duration
          result.width = videoInfo.width
          result.height = videoInfo.height
          invoke(callbackId, result)
        },
        fail: errorCallback
      })
    })
  }

  function openAlbum () {
    plus.gallery.pick(({ files }) => successCallback(files[0]), errorCallback, {
      filter: 'video',
      system: false,
      // 不启用 multiple 时 system 无效
      multiple: true,
      maximum: 1,
      filename: TEMP_PATH + '/gallery/',
      permissionAlert: true
    })
  }

  function openCamera () {
    const plusCamera = plus.camera.getCamera()
    plusCamera.startVideoCapture(successCallback, errorCallback, {
      index: camera === 'front' ? 2 : 1,
      videoMaximumDuration: maxDuration,
      filename: TEMP_PATH + '/camera/'
    })
  }

  if (sourceType.length === 1) {
    if (sourceType.includes('album')) {
      openAlbum()
      return
    } else if (sourceType.includes('camera')) {
      openCamera()
      return
    }
  }
  plus.nativeUI.actionSheet({
    cancel: t('uni.chooseVideo.cancel'),
    buttons: [{
      title: t('uni.chooseVideo.sourceType.camera')
    }, {
      title: t('uni.chooseVideo.sourceType.album')
    }]
  }, e => {
    switch (e.index) {
      case 1:
        openCamera()
        break
      case 2:
        openAlbum()
        break
      default:
        errorCallback()
        break
    }
  })
}
