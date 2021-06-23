const app = getApp()

function Login(userInfo) {
        return new Promise((resolve, reject) => {
                wx.cloud.callFunction({
                        name: 'login',
                        data: {
                                userInfo: userInfo
                        }
                }).then(res => {
                        resolve(res.result.userInfo)
                }).catch(res => {
                        reject(res)
                })
        })
}
module.exports = {
        Login,
}