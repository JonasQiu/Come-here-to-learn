const comTime = require('../Func/time')
const comFunUser = require('../User/Fun_User')
const comOrg = require('../Org/getOrg')
const comType = require('../Type/Type')
const db = wx.cloud.database()
const _ = db.command

function getPageList(startNum, Num) {
    // startNum 从0开始获取
    // Num 获取数量
    return new Promise((resolve, reject) => {
        db.collection('Eco').count().then(res => {
            let isBottom = startNum + Num >= res.total;
            db.collection('Eco').skip(startNum).limit(Num).get().then((res) => {
                let ecoList = res.data
                if (ecoList.length < 1) {
                    resolve({
                        ecoList,
                        isBottom: true,
                    })
                }
                wx.cloud.callFunction({
                    name: 'getListEcosystem',
                    data: {
                        ecoList
                    }
                }).then(res => {
                    resolve({
                        ecoList: FixAll(res.result),
                        isBottom
                    })
                }).catch(res => {
                    reject({
                        ecoList: [],
                        isBottom: true,
                    })
                })
            }).catch(res => {
                reject({
                    ecoList: [],
                    isBottom: true,
                })
            })
        })
    })
}

function searchPage(keyWord) {
    return new Promise((resolve, reject) => {
        db.collection('Eco').where(_.or([{
            'content': db.RegExp({
                regexp: keyWord, //做为关键字进行匹配
                options: 'i', //不区分大小写
            })
        }, {
            'title': db.RegExp({
                regexp: keyWord, //做为关键字进行匹配
                options: 'i', //不区分大小写
            })
        }])).get().then((res) => {
            let ecoList = res.data
            if (ecoList.length < 1) {
                resolve(ecoList)
            }
            wx.cloud.callFunction({
                name: 'getListEcosystem',
                data: {
                    ecoList
                }
            }).then(res => {
                resolve(FixAll(res.result))
            }).catch(res => {
                reject(res)
            })
        }).catch(res => {
            reject(res)
        })
    })
}

function getPage(ecoId) {
    return new Promise((resolve, reject) => {
        db.collection('Eco').doc(ecoId).get().then((res) => {
            let ecoList = [res.data]
            if (ecoList.length < 1) {
                resolve({})
            }
            wx.cloud.callFunction({
                name: 'getListEcosystem',
                data: {
                    ecoList
                }
            }).then(res => {
                resolve(FixAll(res.result)[0])
            }).catch(res => {
                reject(res)
            })
        }).catch(res => {
            reject(res)
        })
    })
}

function getHotPageList(startNum, Num) {
    return new Promise((resolve, reject) => {
        db.collection('Eco').count().then(res => {
            let isBottom = startNum + Num >= res.total;
            db.collection('Eco').orderBy('likeNum', 'desc').skip(startNum).limit(Num).get().then((res) => {
                let ecoList = res.data
                if (ecoList.length < 1) {
                    resolve({
                        ecoList,
                        isBottom: true,
                    })
                }
                wx.cloud.callFunction({
                    name: 'getListEcosystem',
                    data: {
                        ecoList
                    }
                }).then(res => {
                    resolve({
                        ecoList: FixAll(res.result),
                        isBottom
                    })
                }).catch(res => {
                    reject({
                        ecoList: [],
                        isBottom: true,
                    })
                })
            }).catch(res => {
                reject({
                    ecoList: [],
                    isBottom: true,
                })
            })
        })
    })
}

function getNewPageList(startNum, Num) {
    return new Promise((resolve, reject) => {
        db.collection('Eco').count().then(res => {
            let isBottom = startNum + Num >= res.total;
            db.collection('Eco').orderBy('createTime', 'desc').skip(startNum).limit(Num).get().then((res) => {
                let ecoList = res.data
                if (ecoList.length < 1) {
                    resolve({
                        ecoList,
                        isBottom: true,
                    })
                }
                wx.cloud.callFunction({
                    name: 'getListEcosystem',
                    data: {
                        ecoList
                    }
                }).then(res => {
                    resolve({
                        ecoList: FixAll(res.result),
                        isBottom
                    })
                }).catch(res => {
                    reject({
                        ecoList: [],
                        isBottom: true,
                    })
                })
            }).catch(res => {
                reject({
                    ecoList: [],
                    isBottom: true,
                })
            })
        })
    })
}

function getHistoryPage() {
    return new Promise((resolve, reject) => {
        let history = wx.getStorageSync('history_Eco')
        let pList = []
        for (let i = 0; i < history.length; i++) {
            pList[i] = getPage(history[i])
        }
        (async () => {
            for (let i = 0; i < pList.length; i++) {
                pList[i] = await pList[i]
            }
            resolve(pList)
        })()
    })
}

function FixAll(ecoList) {
    for (let i = 0; i < ecoList.length; i++) {
        ecoList[i].orgInfo = comOrg.isCollect([ecoList[i].orgInfo])[0]
        ecoList[i].userInfo = comFunUser.fixUserInfo(ecoList[i].userInfo)
    }
    return fixTime(isLike(ecoList))
}

function isLike(ecoList) {
    let userInfo = wx.getStorageSync('userInfo')
    for (let i = 0; i < ecoList.length; i++) {
        ecoList[i].isLike = (!!userInfo && (ecoList[i].likes.indexOf(userInfo._id) > -1))
    }
    return ecoList;
}

function fixTime(ecoList) {
    for (let i = 0; i < ecoList.length; i++) {
        ecoList[i].fixCreateTime = comTime.showTime(ecoList[i].createTime)
        ecoList[i].fixLastTime = comTime.showTime(ecoList[i].lastTime)
    }
    return ecoList;
}

function fixLikeUser(ecoList) {
    return new Promise((resolve, reject) => {
        let pList = []
        let list = [...ecoList]
        for (let i = 0; i < list.length; i++) {
            pList[i] = comFunUser.getInfoList(list[i].likes)
        }
        (async () => {
            for (let i = 0; i < pList.length; i++) {
                list[i].likes = (await pList[i])
            }
            resolve(list)
        })()
    })
}

function fixComments(ecoObj) {
    // 传入单个obj，返回获取评论人完整用户信息的ecoObj数据
    return new Promise(async (resolve, reject) => {
        let likeCommentList = wx.getStorageSync('like_comment')
        likeCommentList = likeCommentList ? likeCommentList : []
        for (let j = 0; j < ecoObj.comments.length; j++) {
            ecoObj.comments[j]['userInfo'] = await comFunUser.getUserInfo(ecoObj.comments[j].userId)
            ecoObj.comments[j]['showTime'] = comTime.showTime(ecoObj.comments[j]['time'])
            ecoObj.comments[j]['isMyLike'] = likeCommentList.indexOf(ecoObj.comments[j].Id) > -1
        }
        resolve(ecoObj)
    })
}

function FixUserType(ecoList) {
    let UserTypeList = ['普通用户', '专业人士', '机构', '官方']
    let index;
    for (let i = 0; i < ecoList.length; i++) {
        index = ecoList[i].userInfo.userType - 1
        ecoList[i].userInfo.fixUserType = UserTypeList[index]
        if (index in [1, 2]) {
            ecoList[i].userInfo.fixUserType = comType.getTypeName(ecoList[i].userInfo.type) + ' ' + ecoList[i].userInfo.fixUserType
        }
    }
    return ecoList;
}

function getEcoByOrg(orgId) {
    // 传入机构ID，返回该机构宿主发表的生态圈文章
    return new Promise((resolve, reject) => {
        db.collection('Eco').where({
            orgInfo: {
                orgId
            }
        }).get().then(res => {
            wx.cloud.callFunction({
                name: 'getListEcosystem',
                data: {
                    ecoList: res.data
                }
            }).then(res => {
                resolve(FixAll(res.result))
            }).catch(res => {
                reject(res)
            })
        }).catch(res => {
            reject(res)
        })
    })
}

function reLoadPageList(pageList) {
    return new Promise(async (resolve, reject) => {
        let p = []
        for (let i = 0; i < pageList.length; i++) {
            p.push(getPage(pageList[i]._id))
        }
        for (let i = 0; i < p.length; i++) {
            pageList[i] = await p[i]
        }
        resolve(pageList)
    })
}

module.exports = {
    getPage,
    getPageList,
    getHotPageList,
    getNewPageList,
    getHistoryPage,
    fixLikeUser,
    searchPage,
    isLike,
    FixUserType,
    fixComments,
    getEcoByOrg,
    FixAll,
    reLoadPageList
}